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

/** `true` si el documento sigue vivo. Un documento sin `deletedAt` lo está, que es el caso normal. */
export function isAlive(record: SyncedRecord): boolean {
  return record.deletedAt === undefined;
}

/**
 * El documento con la hora de guardado puesta. **Quita la lápida**: guardar algo que estaba borrado
 * es resucitarlo, y es lo correcto — un id que vuelve a usarse es el mismo dato otra vez, no un
 * fantasma que haya que arrastrar.
 */
export function stamped<Doc extends SyncedRecord>(record: Doc, now: string): Doc {
  const { deletedAt: _borrado, ...alive } = record;
  return { ...alive, updatedAt: now } as Doc;
}

/**
 * La lápida del documento: se conserva **entero** y solo se le añade la fecha de borrado.
 *
 * Se conserva el contenido, y no solo el id, porque la lápida viaja a la hoja y el usuario la ve: una
 * fila marcada como borrada de la que además hubieran desaparecido el nombre y el precio no le diría
 * qué fue lo que se borró.
 */
export function tombstoned<Doc extends SyncedRecord>(record: Doc, now: string): Doc {
  return { ...record, updatedAt: now, deletedAt: now };
}
