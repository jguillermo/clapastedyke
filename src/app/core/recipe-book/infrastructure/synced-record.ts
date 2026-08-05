/**
 * Los dos metadatos que lleva **todo** documento del recetario: cuándo se guardó por última vez y si
 * está borrado.
 *
 * Están aquí, en un solo sitio, porque son la misma cosa en los cinco agregados y porque los dos son
 * de **almacenamiento**, no de negocio: nada del recetario decide nada en función de ellos. Quien los
 * necesita es la sincronización, que vive en otro contexto y los recibe a través del contrato del
 * shared kernel.
 *
 * ## `updatedAt`: por qué hace falta
 *
 * Cuando el mismo dato cambia aquí y en la hoja, hay que decidir cuál gana, y para eso hace falta
 * saber **cuándo** cambió cada uno. Sin este campo solo se puede saber lo de la hoja, y poner «ahora»
 * al cambio local sería peor que no tener nada: haría ganar siempre a lo local, incluso frente a una
 * edición remota posterior — justo lo contrario de que la hoja sea la fuente de la verdad.
 *
 * Lo estampa el **repositorio** al guardar, que es el único sitio por el que pasan todas las
 * escrituras. Ni el caso de uso ni el agregado tienen que acordarse.
 *
 * ## `deletedAt`: por qué el borrado es lógico
 *
 * Un borrado tiene que **viajar**. Si al borrar se quitara la fila y nada más, un dispositivo que
 * estuviera desconectado la volvería a subir al reconectar, y lo borrado reaparecería. Hace falta un
 * hecho positivo que decir —«esto se borró»— y eso es una lápida.
 *
 * Es un campo opcional y no un `boolean` a propósito: la fecha sirve para poder purgar las lápidas
 * viejas, y un campo ausente es exactamente lo que tienen los miles de documentos escritos antes de
 * que esto existiera.
 */
export interface SyncedRecord {
  /** ISO. Cuándo se guardó por última vez en este dispositivo. Ausente en documentos anteriores. */
  updatedAt?: string;
  /** ISO. Cuándo se borró. **Presente = borrado**; ausente = vivo. */
  deletedAt?: string;
}

/**
 * Los dos ayudantes de abajo se atan a `object` y **no** a `SyncedRecord`, y ponen los metadatos en el
 * tipo que devuelven.
 *
 * Es por una regla del sistema de tipos, no por gusto: `SyncedRecord` solo tiene campos opcionales, y a
 * un tipo así TypeScript le aplica su comprobación de «tipo débil» — exige que el argumento comparta al
 * menos una propiedad con él. Un documento que todavía no tuviera ni fecha ni lápida (el caso normal:
 * todo lo escrito antes de que esto existiera) no comparte ninguna, y se rechazaba.
 *
 * Intersecar con la clave (`SyncedRecord & { id: string }`) tampoco vale: la comprobación se aplica
 * **a cada miembro** de la intersección, así que seguía midiéndose contra `SyncedRecord` a solas.
 */

/** `true` si el documento sigue vivo. Un documento sin `deletedAt` lo está, que es el caso normal. */
export function isAlive(record: SyncedRecord): boolean {
  return record.deletedAt === undefined;
}

/**
 * El documento con la hora de guardado puesta. **Quita la lápida**: guardar algo que estaba borrado
 * es resucitarlo, y es lo correcto — un id que vuelve a usarse es el mismo dato otra vez, no un
 * fantasma que haya que arrastrar.
 */
export function stamped<Doc extends object>(record: Doc, now: string): Doc & SyncedRecord {
  const { deletedAt: _borrado, ...alive } = record as Doc & SyncedRecord;
  return { ...alive, updatedAt: now } as Doc & SyncedRecord;
}

/**
 * La lápida del documento: se conserva **entero** y solo se le añade la fecha de borrado.
 *
 * Se conserva el contenido, y no solo el id, porque la lápida viaja a la hoja y el usuario la ve: una
 * fila marcada como borrada de la que además hubieran desaparecido el nombre y el precio no le diría
 * qué fue lo que se borró.
 */
export function tombstoned<Doc extends object>(record: Doc, now: string): Doc & SyncedRecord {
  return { ...record, updatedAt: now, deletedAt: now };
}
