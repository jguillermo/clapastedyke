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
import { mergeRows } from './merge-rows';
import { Cells, flatten, rebuild } from './row-shape';
import { canonicalCells, ID_COLUMN, SERVICE_COLUMNS, TableShape } from './table-columns';
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
  const { table, shape } = translated;
  const apply: TableRow[] = [];
  const remember: ShadowRow[] = [];
  let deletions = 0;

  for (const registro of plan.pull) {
    const flat = valuesOf(registro);
    // Lo que se guarda aquí es un **documento**, con sus objetos anidados, no la fila plana con la que
    // se compara: escribirlo plano dejaría `purchasePrice.amount` como una clave literal y el
    // repositorio que lo lea no encontraría el precio por ningún lado — el insumo desaparecería de la
    // lista sin que nada avisara.
    apply.push(asRecord(tombstoned(flat, registro.sync.deleted, now)));
    // Y lo que se recuerda es lo que hay **en el destino**, sin la lápida que se acaba de añadir aquí:
    // el shadow describe la hoja, y apuntarle un campo que la hoja no tiene haría creer, al ciclo
    // siguiente, que alguien le ha borrado esa columna.
    remember.push(await shadowOf(table, shape, registro, flat));
    if (registro.sync.deleted) {
      deletions += 1;
    }
  }

  const pushed: RawRow[] = [];
  for (const registro of plan.push) {
    const values = valuesOf(registro);
    const row = await sheetRow(shape, registro, values, deviceId);
    pushed.push(row);
    remember.push(await shadowOf(table, shape, registro, values));
  }

  const writes: RemoteWrite[] = [];
  if (pushed.length > 0) {
    writes.push({
      kind: 'upsert',
      table,
      columns: [...shape.headers],
      rows: renderAll(shape, mergeRows(translated.existing, pushed)),
    });
  }

  // El estampado de una fila que alguien tecleó sin id, y la devolución de un id que alguien cambió,
  // van **en su propia fila**: reescribir el bloque las movería de sitio, y las puso ahí una persona.
  //
  // Y con las columnas que la hoja tiene AHORA, no con las que tendrá: estampar es escribir en una
  // posición, y la posición la fija la cabecera escrita.
  const stampColumns = [...translated.remoteColumns, ...SERVICE_COLUMNS];
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

/**
 * La fila plana convertida en el documento que se guarda: `purchasePrice.amount` vuelve a ser un
 * objeto dentro de otro.
 *
 * Es el reverso exacto de `flatten`, y por eso la comparación y el almacenamiento pueden usar formas
 * distintas: **plana para comparar** —así dos dispositivos que cambian campos anidados distintos del
 * mismo precio se pueden fusionar en vez de chocar— y **anidada para guardar**, que es como la
 * entiende quien la lee.
 */
function asRecord(flat: TableRow): TableRow {
  const armed = rebuild(flat);
  return 'values' in armed ? (armed.values as TableRow) : flat;
}

/** Los campos de negocio de un registro, sin sus metadatos de sincronización. */
function valuesOf(registro: Registro): TableRow {
  const { sync: _sync, ...values } = registro;
  return values as TableRow;
}

/**
 * Una fila que baja borrada tiene que **llegar borrada**.
 *
 * El borrado viaja en la columna de servicio `borrado`, que es lo que lee el motor, pero aquí lo que
 * marca un documento como borrado es su propio `deletedAt`. Casi siempre viene en los datos —porque el
 * documento local lo tiene y la hoja lo espeja—, pero no cuando la lápida se sintetizó a partir de lo
 * que el shadow recordaba de una fila que alguien borró a mano: ahí no hay `deletedAt` que copiar.
 *
 * Sin esto, esa fila se guardaría **viva** y el ciclo siguiente la volvería a subir: el borrado que
 * alguien hizo en la hoja no se aplicaría nunca.
 */
function tombstoned(values: TableRow, deleted: boolean, now: number): TableRow {
  if (!deleted || canonicalText(values['deletedAt']).length > 0) {
    return values;
  }
  return { ...values, deletedAt: new Date(now).toISOString() };
}

/**
 * Una fila lista para el destino: sus celdas de datos y, al final, las de servicio.
 *
 * La huella se calcula **aquí y ahora**, sobre el contenido que se va a escribir. Es la condición para
 * que «la huella no cuadra ⇒ lo tocó una persona» sea cierto: si el contenido y su huella pudieran
 * salir de dos momentos distintos, cualquier fila propia parecería editada a mano.
 */
async function sheetRow(
  shape: TableShape,
  registro: Registro,
  values: TableRow,
  deviceId: string,
): Promise<RawRow> {
  const cells = flatten(values);
  const fingerprint = (await fingerprintFor(shape, cells)) ?? '';

  return {
    id: canonicalText(cells[ID_COLUMN]),
    cells: {
      ...textOf(cells),
      version: versionOf(registro),
      origen: deviceId,
      huella: fingerprint,
      borrado: registro.sync.deleted ? FLAG_TRUE : '',
    },
  };
}

/** Lo que se recordará de esta fila: es el ancestro con el que se fusionará la próxima vez. */
async function shadowOf(
  table: string,
  shape: TableShape,
  registro: Registro,
  values: TableRow,
): Promise<ShadowRow> {
  return {
    table,
    rowId: canonicalCode(values.id),
    fingerprint: (await fingerprintFor(shape, flatten(values))) ?? '',
    version: versionOf(registro),
    deleted: registro.sync.deleted,
    values,
  };
}

function versionOf(registro: Registro): string {
  return registro.sync.updatedAt ?? registro.sync.createdAt;
}

/** Las filas fusionadas, con sus celdas puestas en el orden de la cabecera. */
function renderAll(shape: TableShape, rows: readonly RawRow[]): string[][] {
  return rows.map((row) => shape.headers.map((column) => row.cells[column] ?? ''));
}

function textOf(cells: Cells): Record<string, string> {
  const text: Record<string, string> = {};
  for (const [column, value] of Object.entries(cells)) {
    text[column] = value === null || value === undefined ? '' : String(value);
  }
  return text;
}

async function fingerprintFor(shape: TableShape, cells: Cells): Promise<string | null> {
  const canonical = canonicalCells(shape, cells);
  return 'values' in canonical ? await fingerprintOf(canonical.values) : null;
}

/** Las columnas de servicio, expuestas para quien componga cabeceras fuera de aquí. */
export { SERVICE_COLUMNS };
