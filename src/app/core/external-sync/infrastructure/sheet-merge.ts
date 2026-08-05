/**
 * La fusión de una tabla con lo que ya hay escrito en su pestaña.
 *
 * Es el corazón de la idempotencia: se lee la pestaña entera, se mezcla en memoria y se reescribe el
 * bloque. **El resultado no depende del estado previo**, así que mandar dos veces el mismo lote deja
 * la hoja igual que mandarlo una.
 *
 * Funciones puras a propósito, separadas del transporte: aquí es donde vive la única lógica que
 * podría corromper datos en silencio, y así se puede razonar —y probar— sin red de por medio.
 */

import { canonicalCode } from './sheet-canonical';
import { SheetTable } from './sheet-schema';

/** Un objeto del lote, convertido en fila con el orden de columnas de su tabla. */
export function toRow(table: SheetTable, source: Record<string, unknown>): string[] {
  return table.fields.map((field) => {
    const value = source[field];
    return value === null || value === undefined ? '' : String(value);
  });
}

/**
 * Upsert por clave: cada fila que llega pisa la que tuviera su mismo id, y las nuevas se añaden al
 * final. Las que ya estaban y no vienen en el lote **se conservan** — un envío parcial no borra el
 * resto del recetario. Eso incluye las **lápidas**: una fila marcada como borrada es una fila que ya
 * estaba, así que sobrevive a cualquier envío que no la mencione.
 *
 * Los ids se comparan **canonizados** (recortados y sin mayúsculas), igual que en todo el motor: si no,
 * un id al que alguien le cambió una letra a mayúscula en la hoja dejaría de reconocerse como el suyo y
 * la fila se duplicaría en cada envío.
 */
export function mergeByKey(
  table: SheetTable,
  existing: readonly string[][],
  incoming: readonly string[][],
): string[][] {
  const keyIndex = table.fields.indexOf(table.key ?? '');
  if (keyIndex < 0) {
    throw new Error(`La tabla ${table.name} no declara clave y no se puede fusionar por id.`);
  }

  const order: string[] = [];
  // Sin prototipo: un id que se llamara «constructor» o «toString» daría un falso positivo contra
  // un objeto normal.
  const byKey: Record<string, string[]> = Object.create(null) as Record<string, string[]>;

  for (const row of existing) {
    const key = canonicalCode(row[keyIndex]);
    if (!key) {
      continue;
    }
    if (!byKey[key]) {
      order.push(key);
    }
    byKey[key] = [...row];
  }

  for (const row of incoming) {
    const key = canonicalCode(row[keyIndex]);
    if (!byKey[key]) {
      order.push(key);
    }
    byKey[key] = [...row];
  }

  return order.map((key) => byKey[key]);
}

/**
 * Reemplazo por padre: se quitan TODAS las filas de los padres que llegan y se reinsertan las
 * nuevas.
 *
 * Evita tener que inventar una clave compuesta (receta + insumo) y, sobre todo, es lo que hace que
 * **borrar un insumo de una receta se refleje en la hoja**: con un upsert por línea, la línea
 * eliminada se quedaría ahí para siempre.
 */
export function replaceByParent(
  table: SheetTable,
  existing: readonly string[][],
  incoming: readonly string[][],
): string[][] {
  const parentIndex = table.fields.indexOf(table.parentKey ?? '');
  if (parentIndex < 0) {
    throw new Error(`La tabla ${table.name} no declara padre y no se puede reemplazar por él.`);
  }

  const touched = new Set(incoming.map((row) => String(row[parentIndex] ?? '')));
  const kept = existing.filter((row) => !touched.has(String(row[parentIndex] ?? '')));

  return [...kept.map((row) => [...row]), ...incoming.map((row) => [...row])];
}
