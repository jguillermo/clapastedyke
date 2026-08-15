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

  for (const registro of plan.pull) {
    const payload = payloadOfRegistro(registro);
    // Lo que se guarda aquí es el **documento**, con su fecha de guardado y su lápida puestas: ni una
    // ni otra viajan, así que se sintetizan de la versión y de la columna `borrado`.
    apply.push(recordFrom(payload, versionOf(registro), registro.sync.deleted, now));
    remember.push(await shadowOf(table, registro, payload));
    if (registro.sync.deleted) {
      deletions += 1;
    }
  }

  const pushed: RawRow[] = [];
  for (const registro of plan.push) {
    const payload = payloadOfRegistro(registro);
    pushed.push(await sheetRow(registro, payload, deviceId));
    remember.push(await shadowOf(table, registro, payload));
  }

  const writes: RemoteWrite[] = [];
  if (pushed.length > 0) {
    writes.push({
      kind: 'upsert',
      table,
      columns: [...SHEET_HEADERS],
      rows: renderAll(mergeRows(translated.existing, pushed)),
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

  return { writes, apply, remember, deletions };
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
