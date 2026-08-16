/**
 * Cómo queda una pestaña cuando se le escriben filas nuevas encima de las que ya tenía.
 *
 * Es el corazón de la idempotencia: se parte de lo que hay, se mezcla en memoria y se reescribe el
 * bloque entero. **El resultado no depende del estado previo**, así que mandar dos veces lo mismo deja
 * la hoja igual que mandarlo una vez.
 *
 * Función pura y separada del transporte, a propósito: aquí vive la única lógica que podría borrar
 * datos de alguien en silencio, y así se puede razonar —y probar— sin red de por medio.
 */

import { RawRow } from '../../domain/repositories/remote.repository';
import { canonicalCode } from '../sheet-canonical';

/** Una posición del bloque reescrito: o una fila con id, o una fila que se copia tal cual. */
type Slot = { readonly key: string } | { readonly verbatim: RawRow };

/**
 * Upsert por id: cada fila que llega pisa la que tuviera su mismo id, y las nuevas se añaden al final.
 *
 * Las que ya estaban y no vienen **se conservan** — escribir unas pocas filas no puede borrar el resto
 * de la tabla. Eso incluye las **lápidas**: una fila marcada como borrada es una fila que ya estaba,
 * así que sobrevive a cualquier escritura que no la mencione.
 *
 * Los ids se comparan **canonizados** (recortados y sin mayúsculas), igual que en todo el motor: si no,
 * un id al que alguien le cambió una letra a mayúscula en la hoja dejaría de reconocerse como el suyo
 * y la fila se duplicaría en cada escritura.
 *
 * ## Una fila sin id se conserva TAL CUAL, y en su sitio
 *
 * Es la línea que evita una pérdida de datos silenciosa. Una fila con contenido y sin id la escribió
 * una persona a mano, y se adopta —se le asigna un id y se importa— en el mismo ciclo en que se ve.
 * Pero entre que se teclea y se adopta puede pasar cualquier otra escritura en esa pestaña, y si esa
 * escritura se saltara las filas sin id, lo que alguien acaba de teclear desaparecería sin dejar
 * rastro ni aviso.
 *
 * Se copian con su contenido intacto y en su posición original, así que el bloque reescrito respeta el
 * orden que el usuario ve.
 */
export function mergeRows(existing: readonly RawRow[], incoming: readonly RawRow[]): RawRow[] {
  const slots: Slot[] = [];
  // Sin prototipo: un id que se llamara «constructor» o «toString» daría un falso positivo contra un
  // objeto normal.
  const byKey: Record<string, RawRow> = Object.create(null) as Record<string, RawRow>;

  for (const row of existing) {
    const key = canonicalCode(row.id);
    if (!key) {
      slots.push({ verbatim: row });
      continue;
    }
    if (!byKey[key]) {
      slots.push({ key });
    }
    byKey[key] = row;
  }

  for (const row of incoming) {
    const key = canonicalCode(row.id);
    if (!key) {
      // Una fila que llega sin id no se puede emparejar con nada y se añadiría de nuevo en cada
      // ciclo. No debería pasar —quien la manda ya le asignó identidad—, y si pasa es mejor no
      // escribirla que llenar la hoja de copias.
      continue;
    }
    if (!byKey[key]) {
      slots.push({ key });
    }
    byKey[key] = row;
  }

  return slots.flatMap((slot) => {
    if ('verbatim' in slot) {
      return [slot.verbatim];
    }
    const row = byKey[slot.key];
    return row ? [row] : [];
  });
}
