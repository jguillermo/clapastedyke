/**
 * Del plan del motor a **lo que hay que escribir** en cada lado.
 *
 * El motor contesta con dos listas de registros —lo que sube y lo que baja— y no sabe nada de cómo se
 * escriben. Aquí se traduce eso a: las filas que hay que guardar en la tabla local, las operaciones
 * que van al lote del destino, y lo que hay que recordar en el shadow **después** de que las dos cosas
 * se confirmen.
 *
 * ## Las tres reglas que gobiernan este fichero
 *
 * **La huella se recalcula siempre, aquí.** Un registro fusionado sale del motor con la huella marcada
 * como «hay que recalcularla» (`null`), porque su contenido es nuevo y no coincide con la de ningún
 * lado. Y aunque no lo fuera, recalcularla es lo único que garantiza que el contenido y su huella se
 * escriban **juntos y coherentes**: si se escribiera una huella vieja, el ciclo siguiente daría la fila
 * por editada a mano.
 *
 * **La tabla se reescribe entera, fusionando con lo que hay.** Se parte de las filas tal y como están
 * escritas y se pisan las que cambian. Así escribir es idempotente, se conserva el orden de filas que
 * el usuario ve, y no desaparece lo que este código no entiende: una fila sin id que alguien acaba de
 * teclear, una en cuarentena, o una columna que ningún registro produce.
 *
 * **El shadow se apunta después, nunca antes.** Es lo que hará de ancestro en el ciclo siguiente:
 * apuntarlo sobre una escritura que aún puede fallar congelaría un ancestro falso, y a partir de ahí
 * el motor atribuiría al destino cambios que fueron locales — perdiéndolos en silencio.
 */

import { EnginePlan, Registro } from '../../domain/services/engine/engine.types';
import { LogicalVersion } from '../../domain/services/engine/hybrid-clock';
import { TableRow } from '../../domain/repositories/local.repository';
import { RawRow, RemoteWrite } from '../../domain/repositories/remote.repository';
import { ShadowRow } from '../../domain/services/sync-shadow';
import { canonicalCode, canonicalText, FLAG_TRUE } from '../sheet-canonical';
import { fingerprintOf } from '../sheet-hash';
import { DATA_COLUMN, ID_COLUMN, SHEET_HEADERS } from '../sheet-schema';
import { mergeRows } from './merge-rows';
import { canonicalJson, Payload, recordFrom } from './record-json';
import { TranslatedTable } from './remote-registros';

export interface TableWrites {
  /** Lo que hay que escribir en el destino, listo para el lote. */
  readonly writes: readonly RemoteWrite[];
  /** Lo que hay que guardar aquí. */
  readonly apply: readonly TableRow[];
  /** Lo que habrá que recordar **una vez confirmado** todo lo anterior. */
  readonly remember: readonly ShadowRow[];
  /** Cuántas de las filas que bajan son borrados. Lo mira la barrera de borrado masivo. */
  readonly deletions: number;
  /**
   * Cuántas filas locales solo reciben **su fecha**, sin cambiar de contenido.
   *
   * Se cuentan aparte de las que bajan de verdad porque no son un cambio de datos: contarlas como
   * tales anunciaría al usuario que su catálogo cambió cada vez que se rellena una fecha de fábrica.
   */
  readonly restamped: number;
}

export interface PlanToWritesInput {
  readonly translated: TranslatedTable;
  readonly plan: EnginePlan;
  readonly deviceId: string;
  readonly now: number;
}

export async function planToWrites({
  translated,
  plan,
  deviceId,
  now,
}: PlanToWritesInput): Promise<TableWrites> {
  const { table } = translated;
  const apply: TableRow[] = [];
  const remember: ShadowRow[] = [];
  let deletions = 0;

  const applied = new Set<string>();
  for (const registro of plan.pull) {
    const payload = payloadOfRegistro(registro);
    applied.add(canonicalCode(payload.id));
    // Lo que se guarda aquí es el **documento**, con su fecha de guardado y su lápida puestas: ni una
    // ni otra viajan, así que se sintetizan de la versión y de la columna `borrado`.
    apply.push(recordFrom(payload, versionOf(registro), registro.sync.deleted, now));
    remember.push(await shadowOf(table, registro, payload));
    if (registro.sync.deleted) {
      deletions += 1;
    }
  }

  const pushed: RawRow[] = [];
  const agreed = new Map<string, string>();
  for (const registro of plan.push) {
    const payload = payloadOfRegistro(registro);
    pushed.push(await sheetRow(registro, payload, deviceId));
    remember.push(await shadowOf(table, registro, payload));
    agreed.set(canonicalCode(payload.id), versionOf(registro));
  }

  const restamped = datesFor(translated, agreed, applied, now);
  apply.push(...restamped);

  const writes: RemoteWrite[] = [];
  if (pushed.length > 0) {
    writes.push({
      kind: 'upsert',
      table,
      columns: [...SHEET_HEADERS],
      rows: renderAll(mergeRows(translated.existing, pushed)),
      previousRows: translated.existing.length,
    });
  }

  // El estampado de una fila que alguien tecleó sin id, y la devolución de un id que alguien cambió,
  // van **en su propia fila**: reescribir el bloque las movería de sitio, y las puso ahí una persona.
  //
  // Las posiciones salen de la cabecera fija: ya no hay columnas que descubrir, así que estampar no
  // puede caer una celda a la derecha como pasaba cuando la cabecera podía crecer a mitad de ciclo.
  const stampColumns = [...SHEET_HEADERS];
  for (const handAdd of translated.handAdds) {
    writes.push({
      kind: 'stamp',
      table,
      columns: stampColumns,
      index: handAdd.index,
      cells: {
        [ID_COLUMN]: handAdd.id,
        version: handAdd.version,
        origen: deviceId,
        huella: handAdd.fingerprint,
      },
    });
  }
  for (const reid of translated.reids) {
    writes.push({
      kind: 'stamp',
      table,
      columns: stampColumns,
      index: reid.index,
      cells: { [ID_COLUMN]: reid.id },
    });
  }

  if (translated.purge.length > 0) {
    writes.push({ kind: 'drop', table, indexes: translated.purge });
  }

  return { writes, apply, remember, deletions, restamped: restamped.length };
}

/**
 * Las filas locales que terminan el ciclo **sin fecha de actualización**, reescritas con la fecha que
 * ya se sabe.
 *
 * Una fila sin fecha es dato de fábrica que nadie ha tocado, y por eso pierde contra cualquier cosa que
 * haya en la hoja — que es justo lo que se quiere mientras siga siendo de fábrica. Pero en cuanto los
 * dos lados se ponen de acuerdo sobre ella, su fecha **deja de ser desconocida**: es la que lleva la
 * versión acordada. Escribirla ahí cierra el caso: la fila deja de ser de fábrica, deja de decidirse a
 * ciegas y el ciclo siguiente la ve convergida en vez de volver a compararla sin fecha.
 *
 * La fecha se toma de la **versión**, nunca de «ahora». Poner la hora del ciclo repetiría exactamente
 * el fallo que este cambio arregla: la fila quedaría más nueva que la hoja y el ciclo siguiente la
 * subiría, pisando lo que hubiera hecho otro dispositivo.
 *
 * Es un relleno de metadato puro y no toca el contenido: `payloadOf` quita `updatedAt` antes de
 * comparar, así que ninguna huella cambia y esto nunca provoca una escritura en el destino.
 */
function datesFor(
  translated: TranslatedTable,
  agreed: ReadonlyMap<string, string>,
  applied: ReadonlySet<string>,
  now: number,
): TableRow[] {
  const versions = new Map<string, string>(agreed);
  for (const registro of translated.base) {
    const key = canonicalCode((registro as unknown as Payload).id);
    if (!versions.has(key)) {
      versions.set(key, registro.sync.updatedAt ?? registro.sync.createdAt);
    }
  }

  const dated: TableRow[] = [];
  for (const row of translated.data) {
    if (canonicalText(row.sync.createdAt).length > 0) {
      continue; // ya tiene fecha: no es de fábrica
    }
    const payload = payloadOfRegistro(row);
    const key = canonicalCode(payload.id);
    if (applied.has(key)) {
      // Ya baja contenido del destino para esta fila, y ese contenido es el que gana. Volver a
      // escribirla aquí con los valores de aquí desharía la bajada — el contenido bueno duraría lo que
      // tarda la línea siguiente.
      continue;
    }
    const version = versions.get(key);
    if (version === undefined || LogicalVersion.parse(version) === null) {
      continue; // nadie sabe todavía cuándo cambió: sigue siendo de fábrica, y está bien
    }
    dated.push(recordFrom(payload, version, row.sync.deleted, now));
  }
  return dated;
}

/** Los campos de negocio de un registro, sin sus metadatos de sincronización. */
function payloadOfRegistro(registro: Registro): Payload {
  const { sync: _sync, ...values } = registro;
  return values as Payload;
}

/**
 * Una fila lista para el destino: su id, el registro en JSON y las columnas de servicio. **Todo texto**
 * — el tipo del dato viaja dentro del JSON, así que no hay nada que tipar al enviar.
 *
 * La huella se calcula **aquí y ahora**, sobre el JSON que se va a escribir. Es la condición para que
 * «la huella no cuadra ⇒ lo tocó una persona» sea cierto: si el contenido y su huella pudieran salir de
 * dos momentos distintos, cualquier fila propia parecería editada a mano.
 */
async function sheetRow(registro: Registro, payload: Payload, deviceId: string): Promise<RawRow> {
  const datos = canonicalJson(payload);

  return {
    id: canonicalText(payload[ID_COLUMN]),
    cells: {
      [ID_COLUMN]: canonicalText(payload[ID_COLUMN]),
      [DATA_COLUMN]: datos,
      version: versionOf(registro),
      origen: deviceId,
      huella: await fingerprintOf([datos]),
      borrado: registro.sync.deleted ? FLAG_TRUE : '',
    },
  };
}

/** Lo que se recordará de esta fila: es el ancestro con el que se fusionará la próxima vez. */
async function shadowOf(table: string, registro: Registro, payload: Payload): Promise<ShadowRow> {
  return {
    table,
    rowId: canonicalCode(payload.id),
    fingerprint: await fingerprintOf([canonicalJson(payload)]),
    version: versionOf(registro),
    deleted: registro.sync.deleted,
    values: payload,
  };
}

function versionOf(registro: Registro): string {
  return registro.sync.updatedAt ?? registro.sync.createdAt;
}

/** Las filas fusionadas, con sus celdas puestas en el orden de la cabecera. */
function renderAll(rows: readonly RawRow[]): string[][] {
  return rows.map((row) => SHEET_HEADERS.map((column) => row.cells[column] ?? ''));
}
