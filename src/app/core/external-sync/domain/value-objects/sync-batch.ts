import { ExportedRow, ExportedRows } from '@core/_common/export/exportable-data';

/**
 * Lo que se sincroniza son las filas que entrega el origen, tal cual: tablas con nombre
 * (`'recipes'`, `'supplies'`, …) de registros planos.
 *
 * El dominio **no conoce las tablas ni sus columnas**. Aquí solo se transportan y se cuentan, que es
 * lo que hace que este contexto sirva para sincronizar cualquier cosa.
 */
export type SyncRows = ExportedRows;
export type SyncRow = ExportedRow;

/**
 * Un envío completo: qué filas, cuándo y con qué identificador de petición.
 *
 * `requestId` es la clave de idempotencia: el destino recuerda los lotes que ya aplicó, así que
 * reintentar el mismo no vuelve a escribir. `syncedAt` se estampa en cada fila porque el origen
 * puede no guardar fecha de modificación — es la única marca temporal garantizada.
 */
export class SyncBatch {
  private constructor(
    readonly requestId: string,
    readonly syncedAt: string,
    private readonly rows: SyncRows,
  ) {}

  static of(rows: SyncRows, requestId: string, syncedAt: string): SyncBatch {
    return new SyncBatch(requestId, syncedAt, rows);
  }

  get isEmpty(): boolean {
    return this.total === 0;
  }

  /** Cuántas filas van en el lote, en total. */
  get total(): number {
    return Object.values(this.rows).reduce((sum, table) => sum + table.length, 0);
  }

  /** Las filas listas para el destino: las mismas columnas más `syncedAt`. */
  payload(): Record<string, readonly SyncRow[]> {
    const stamped: Record<string, readonly SyncRow[]> = {};
    for (const [table, rows] of Object.entries(this.rows)) {
      stamped[table] = rows.map((row) => ({ ...row, syncedAt: this.syncedAt }));
    }
    return stamped;
  }
}
