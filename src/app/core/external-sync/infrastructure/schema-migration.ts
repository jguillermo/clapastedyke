import { RemoteSnapshot } from '../domain/services/sync-reader.types';
import { columnLetter, rangeOf, SCHEMA_VERSION, SHEET_TABLES, SheetTable } from './sheet-schema';

/**
 * Poner al día una hoja escrita con una versión anterior del esquema.
 *
 * ## Por qué hace falta un paso explícito
 *
 * Quien ya estaba sincronizando tiene una hoja de la v3: sin las columnas de servicio y con los rótulos
 * de antes. La lectura la tolera (ver `headersMoved`), pero **escribir sin arreglar las cabeceras
 * primero** dejaría las columnas nuevas debajo de celdas en blanco, y el usuario vería cuatro columnas
 * sin nombre aparecidas de la nada.
 *
 * ## Lo que este paso NO es
 *
 * **No adopta las filas.** Eso lo hace `reconcile` solo, y por un camino mejor: una fila **sin huella**
 * es una fila que este motor nunca escribió, así que se toma como base y la comparación normal decide.
 * Esa regla no necesita saber nada de versiones de esquema, y funciona igual para una hoja de la v3 que
 * para una fila que alguien añadió a mano ayer. Ver `reconcile.ts`.
 *
 * Es la diferencia entre migrar y adoptar, y confundirlas es lo que produce la tormenta: si este paso
 * marcara las filas como recién editadas, el catálogo entero colisionaría en el mismo ciclo y se
 * resolvería por desempate de dispositivo, o sea al azar.
 *
 * Así que lo único que hay aquí son **cabeceras**.
 */

/** Un rango de la hoja y lo que hay que escribir en él. */
export interface HeaderWrite {
  /** `'Insumos'!A1:M1` */
  readonly range: string;
  readonly headers: readonly string[];
}

export interface SchemaMigration {
  /** `true` si hay algo que hacer. */
  readonly needed: boolean;
  /** La versión con la que estaba escrito el destino, o `null` si no lo decía. */
  readonly from: number | null;
  /** Las cabeceras a reescribir, una entrada por pestaña que lo necesite. */
  readonly writes: readonly HeaderWrite[];
}

/**
 * Qué hay que reescribir para que el destino quede en la versión actual del esquema.
 *
 * Se decide por **dos** cosas y no solo por la versión apuntada en `_meta`: una hoja puede decir que es
 * de la v4 y tener una cabecera a medias porque alguien la editó. Comparar los rótulos de verdad cuesta
 * lo mismo y cubre las dos.
 */
export function schemaMigrationFor(snapshot: RemoteSnapshot): SchemaMigration {
  const from = snapshot.schemaVersion;
  const writes: HeaderWrite[] = [];

  for (const table of SHEET_TABLES) {
    const remote = snapshot.tables.find((candidate) => candidate.name === table.name);
    // Una pestaña que no está no se migra: la crea quien escriba, con sus cabeceras ya puestas. Y si
    // falta, `reconcile` habrá abortado el ciclo mucho antes de llegar aquí.
    if (!remote?.present || headersUpToDate(table, remote.headers)) {
      continue;
    }
    writes.push({
      range: rangeOf(table.title, `A1:${columnLetter(table.fields.length)}1`),
      headers: table.headers,
    });
  }

  return { needed: writes.length > 0 || from !== SCHEMA_VERSION, from, writes };
}

/** `true` si la pestaña ya tiene exactamente las cabeceras de esta versión, rótulo a rótulo. */
function headersUpToDate(table: SheetTable, found: readonly string[]): boolean {
  return table.headers.every((header, index) => (found[index] ?? '').trim() === header);
}
