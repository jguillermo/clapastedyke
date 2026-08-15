/**
 * La traducción entre **una pestaña de una hoja** y las dos listas que el motor sabe reconciliar.
 *
 * El motor decide sobre registros con id, huella, borrado y versión. Una hoja de cálculo no es eso:
 * es una cuadrícula que una persona puede editar, en la que se puede teclear una fila nueva sin id,
 * cambiarle el id a otra, borrar una entera o escribir una fecha imposible en la columna de versión.
 * **Todo eso se resuelve aquí**, antes de que el motor vea nada, porque el motor no sabe —ni tiene que
 * saber— qué es una hoja.
 *
 * ## Las cinco cosas que hace una persona, y cómo se detecta cada una
 *
 * | Lo que hizo | Cómo se sabe | Qué se hace |
 * |---|---|---|
 * | Editó una celda | la huella escrita no cuadra con la del contenido | se le da versión de **ahora**: gana |
 * | Borró la fila entera | su id está en el shadow y ya no está en la hoja | lápida incondicional: el destino manda |
 * | Tecleó una fila sin id | la fila tiene contenido y la celda del id está vacía | se **adopta**: id nuevo, y se le estampa de vuelta |
 * | Le cambió el id a una fila | su contenido sin id coincide con el de una fila local que ya no está en la hoja | se le **devuelve** el suyo |
 * | Escribió una versión imposible | la fecha viene del futuro | se re-estampa (lo hace el motor) |
 *
 * ## Por qué la huella vacía significa «adoptar» y no «editada a mano»
 *
 * Una fila **sin huella** es una fila que este motor nunca escribió: o la hoja es anterior a que
 * existiera la columna, o la acaba de teclear alguien. Si se tratara como edición manual, el primer
 * ciclo contra una hoja que ya existía vería *todas* las filas sin huella, les pondría versión nueva a
 * todas, y a la vez las vería como cambios locales porque el shadow está vacío: el catálogo entero
 * colisionaría en el mismo ciclo y se resolvería por desempate de dispositivo, o sea **al azar**.
 *
 * Se adoptan: se toma su versión si la traen y se deja que la comparación normal decida.
 */

import { LogicalVersion } from '../../domain/services/engine/hybrid-clock';
import { Registro } from '../../domain/services/engine/engine.types';
import { RawRow, RemoteRow, RemoteTable } from '../../domain/repositories/remote.repository';
import { TableRow } from '../../domain/repositories/local.repository';
import { ShadowRow } from '../../domain/services/sync-shadow';
import { canonicalCode, canonicalText } from '../sheet-canonical';
import { fingerprintOf } from '../sheet-hash';
import { Cells, flatten } from './row-shape';
import { canonicalCells, ID_COLUMN, shapeOf, TableShape } from './table-columns';

/** Cuánto vive una lápida antes de tirarse de la hoja. */
export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Una fila que alguien tecleó sin id: hay que devolverle su identidad a su propia fila. */
export interface HandAdd {
  readonly index: number;
  readonly id: string;
  readonly fingerprint: string;
  readonly version: string;
}

/** Una fila a la que alguien le cambió el id. Se le devuelve el suyo, en su sitio. */
export interface Reid {
  readonly index: number;
  readonly id: string;
  readonly previous: string;
}

export interface TranslatedTable {
  readonly table: string;
  readonly shape: TableShape;
  /** Lo que hay en el destino, en la forma que el motor entiende. */
  readonly base: readonly Registro[];
  /** Lo que hay aquí, en la misma forma. */
  readonly data: readonly Registro[];
  /** Dónde está cada fila del destino, por id. Para escribir sin moverla. */
  readonly positions: ReadonlyMap<string, number>;
  /** El contenido crudo de la pestaña, para poder reescribirla conservando lo ajeno. */
  readonly existing: readonly RawRow[];
  /**
   * Las columnas que la pestaña tiene **ahora mismo**, no las que tendrá.
   *
   * Escribir una celda suelta es escribir en una posición, y la posición la fija la cabecera que hay
   * escrita. `shape` puede traer columnas nuevas —un campo que ningún ciclo ha subido todavía— que
   * aún no están en la hoja: usar `shape` para estampar correría la celda una columna a la derecha y
   * escribiría la versión encima del origen.
   */
  readonly remoteColumns: readonly string[];
  readonly handAdds: readonly HandAdd[];
  readonly reids: readonly Reid[];
  /** Lápidas lo bastante viejas como para tirarlas. */
  readonly purge: readonly number[];
  /**
   * Cuántas filas ha borrado **una persona** en la hoja (estaban en el shadow y ya no están).
   *
   * Se cuentan aparte de las lápidas normales porque son las únicas que puede haber provocado un
   * accidente —una lectura a medias, un `Ctrl+Z` desafortunado— y son las que mira la barrera de
   * borrado masivo. Un borrado hecho desde la app llega con su lápida y no cuenta aquí.
   */
  readonly handDeletes: number;
  /** Por qué esta tabla no se puede tocar este ciclo. `null` = se puede. */
  readonly barrier: string | null;
}

export interface TranslateInput {
  readonly remote: RemoteTable;
  readonly local: readonly TableRow[];
  readonly shadow: readonly ShadowRow[];
  readonly now: number;
  readonly deviceId: string;
  readonly newIdentity: () => string;
}

/**
 * Traduce una pestaña y sus filas locales a lo que el motor necesita.
 *
 * Es `async` por una sola razón: la huella se calcula con `crypto.subtle`, que lo es. Nada aquí toca
 * la red ni la base de datos.
 */
export async function translateTable(input: TranslateInput): Promise<TranslatedTable> {
  const { remote, local, shadow, now, deviceId } = input;
  const shape = shapeOf(
    remote.columns,
    local.map(flatten),
    remote.rows.map((row) => flatten(row.values)),
  );

  const barrier = barrierFor(remote, shadow);
  if (barrier !== null) {
    return empty(remote.table, shape, barrier);
  }

  const localCells = new Map(local.map((row) => [canonicalCode(row.id), flatten(row)]));
  const remoteIds = new Set<string>();
  const positions = new Map<string, number>();
  const base: Registro[] = [];
  const handAdds: HandAdd[] = [];
  const reids: Reid[] = [];
  const purge: number[] = [];
  let handDeletes = 0;

  // Las filas locales que la hoja ya no menciona son las candidatas a «alguien le cambió el id»: se
  // compara su contenido SIN el id, que es lo único que sobrevive a ese cambio.
  const identityless = await identitylessIndex(shape, local);

  for (const row of remote.rows) {
    const cells = flatten(row.values);
    const fingerprint = await fingerprintFor(shape, cells);
    if (fingerprint === null) {
      // Una celda que no se puede leer: la fila no entra en la decisión y no se sobrescribe nunca —
      // escribirle nuestro valor encima borraría el intento de corrección de una persona.
      continue;
    }

    const id = canonicalText(cells[ID_COLUMN]);
    if (id.length === 0) {
      const adopted = await adopt(input, row, cells, shape);
      base.push(adopted.registro);
      handAdds.push(adopted.handAdd);
      remoteIds.add(canonicalCode(adopted.handAdd.id));
      positions.set(canonicalCode(adopted.handAdd.id), row.index);
      continue;
    }

    const key = canonicalCode(id);
    const previous = localCells.has(key)
      ? null
      : identityless.get(await identitylessOf(shape, cells));
    const resolved = previous ?? id;

    if (previous !== null && previous !== undefined) {
      reids.push({ index: row.index, id: previous, previous: id });
    }

    remoteIds.add(canonicalCode(resolved));
    positions.set(canonicalCode(resolved), row.index);
    base.push(registroFrom(resolved, row, cells, fingerprint, now, deviceId));

    if (row.meta.deleted && isOldTombstone(row.meta.version, now)) {
      purge.push(row.index);
    }
  }

  // Lo que el shadow recuerda y la hoja ya no tiene: alguien borró esa fila a mano. El motor no
  // deduce un borrado de una ausencia —y hace bien, porque «no está» también es «nunca llegó»—, así
  // que la lápida se sintetiza aquí, que es el único sitio que sabe lo que había antes.
  for (const remembered of shadow) {
    const key = canonicalCode(remembered.rowId);
    if (remoteIds.has(key)) {
      continue;
    }
    base.push(tombstone(remembered, now, deviceId));
    if (!remembered.deleted) {
      // Solo cuenta como borrado a mano lo que estaba VIVO la última vez que se vio: una lápida que
      // se purgó de la hoja por vieja no es nadie borrando nada.
      handDeletes += 1;
    }
  }

  const data = await Promise.all(
    local.map((row) => localRegistro(shape, row, shadowOf(shadow, row.id), deviceId)),
  );

  return {
    table: remote.table,
    shape,
    base,
    data,
    positions,
    existing: remote.raw,
    remoteColumns: remote.columns,
    handAdds,
    reids,
    purge,
    handDeletes,
    barrier: null,
  };
}

/**
 * Por qué una tabla no se puede tocar. Dos barreras, y las dos existen porque el coste de
 * equivocarse es borrar datos en todos los dispositivos a la vez.
 *
 * **La pestaña no está.** «No hay filas» combinado con «lo que estaba y ya no está, se borró» borra la
 * tabla entera. Un clic derecho en «Eliminar hoja» no puede costar eso.
 *
 * **Falta una columna que antes estaba.** Si alguien borra el rótulo de una columna, sus celdas dejan
 * de tener nombre y no vuelven: la fila parecería editada a mano con ese campo en blanco, y el campo
 * se borraría en todas partes. Se sabe porque el shadow guarda los valores de la última fila remota
 * conocida, así que se ve qué columnas había.
 */
function barrierFor(remote: RemoteTable, shadow: readonly ShadowRow[]): string | null {
  if (!remote.present) {
    // Solo es una barrera si **se sabía que tenía contenido**. Una pestaña que nunca ha existido —una
    // hoja recién creada, o una tabla que se acaba de añadir al array— no la ha borrado nadie: la
    // crea la primera escritura. Sin esta distinción, conectar una cuenta nueva fallaría siempre.
    return shadow.length > 0 ? `falta la pestaña «${remote.table}»` : null;
  }

  if (remote.columns.length === 0) {
    // Una pestaña sin cabecera no es «han borrado una columna»: es que está vacía, o que nunca se ha
    // escrito. Quien tiene que hablar entonces es el tope de borrado masivo, que además dice cuántas
    // filas se perderían — mucho más útil que señalar una columna al azar.
    return null;
  }

  // Las columnas que el shadow recuerda. Sus valores se guardan ya planos —es la forma con la que se
  // compara— así que sus claves SON los nombres de columna.
  const known = new Set<string>();
  for (const row of shadow) {
    for (const column of Object.keys(row.values ?? {})) {
      known.add(column);
    }
  }
  const present = new Set(remote.columns);
  const missing = [...known].filter((column) => !present.has(column));

  return missing.length > 0
    ? `la pestaña «${remote.table}» ha perdido la columna «${missing[0]}»`
    : null;
}

function empty(table: string, shape: TableShape, barrier: string): TranslatedTable {
  return {
    table,
    shape,
    base: [],
    data: [],
    positions: new Map(),
    existing: [],
    handAdds: [],
    reids: [],
    purge: [],
    handDeletes: 0,
    remoteColumns: [],
    barrier,
  };
}

/**
 * Un registro del destino, con la versión que le toca.
 *
 * Aquí está la detección de edición manual, que es lo que hace que la hoja sea de verdad la fuente de
 * la verdad: la app escribe **siempre** el contenido y su huella juntos, así que si al recalcularla no
 * coincide, esa fila la tocó una persona. Y una persona que corrige un precio no actualiza la columna
 * de versión — sin esto, la resolución por versión pisaría su corrección sin dejar rastro.
 */
function registroFrom(
  id: string,
  row: RemoteRow,
  cells: Cells,
  fingerprint: string,
  now: number,
  deviceId: string,
): Registro {
  const written = row.meta.fingerprint;
  const adopted = written.length === 0;
  const handEdited = !adopted && written.toLowerCase() !== fingerprint;

  const version = handEdited
    ? LogicalVersion.of(now, 0, deviceId).toString()
    : canonicalText(row.meta.version);

  return {
    ...cells,
    [ID_COLUMN]: id,
    sync: {
      id: ID_COLUMN,
      keyfinder: fingerprint,
      deleted: row.meta.deleted,
      createdAt: version,
    },
  } as Registro;
}

/**
 * Una fila que alguien tecleó a mano: se le da identidad y se apunta que hay que estampársela **en su
 * propia fila**, sin moverla — la puso ahí quien la escribió.
 *
 * Sin el estampado de vuelta, el ciclo siguiente volvería a verla sin id y le inventaría otra
 * identidad: un agregado nuevo cada dos minutos, para siempre.
 *
 * La huella que se estampa es la del contenido **con el id ya puesto**, que es lo que quedará escrito.
 * Estampar la de antes haría que el ciclo siguiente viera que no cuadra y diera la fila por editada a
 * mano — con versión nueva, ganándole a cualquier cambio legítimo de otro dispositivo.
 */
async function adopt(
  input: TranslateInput,
  row: RemoteRow,
  cells: Cells,
  shape: TableShape,
): Promise<{ registro: Registro; handAdd: HandAdd }> {
  const id = input.newIdentity();
  const version = LogicalVersion.of(input.now, 0, input.deviceId).toString();
  const withId = { ...cells, [ID_COLUMN]: id };
  const fingerprint = (await fingerprintFor(shape, withId)) ?? '';

  return {
    registro: {
      ...withId,
      sync: {
        id: ID_COLUMN,
        keyfinder: fingerprint,
        deleted: row.meta.deleted,
        createdAt: version,
      },
    } as Registro,
    handAdd: { index: row.index, id, fingerprint, version },
  };
}

/** La lápida de una fila que estaba y ya no está. El borrado del destino no se discute. */
function tombstone(remembered: ShadowRow, now: number, deviceId: string): Registro {
  return {
    ...(remembered.values ?? {}),
    [ID_COLUMN]: remembered.rowId,
    sync: {
      id: ID_COLUMN,
      keyfinder: remembered.fingerprint ?? '',
      deleted: true,
      createdAt: LogicalVersion.of(now, 0, deviceId).toString(),
    },
  } as Registro;
}

/**
 * Un registro de aquí.
 *
 * Su versión sale de la fecha de guardado del propio documento, que es lo único que este lado sabe de
 * cuándo cambió. Sin ella el motor decide a ciegas y gana el destino — que es lo prudente, pero
 * pierde una edición local legítima, así que se aprovecha siempre que se pueda leer.
 *
 * Y el ancestro (`syncedValues`) es lo que el shadow recuerda de la última vez que los dos lados
 * coincidieron: sin él no se puede fusionar campo a campo y gana un lado entero.
 */
async function localRegistro(
  shape: TableShape,
  row: TableRow,
  remembered: ShadowRow | undefined,
  deviceId: string,
): Promise<Registro> {
  const cells = flatten(row);
  const fingerprint = await fingerprintFor(shape, cells);
  const changedAt = Date.parse(canonicalText(row['updatedAt']));

  return {
    ...cells,
    sync: {
      id: ID_COLUMN,
      keyfinder: fingerprint,
      deleted: canonicalText(row['deletedAt']).length > 0,
      createdAt: Number.isFinite(changedAt)
        ? LogicalVersion.of(changedAt, 0, deviceId).toString()
        : '',
      ...(remembered?.values ? { syncedValues: remembered.values } : {}),
    },
  } as Registro;
}

function shadowOf(shadow: readonly ShadowRow[], id: string): ShadowRow | undefined {
  const key = canonicalCode(id);
  return shadow.find((row) => canonicalCode(row.rowId) === key);
}

/**
 * El índice de «contenido sin id» → id, solo de las filas locales.
 *
 * Es lo que reconoce que a una fila le cambiaron el id: el id es lo único que cambió, así que
 * comparando lo demás se sabe cuál era. Es el desenlace más silencioso de todos si no se corrige — el
 * id viejo desaparece (se daría por borrado el agregado), el nuevo parece un alta, y todo lo que
 * apuntaba al viejo queda colgando mientras la hoja parece perfecta.
 */
async function identitylessIndex(
  shape: TableShape,
  local: readonly TableRow[],
): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  for (const row of local) {
    index.set(await identitylessOf(shape, flatten(row)), row.id);
  }
  return index;
}

async function identitylessOf(shape: TableShape, cells: Cells): Promise<string> {
  const withoutId = { ...cells, [ID_COLUMN]: '' };
  const canonical = canonicalCells(shape, withoutId);
  return 'values' in canonical ? await fingerprintOf(canonical.values) : '';
}

/** La huella del contenido, o `null` si alguna celda no se puede leer. */
async function fingerprintFor(shape: TableShape, cells: Cells): Promise<string | null> {
  const canonical = canonicalCells(shape, cells);
  return 'values' in canonical ? await fingerprintOf(canonical.values) : null;
}

/** `true` si una lápida es lo bastante vieja como para tirarla de la hoja. */
function isOldTombstone(version: string, now: number): boolean {
  const parsed = LogicalVersion.parse(version);
  return parsed !== null && parsed.millis < now - TOMBSTONE_TTL_MS;
}
