import { ExportedRow, ExportedRows } from '@core/_common/export/exportable-data';
import { RemoteSnapshot, RemoteTable } from '../domain/services/sync-reader.types';
import { ShadowRow } from '../domain/services/sync-shadow';
import { RowClock, RowVersion } from '../domain/value-objects/row-version';
import {
  authoritativeFields,
  canonicalCode,
  canonicalFlag,
  canonicalRow,
  canonicalText,
  FLAG_TRUE,
  RawValue,
} from './sheet-canonical';
import { fingerprintMatches, fingerprintOf } from './sheet-hash';
import { SheetTable } from './sheet-schema';

/**
 * **El corazón del motor**: dadas las tres copias, decide qué hay que hacer. Y nada más — no lee, no
 * escribe, no toca IndexedDB y no conoce Angular.
 *
 * Está aquí y no en un caso de uso porque es una función: mismas entradas, mismo plan. Eso permite
 * probar cada modo de fallo —una pestaña borrada, un id duplicado, una versión con el año 3000— **sin
 * red y sin hoja**, que es la única forma de cubrirlos de verdad.
 *
 * ## Cómo decide
 *
 * Comparando cada lado contra la **base** (lo último que se vio en el destino):
 *
 * | cambió local | cambió remoto | qué se hace |
 * |---|---|---|
 * | no | no | nada |
 * | sí | no | subir |
 * | no | sí | aplicar aquí |
 * | sí | sí | conflicto: gana la versión más alta |
 *
 * ## La regla que evita la tormenta: huella vacía = adoptar
 *
 * Una fila **sin huella** es una fila que este motor nunca escribió: o el destino es anterior a que
 * existiera la columna, o la añadió una persona. En los dos casos lo correcto es **adoptarla como
 * base** —apuntarla tal cual y dejar que la comparación normal decida— y no tratarla como recién
 * editada.
 *
 * Sin esta regla, el primer ciclo contra una hoja ya existente vería *todas* las filas sin huella,
 * las tomaría por ediciones manuales, les pondría a todas una versión nueva, y a la vez las vería
 * todas como cambios locales porque la base está vacía. El catálogo entero colisionaría en el mismo
 * ciclo y se resolvería por desempate de dispositivo, o sea al azar.
 *
 * Una huella **presente pero que no cuadra** sí es una edición a mano, y entonces gana.
 *
 * En el momento de adoptar, si el contenido local difiere del adoptado, **gana lo local**: hasta este
 * ciclo la app era la única fuente de esos datos, así que lo de la hoja es como mucho una copia más
 * vieja. Es la única vez que se decide así, y solo pasa una vez por destino.
 *
 * ## Qué NO decide esta función
 *
 * No decide si una fila se puede convertir en un agregado válido: eso lo sabe el contexto que posee los
 * datos y lo contesta al aplicarla. Aquí solo se aparta lo que ni siquiera se puede leer como valores.
 */

/**
 * Cuántas filas de una tabla puede borrar un ciclo antes de que deje de parecer un borrado y empiece a
 * parecer un accidente.
 *
 * La regla «estaba en la base y ya no está en el destino, luego alguien la borró» es correcta y es una
 * bomba: basta que una lectura vuelva a medias para que se convierta en «bórralo todo, en todos los
 * dispositivos». Un tope no distingue el accidente del borrado legítimo —nada puede—, pero convierte la
 * pérdida total en una pregunta al usuario.
 */
const MASS_DELETE_ROWS = 20;
const MASS_DELETE_RATIO = 0.3;

/** Por debajo de esto no se aplica el tope: en una tabla de tres filas, borrar una ya es el 33%. */
const MASS_DELETE_FLOOR = 4;

/**
 * Separadores para juntar valores sin que se puedan confundir. Se construyen con `fromCharCode` y no
 * como carácter literal porque un carácter de control es invisible en el fuente, y algo que nadie ve es
 * algo que cualquiera borra sin enterarse. Ver `sheet-hash.ts`, que hace lo mismo y por lo mismo.
 */
const CELL_SEPARATOR = String.fromCharCode(31);
const LINE_SEPARATOR = String.fromCharCode(30);

/** Las columnas de servicio. Ausentes en un destino anterior a que existieran, y eso es válido. */
const VERSION_FIELD = 'version';
const FINGERPRINT_FIELD = 'huella';
const DELETED_FIELD = 'borrado';

/** Las de servicio, para poder localizarlas por cabecera mientras no estén en el esquema. */
const SERVICE_FIELDS = new Set([VERSION_FIELD, FINGERPRINT_FIELD, DELETED_FIELD, 'origen']);

/** La tabla de líneas no se fusiona por su cuenta: es parte de su receta. Ver `blockOf`. */
const LINES_TABLE = 'recipeLines';
const LINES_PARENT = 'recipeId';
const RECIPES_TABLE = 'recipes';

/** Por qué un ciclo se niega a seguir. Ninguna de estas se aplica a medias: o todo, o nada. */
export type AbortReason =
  /** La tabla no está en el destino. Alguien borró la pestaña, o la renombró. */
  | { readonly kind: 'missing-table'; readonly table: string }
  /** Las columnas no están donde el código cree: insertaron o quitaron una. */
  | {
      readonly kind: 'headers';
      readonly table: string;
      readonly expected: readonly string[];
      readonly found: readonly string[];
    }
  /** El ciclo borraría demasiado. */
  | {
      readonly kind: 'mass-delete';
      readonly table: string;
      readonly rows: number;
      readonly base: number;
    };

/** Una fila del destino que hay que traerse. */
export interface PlannedApply {
  readonly table: string;
  readonly rowId: string;
  readonly values: Readonly<Record<string, RawValue>>;
  readonly fingerprint: string;
  readonly version: string;
}

/** Una fila que ya no está en el destino, o que está marcada como borrada. */
export interface PlannedRemove {
  readonly table: string;
  readonly rowId: string;
  readonly version: string;
  /** `true` si desapareció de la hoja (la borró una persona) en vez de llevar su lápida. */
  readonly byHand: boolean;
}

/** Una fila local que hay que llevar al destino. */
export interface PlannedPush {
  readonly table: string;
  readonly rowId: string;
  /** Dónde está en el destino, o `null` si todavía no está y hay que añadirla. */
  readonly index: number | null;
}

/** Una fila del destino que pasa a ser la base, sin aplicarse ni subirse. */
export interface PlannedAdopt {
  readonly table: string;
  readonly rowId: string;
  readonly fingerprint: string;
  readonly version: string;
  readonly deleted: boolean;
}

/** Un id que aparece en más de una fila de la misma tabla. */
export interface DuplicateIds {
  readonly table: string;
  readonly rowId: string;
  readonly indexes: readonly number[];
}

/** Una fila que no se puede ni leer: alguna celda no es lo que su columna dice. */
export interface Quarantined {
  readonly table: string;
  readonly rowId: string | null;
  readonly index: number;
  readonly field: string;
}

/** Una fila que alguien escribió a mano sin ponerle id. */
export interface HandAdd {
  readonly table: string;
  readonly index: number;
  readonly values: Readonly<Record<string, RawValue>>;
}

/** Una fila cuyo id cambió a mano: hay que devolverle el suyo. */
export interface Reid {
  readonly table: string;
  readonly rowId: string;
  readonly previousRowId: string;
  readonly index: number;
}

/** Los dos lados cambiaron y hubo que elegir. */
export interface Conflict {
  readonly table: string;
  readonly rowId: string;
  readonly winner: 'remote' | 'local';
  /** `true` si se eligió sin saber cuándo se cambió aquí (ver `localVersionOf`). */
  readonly blind: boolean;
}

/**
 * Una fila que está en los dos lados con el **mismo id** y contenido canónico distinto.
 *
 * Es el diagnóstico que justifica que la primera versión de esto corra **en simulación**: si la
 * canonización no fuera determinista, aquí saldría *el catálogo entero* con diferencias en el mismo
 * campo, y eso se ve de un vistazo antes de poder hacer daño. Con la canonización bien, esta lista solo
 * trae cambios de verdad.
 */
export interface Drift {
  readonly table: string;
  readonly rowId: string;
  readonly field: string;
  readonly local: string;
  readonly remote: string;
}

export interface MergePlan {
  readonly aborted: AbortReason | null;
  readonly adopt: readonly PlannedAdopt[];
  readonly apply: readonly PlannedApply[];
  readonly remove: readonly PlannedRemove[];
  readonly push: readonly PlannedPush[];
  readonly handAdds: readonly HandAdd[];
  readonly reids: readonly Reid[];
  readonly duplicates: readonly DuplicateIds[];
  readonly quarantined: readonly Quarantined[];
  readonly conflicts: readonly Conflict[];
  readonly drift: readonly Drift[];
}

export interface ReconcileInput {
  readonly snapshot: RemoteSnapshot;
  readonly shadow: readonly ShadowRow[];
  readonly local: ExportedRows;
  readonly tables: readonly SheetTable[];
  readonly now: number;
  readonly deviceId: string;
  /**
   * Cuándo se cambió una fila **aquí**, si se sabe.
   *
   * Hoy no se sabe: los agregados locales no guardan cuándo se guardaron, así que en un conflicto se
   * elige **sin ese dato**, gana el destino —que es la fuente de la verdad— y el conflicto queda
   * marcado como `blind`. Poner una versión de «ahora» al cambio local sería peor que no tener
   * ninguna: haría ganar siempre a lo local, incluso frente a una edición remota posterior.
   *
   * Este parámetro es la costura por la que entra el dato el día que los agregados lo lleven.
   */
  readonly localVersionOf?: (table: string, rowId: string) => string | null;
}

interface ParsedRemote {
  readonly index: number;
  readonly rowId: string;
  readonly values: Readonly<Record<string, RawValue>>;
  readonly canonical: readonly string[];
  readonly fingerprint: string;
  /** El contenido **sin su id**. Ver `identitylessOf`. */
  readonly identityless: string;
  readonly writtenFingerprint: string;
  readonly version: RowVersion | null;
  readonly deleted: boolean;
}

interface LocalRow {
  readonly rowId: string;
  readonly canonical: readonly string[];
  readonly fingerprint: string;
  readonly identityless: string;
}

/**
 * El contenido de una fila **con su id borrado**.
 *
 * Hace falta para reconocer una fila a la que alguien le cambió el id: su huella normal incluye el id,
 * así que cambiarlo la cambia y la fila deja de parecerse a sí misma. Comparando sin el id, «esto que
 * desapareció» y «esto que apareció» se reconocen como lo mismo.
 */
function identitylessOf(table: SheetTable, canonical: readonly string[], key: string): string {
  const keyIndex = authoritativeFields(table.name, table.fields).indexOf(key);
  return canonical.map((value, index) => (index === keyIndex ? '' : value)).join(CELL_SEPARATOR);
}

type Mutable = {
  -readonly [Key in keyof MergePlan]: MergePlan[Key] extends readonly (infer Item)[]
    ? Item[]
    : MergePlan[Key];
};

export async function reconcile(input: ReconcileInput): Promise<MergePlan> {
  const plan: Mutable = {
    aborted: null,
    adopt: [],
    apply: [],
    remove: [],
    push: [],
    handAdds: [],
    reids: [],
    duplicates: [],
    quarantined: [],
    conflicts: [],
    drift: [],
  };

  const merged = input.tables.filter((table) => table.key !== undefined);

  // Las barreras van ANTES de cualquier decisión: una pestaña que falta invalida el ciclo entero, no
  // solo su tabla, porque las demás se refieren por id a lo que había en ella.
  const abort = abortReasonOf(input, merged);
  if (abort) {
    return { ...plan, aborted: abort };
  }

  const remoteBlocks = remoteLineBlocks(input);
  const localBlocks = localLineBlocks(input);
  const clock = new RowClock(input.deviceId);

  const parsed = new Map<string, Awaited<ReturnType<typeof parseRemote>>>();
  for (const table of merged) {
    parsed.set(table.name, await parseRemote(input, table, remoteBlocks));
  }

  // El reloj se pone al día con TODO lo leído antes de emitir nada. Si se hiciera tabla por tabla,
  // una versión sintetizada para la primera tabla podría nacer por detrás de algo que ya estaba escrito
  // en la última, y perdería un conflicto que debía ganar.
  for (const table of merged) {
    for (const row of parsed.get(table.name)?.rows ?? []) {
      if (row.version) {
        clock.observe(row.version, input.now);
      }
    }
  }

  for (const table of merged) {
    const remote = parsed.get(table.name);
    if (!remote) {
      continue;
    }

    const duplicates = duplicatesOf(table.name, remote.rows);
    plan.duplicates.push(...duplicates);
    plan.quarantined.push(...remote.quarantined);
    plan.handAdds.push(...remote.handAdds);

    // Un id repetido no se toca por ningún lado: no se sabe cuál de las dos filas es la de verdad, y
    // escribir en una dejaría la otra reapareciendo como un fantasma en cada ciclo.
    const ambiguous = new Set(duplicates.map((duplicate) => duplicate.rowId));
    const remoteById = new Map(
      remote.rows.filter((row) => !ambiguous.has(row.rowId)).map((row) => [row.rowId, row]),
    );

    const local = await parseLocal(input, table, localBlocks);
    const localById = new Map(local.map((row) => [row.rowId, row]));
    const base = new Map(
      input.shadow.filter((row) => row.table === table.name).map((row) => [row.rowId, row]),
    );

    plan.drift.push(...driftOf(table, remoteById, localById));

    const renamed = reidsOf(table.name, remoteById, base, localById);
    plan.reids.push(...renamed.reids);

    // La fila que recibió el id cambiado no se trae como si fuera nueva: lo que toca es devolverle el
    // suyo. Traerla dejaría dos filas para el mismo dato, una con cada id.
    const renamedTo = new Set(renamed.reids.map((reid) => reid.rowId));

    const removals: PlannedRemove[] = [];
    for (const rowId of union(remoteById, localById, base)) {
      if (ambiguous.has(rowId) || renamedTo.has(rowId)) {
        continue;
      }
      decide({
        table,
        rowId,
        remote: remoteById.get(rowId),
        local: localById.get(rowId),
        base: base.get(rowId),
        movedTo: renamed.movedTo.get(rowId),
        clock,
        input,
        plan,
        removals,
      });
    }

    const mass = massDeleteOf(table.name, removals, base.size);
    if (mass) {
      return { ...plan, aborted: mass };
    }
    plan.remove.push(...removals);
  }

  return plan;
}

/** Las barreras estructurales, en orden de gravedad. */
function abortReasonOf(input: ReconcileInput, tables: readonly SheetTable[]): AbortReason | null {
  for (const table of tables) {
    const remote = tableOf(input.snapshot, table.name);
    if (!remote?.present) {
      return { kind: 'missing-table', table: table.name };
    }

    // La cabecera es la prueba de que la columna N sigue siendo el campo N. Sin ella, insertar una
    // columna a mano haría leer el precio en la columna de la moneda, y como la fila quedaría
    // internamente coherente, el error no se vería nunca.
    const found = remote.headers.map((header) => header.trim());
    const expected = table.headers.map((header) => header.trim());
    if (!sameHeaders(expected, found)) {
      return { kind: 'headers', table: table.name, expected, found };
    }
  }
  return null;
}

/**
 * Una cabecera **de más al final** se tolera: es la columna de servicio que este destino todavía no
 * conoce, o una que alguien añadió a la derecha sin estorbar a nadie. Lo que no se tolera es que
 * cambie el orden o que falte alguna, que es lo que descoloca la lectura.
 */
function sameHeaders(expected: readonly string[], found: readonly string[]): boolean {
  return expected.every((header, index) => found[index] === header);
}

function tableOf(snapshot: RemoteSnapshot, name: string): RemoteTable | undefined {
  return snapshot.tables.find((table) => table.name === name);
}

/** El tope de borrado masivo, por tabla. Solo cuenta lo que desapareció, no las lápidas. */
function massDeleteOf(
  table: string,
  removals: readonly PlannedRemove[],
  base: number,
): AbortReason | null {
  const byHand = removals.filter((removal) => removal.byHand).length;
  if (base < MASS_DELETE_FLOOR) {
    return null;
  }
  if (byHand >= MASS_DELETE_ROWS || byHand > base * MASS_DELETE_RATIO) {
    return { kind: 'mass-delete', table, rows: byHand, base };
  }
  return null;
}

function duplicatesOf(table: string, rows: readonly ParsedRemote[]): DuplicateIds[] {
  const byId = new Map<string, number[]>();
  for (const row of rows) {
    byId.set(row.rowId, [...(byId.get(row.rowId) ?? []), row.index]);
  }
  return [...byId]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([rowId, indexes]) => ({ table, rowId, indexes }));
}

/**
 * Las líneas de una receta, canonizadas y **ordenadas**, como un solo texto.
 *
 * ## Por qué las líneas no se fusionan por su cuenta
 *
 * Su tabla no tiene id: se identifica por la receta a la que pertenece. Y `(receta, insumo)` tampoco es
 * único, porque nada impide que un insumo aparezca dos veces en la misma receta. Sin identidad no hay
 * base, ni versión, ni fila que reescribir.
 *
 * Además, fusionar línea a línea puede producir estados que el dominio **no puede construir**: si dos
 * dispositivos quitan líneas distintas y se aplican las dos, la receta se queda sin ingredientes, y una
 * receta sin ingredientes no existe.
 *
 * Así que la unidad de fusión es **la receta entera**, que es justo lo que el propio dominio ya dice
 * («los ingredientes se cambian solo a través de la raíz») y la granularidad con la que la app ya
 * guarda. Editar una línea a mano se detecta como una edición **de su receta**, y entonces gana el
 * bloque completo del destino.
 *
 * Se ordenan porque su orden no es información: si no, reordenarlas parecería un cambio.
 */
function blockOf(lines: readonly (readonly string[])[]): string {
  return lines
    .map((line) => line.join(CELL_SEPARATOR))
    .sort()
    .join(LINE_SEPARATOR);
}

/** El bloque de líneas de cada receta, tal como está en el destino. */
function remoteLineBlocks(input: ReconcileInput): Map<string, string> {
  const table = input.tables.find((candidate) => candidate.name === LINES_TABLE);
  const remote = tableOf(input.snapshot, LINES_TABLE);
  if (!table || !remote?.present) {
    return new Map();
  }

  const fields = authoritativeFields(table.name, table.fields);
  const byParent = new Map<string, string[][]>();
  for (const row of remote.rows) {
    const read = (field: string): RawValue => row.cells[table.fields.indexOf(field)];
    const parent = canonicalCode(read(LINES_PARENT));
    if (parent.length === 0) {
      continue;
    }
    const canonical = canonicalRow(table.name, table.fields, read);
    if ('unreadable' in canonical) {
      // Una línea ilegible cuenta como parte del bloque: si se ignorara, la receta parecería tener una
      // línea menos y se fusionaría como si alguien la hubiera quitado.
      byParent.set(parent, [
        ...(byParent.get(parent) ?? []),
        fields.map((field) => canonicalText(read(field))),
      ]);
      continue;
    }
    byParent.set(parent, [...(byParent.get(parent) ?? []), [...canonical.values]]);
  }

  return new Map([...byParent].map(([parent, lines]) => [parent, blockOf(lines)]));
}

/** El bloque de líneas de cada receta, tal como está aquí. */
function localLineBlocks(input: ReconcileInput): Map<string, string> {
  const table = input.tables.find((candidate) => candidate.name === LINES_TABLE);
  if (!table) {
    return new Map();
  }

  const byParent = new Map<string, string[][]>();
  for (const row of input.local[LINES_TABLE] ?? []) {
    const values = asRecord(row);
    const read = (field: string): RawValue => values[field];
    const parent = canonicalCode(read(LINES_PARENT));
    if (parent.length === 0) {
      continue;
    }
    const canonical = canonicalRow(table.name, table.fields, read);
    if ('unreadable' in canonical) {
      continue;
    }
    byParent.set(parent, [...(byParent.get(parent) ?? []), [...canonical.values]]);
  }

  return new Map([...byParent].map(([parent, lines]) => [parent, blockOf(lines)]));
}

async function parseRemote(
  input: ReconcileInput,
  table: SheetTable,
  blocks: Map<string, string>,
): Promise<{
  rows: ParsedRemote[];
  quarantined: Quarantined[];
  handAdds: HandAdd[];
}> {
  const remote = tableOf(input.snapshot, table.name);
  const key = table.key ?? 'id';
  const rows: ParsedRemote[] = [];
  const quarantined: Quarantined[] = [];
  const handAdds: HandAdd[] = [];
  const columns = columnsOf(table, remote?.headers ?? []);

  for (const row of remote?.rows ?? []) {
    const values: Record<string, RawValue> = {};
    for (const [field, index] of columns) {
      values[field] = row.cells[index];
    }
    const read = (field: string): RawValue => values[field];
    const rowId = canonicalCode(read(key));

    if (rowId.length === 0) {
      // Sin id: o es una fila que alguien escribió a mano (y hay que adoptarla dándole uno), o es el
      // hueco en blanco que deja una tabla que se encogió. Lo que las distingue es si tiene contenido.
      if (hasContent(table, read)) {
        handAdds.push({ table: table.name, index: row.index, values });
      }
      continue;
    }

    const canonical = canonicalRow(table.name, table.fields, read);
    if ('unreadable' in canonical) {
      quarantined.push({
        table: table.name,
        rowId,
        index: row.index,
        field: canonical.unreadable.field,
      });
      continue;
    }

    const withLines =
      table.name === RECIPES_TABLE
        ? [...canonical.values, blocks.get(rowId) ?? '']
        : canonical.values;

    rows.push({
      index: row.index,
      rowId,
      values,
      canonical: withLines,
      fingerprint: await fingerprintOf(withLines),
      identityless: identitylessOf(table, withLines, key),
      writtenFingerprint: canonicalText(read(FINGERPRINT_FIELD)),
      version: RowVersion.parse(canonicalText(read(VERSION_FIELD))),
      deleted: canonicalFlag(read(DELETED_FIELD)) === FLAG_TRUE,
    });
  }

  return { rows, quarantined, handAdds };
}

async function parseLocal(
  input: ReconcileInput,
  table: SheetTable,
  blocks: Map<string, string>,
): Promise<LocalRow[]> {
  const key = table.key ?? 'id';
  const rows: LocalRow[] = [];

  for (const row of input.local[table.name] ?? []) {
    const values = asRecord(row);
    const read = (field: string): RawValue => values[field];
    const rowId = canonicalCode(read(key));
    if (rowId.length === 0) {
      continue;
    }

    const canonical = canonicalRow(table.name, table.fields, read);
    if ('unreadable' in canonical) {
      // Una fila local ilegible es un fallo del propio modelo, no del usuario, y no hay nada sensato
      // que hacer con ella aquí: se deja fuera y no se sube.
      continue;
    }

    const withLines =
      table.name === RECIPES_TABLE
        ? [...canonical.values, blocks.get(rowId) ?? '']
        : canonical.values;

    rows.push({
      rowId,
      canonical: withLines,
      fingerprint: await fingerprintOf(withLines),
      identityless: identitylessOf(table, withLines, key),
    });
  }

  return rows;
}

/** Las diferencias campo a campo entre los dos lados, para el diagnóstico. */
function driftOf(
  table: SheetTable,
  remote: Map<string, ParsedRemote>,
  local: Map<string, LocalRow>,
): Drift[] {
  const fields = [...authoritativeFields(table.name, table.fields)];
  if (table.name === RECIPES_TABLE) {
    fields.push('(líneas)');
  }

  const drift: Drift[] = [];
  for (const [rowId, localRow] of local) {
    const remoteRow = remote.get(rowId);
    if (!remoteRow || remoteRow.fingerprint === localRow.fingerprint) {
      continue;
    }
    for (const [index, field] of fields.entries()) {
      const here = localRow.canonical[index] ?? '';
      const there = remoteRow.canonical[index] ?? '';
      if (here !== there) {
        drift.push({ table: table.name, rowId, field, local: here, remote: there });
      }
    }
  }
  return drift;
}

/**
 * Los ids que alguien cambió a mano.
 *
 * Es el desenlace más silencioso de todos: el id viejo desaparece —y la regla de borrado lo tomaría por
 * borrado, llevándose el agregado local por delante— mientras el nuevo parece un alta. La fila
 * sobrevive con otro id, y **todas las que la citaban se quedan colgando**, mientras la columna del
 * nombre sigue mostrando lo correcto. La hoja parece perfecta y la app está rota.
 *
 * Se detecta comparando **el contenido sin el id**: si lo que desapareció reaparece con otro id, no fue
 * un borrado, fue un renombrado, y el id se devuelve a su sitio. El id no es dato del usuario — de él
 * depende que las referencias entre tablas signifiquen algo.
 *
 * La comparación va contra **lo local**, no contra la base, porque la base solo guarda la huella y la
 * huella incluye el id: una fila a la que le cambian el id deja de parecerse a sí misma. Lo local sí
 * tiene el contenido entero.
 */
function reidsOf(
  table: string,
  remote: Map<string, ParsedRemote>,
  base: Map<string, ShadowRow>,
  local: Map<string, LocalRow>,
): { reids: Reid[]; movedTo: Map<string, Reid> } {
  const unknown = [...remote.values()].filter(
    (row) => !base.has(row.rowId) && !local.has(row.rowId),
  );
  const reids: Reid[] = [];
  const movedTo = new Map<string, Reid>();

  for (const rowId of base.keys()) {
    const here = local.get(rowId);
    if (remote.has(rowId) || !here) {
      continue;
    }
    const match = unknown.find((candidate) => candidate.identityless === here.identityless);
    if (!match) {
      continue;
    }
    const reid: Reid = { table, rowId: match.rowId, previousRowId: rowId, index: match.index };
    reids.push(reid);
    movedTo.set(rowId, reid);
  }

  return { reids, movedTo };
}

function union(...maps: readonly Map<string, unknown>[]): string[] {
  return [...new Set(maps.flatMap((map) => [...map.keys()]))];
}

interface Decision {
  table: SheetTable;
  rowId: string;
  remote: ParsedRemote | undefined;
  local: LocalRow | undefined;
  base: ShadowRow | undefined;
  movedTo: Reid | undefined;
  clock: RowClock;
  input: ReconcileInput;
  plan: Mutable;
  removals: PlannedRemove[];
}

function decide(decision: Decision): void {
  const { table, rowId, remote, local, base, movedTo, clock, input, plan, removals } = decision;

  if (!remote) {
    if (!base) {
      // Solo está aquí y el destino nunca la vio: hay que subirla.
      plan.push.push({ table: table.name, rowId, index: null });
      return;
    }
    if (movedTo) {
      // No desapareció: le cambiaron el id. Lo arregla `reids`, no un borrado.
      return;
    }
    removals.push({
      table: table.name,
      rowId,
      version: clock.next(input.now).toString(),
      byHand: true,
    });
    return;
  }

  // Sin huella escrita, esta fila no la puso este motor: se adopta como base y la comparación normal
  // decide después. Es lo que evita que el primer ciclo contra una hoja ya existente colisione entera.
  if (remote.writtenFingerprint.length === 0) {
    plan.adopt.push({
      table: table.name,
      rowId,
      fingerprint: remote.fingerprint,
      version: RowVersion.adopted().toString(),
      deleted: remote.deleted,
    });
    if (!local) {
      plan.apply.push(applyOf(table.name, remote, RowVersion.adopted().toString()));
    } else if (local.fingerprint !== remote.fingerprint) {
      plan.push.push({ table: table.name, rowId, index: remote.index });
    }
    return;
  }

  // Los dos lados dicen exactamente lo mismo: no hay nada que hacer, **haya base o no**. Solo se pone
  // la base al día si le hacía falta.
  //
  // Sin esta salida, una base vacía —datos del sitio borrados, o un dispositivo estrenándose contra un
  // destino que ya llevaba huellas— haría que cada fila contara como «cambiaron los dos lados»: el
  // catálogo entero saldría como conflicto a ciegas y se reescribiría por completo para dejarlo
  // idéntico. La lápida es la excepción: ahí el contenido coincide y aun así hay que borrar.
  if (local && local.fingerprint === remote.fingerprint && !remote.deleted) {
    if (!base || base.fingerprint !== remote.fingerprint || base.deleted) {
      plan.adopt.push({
        table: table.name,
        rowId,
        fingerprint: remote.fingerprint,
        version: remote.version?.toString() ?? RowVersion.adopted().toString(),
        deleted: false,
      });
    }
    return;
  }

  const handEdited = !fingerprintMatches(remote.writtenFingerprint, remote.fingerprint);
  const remoteVersion = effectiveVersion(remote, handEdited, clock, input.now);

  const remoteChanged =
    !base || base.fingerprint !== remote.fingerprint || base.deleted !== remote.deleted;
  // Que una fila no esté aquí NO se toma por un borrado local: hoy el modelo local no sabe expresar
  // «esto se borró», así que lo que hay es una fila que nunca llegó, y el destino manda.
  const localChanged = local !== undefined && (!base || base.fingerprint !== local.fingerprint);

  if (!remoteChanged && !localChanged) {
    return;
  }

  if (remoteChanged && !localChanged) {
    applyRemote(decision, remoteVersion);
    return;
  }

  if (!remoteChanged && localChanged) {
    plan.push.push({ table: table.name, rowId, index: remote.index });
    return;
  }

  const localVersion = RowVersion.parse(input.localVersionOf?.(table.name, rowId) ?? '');
  const localWins = localVersion !== null && localVersion.isAfter(remoteVersion);
  plan.conflicts.push({
    table: table.name,
    rowId,
    winner: localWins ? 'local' : 'remote',
    blind: localVersion === null,
  });

  if (localWins) {
    plan.push.push({ table: table.name, rowId, index: remote.index });
    return;
  }
  applyRemote(decision, remoteVersion);
}

function applyRemote(decision: Decision, version: RowVersion): void {
  const { table, rowId, remote, plan, removals } = decision;
  if (!remote) {
    return;
  }
  if (remote.deleted) {
    removals.push({ table: table.name, rowId, version: version.toString(), byHand: false });
    return;
  }
  plan.apply.push(applyOf(table.name, remote, version.toString()));
}

function applyOf(table: string, remote: ParsedRemote, version: string): PlannedApply {
  return {
    table,
    rowId: remote.rowId,
    values: remote.values,
    fingerprint: remote.fingerprint,
    version,
  };
}

/**
 * Con qué versión cuenta una fila del destino.
 *
 * Una edición a mano no trae versión nueva —quien corrige un precio no toca esa columna—, así que se le
 * sintetiza una de ahora: si no, la resolución por versión pisaría su corrección sin dejar rastro.
 *
 * Y una versión **del futuro** se re-estampa en vez de respetarse. Es una columna visible y sin
 * proteger: alguien puede teclear el año 3000, o arrastrarla al ordenar. Respetarla la dejaría ganando
 * para siempre, sin forma de volver.
 */
function effectiveVersion(
  remote: ParsedRemote,
  handEdited: boolean,
  clock: RowClock,
  now: number,
): RowVersion {
  if (handEdited || remote.version === null || remote.version.isFromTheFuture(now)) {
    return clock.next(now);
  }
  return remote.version;
}

/**
 * En qué columna está cada campo.
 *
 * Los campos del esquema van por posición, que es el contrato del destino. Las **columnas de servicio**
 * se buscan además por el nombre de su cabecera, porque durante la transición viven en la hoja sin estar
 * todavía en el esquema: sin esto, un destino que ya tiene su columna de huella parecería no tener
 * ninguna y todas sus filas se adoptarían en cada ciclo, sin llegar nunca a detectar una edición a mano.
 */
function columnsOf(table: SheetTable, headers: readonly string[]): Map<string, number> {
  const columns = new Map<string, number>(table.fields.map((field, index) => [field, index]));
  for (const [index, header] of headers.entries()) {
    const name = header.trim();
    if (SERVICE_FIELDS.has(name) && !columns.has(name)) {
      columns.set(name, index);
    }
  }
  return columns;
}

/** `true` si la fila tiene algo escrito en alguna columna de datos. */
function hasContent(table: SheetTable, read: (field: string) => RawValue): boolean {
  return authoritativeFields(table.name, table.fields).some(
    (field) => canonicalText(read(field)).length > 0,
  );
}

/** Las filas exportadas son DTOs planos; leerlas por nombre de campo es lo que se espera de ellas. */
function asRecord(row: ExportedRow): Record<string, RawValue> {
  return row as Record<string, RawValue>;
}

/** El campo con el que el origen dice cuándo se guardó cada fila aquí. No es columna del destino. */
const UPDATED_AT_FIELD = 'updatedAt';

/**
 * De cuándo se guardó cada fila aquí, a una versión comparable con las del destino.
 *
 * Es lo que hace que un conflicto se resuelva **con dato** en vez de a ciegas. El instante sale del
 * origen (lo estampa su repositorio al guardar) y el dispositivo es este, porque un cambio local se
 * hizo, por definición, aquí.
 *
 * Una fila sin `updatedAt` —guardada antes de que el campo existiera— devuelve `null`, y su conflicto
 * se resuelve a favor del destino y queda marcado como a ciegas. Es lo correcto: inventarle una fecha
 * de ahora la haría ganar siempre, incluso frente a una edición remota posterior.
 */
export function localVersionsFrom(
  local: ExportedRows,
  tables: readonly SheetTable[],
  deviceId: string,
): (table: string, rowId: string) => string | null {
  const versions = new Map<string, string>();

  for (const table of tables) {
    const key = table.key;
    if (key === undefined) {
      continue;
    }
    for (const row of local[table.name] ?? []) {
      const values = asRecord(row);
      const rowId = canonicalCode(values[key]);
      const millis = Date.parse(canonicalText(values[UPDATED_AT_FIELD]));
      if (rowId.length === 0 || !Number.isFinite(millis)) {
        continue;
      }
      versions.set(`${table.name}:${rowId}`, RowVersion.of(millis, 0, deviceId).toString());
    }
  }

  return (table, rowId) => versions.get(`${table}:${rowId}`) ?? null;
}
