/**
 * El contrato del motor: qué recibe y qué devuelve. Ver `README.md` de esta carpeta para la
 * explicación completa de cómo se usa; aquí solo están los tipos, documentados en el sitio donde
 * importa a quien los usa.
 *
 * Nada de lo que hay aquí sabe qué es Google, qué es una hoja de cálculo, ni qué es HTTP. El único
 * conocimiento que el motor tiene de "cómo se ve un dato" es que tiene un `id` y una `fingerprint`
 * (huella) comparable como texto — el resto (`value`) es opaco.
 */

export type RecordId = string;

/**
 * Un registro tal como está **aquí**.
 *
 * El motor nunca interpreta `value`: solo lo transporta si gana. Quien arma este objeto ya calculó su
 * huella — el motor jamás canonicaliza ni hashea contenido. Su ausencia (que no aparezca para un id
 * que sí está en `base`) ES la señal de que se borró aquí — no lleva un `deleted` propio.
 */
export interface LocalItem<TValue = unknown> {
  readonly id: RecordId;
  /** Contenido íntegro a subir si gana. Opaco para el motor. */
  readonly value: TValue;
  /** Huella del contenido, ya calculada por quien llama. */
  readonly fingerprint: string;
  /**
   * Cuándo se cambió **aquí**, como versión comparable con `RemoteItem.version` (mismo formato:
   * ver `hybrid-clock.ts`), o `null` si no se sabe.
   *
   * Sin este dato, un conflicto se resuelve **a ciegas**: gana `base` (el destino) y queda marcado
   * como tal. Poner una versión de "ahora" cuando no se sabe sería peor que no tener ninguna — haría
   * ganar siempre a lo local, incluso frente a una edición remota posterior.
   */
  readonly changedAt: string | null;
}

/**
 * Un registro tal como está **en el destino** — la fuente de verdad.
 *
 * Quien arma este objeto (el adaptador) ya resolvió la identidad: `id` nunca es un valor inventado a
 * medias ni una posición — si el destino permite escrituras sin identidad (una persona tecleando
 * directamente en una hoja, por ejemplo), es responsabilidad del adaptador asignarle una antes de que
 * llegue aquí. El motor no sabe que ese caso existe.
 */
export interface RemoteItem<TValue = unknown> {
  readonly id: RecordId;
  readonly value: TValue;
  /** Huella del contenido, con el mismo criterio que `LocalItem.fingerprint`. */
  readonly fingerprint: string;
  /** La versión tal como está escrita, o `null` si no se pudo leer. */
  readonly version: string | null;
  readonly deleted: boolean;
  /**
   * Dónde está este registro en el destino, en los términos del adaptador (fila, ruta de documento,
   * ETag…). El motor nunca la interpreta: solo la repite en el plan para que el adaptador sepa qué
   * tocar.
   */
  readonly ref: unknown;
}

export interface CollectionSnapshot<TValue = unknown> {
  readonly collection: string;
  /**
   * `false` si la colección no existe en el destino. **No** es lo mismo que "existe y está vacía":
   * confundirlos combinado con "lo que estaba y ya no está, se borró" borraría la colección entera.
   * Por eso dispara un abort en vez de aplicarse.
   */
  readonly present: boolean;
  readonly items: readonly RemoteItem<TValue>[];
}

export interface EngineInput<TValue = unknown> {
  /**
   * Lo que hay en el destino, por colección — la fuente de verdad. Una colección que no aparece aquí
   * no se toca, aunque haya datos locales para ella.
   */
  readonly base: readonly CollectionSnapshot<TValue>[];
  /** Lo que hay aquí, por colección. */
  readonly data: Readonly<Record<string, readonly LocalItem<TValue>[]>>;
  readonly now: number;
  /** Identidad de este origen (dispositivo, proceso...), para desempatar conflictos de forma estable. */
  readonly originId: string;
  readonly tombstoneTtlMs?: number;
}

/** Por qué un ciclo se niega a seguir. No se aplica a medias: o todo, o nada. */
export interface AbortReason {
  readonly kind: 'missing-collection';
  readonly collection: string;
}

/** Un registro local que hay que llevar al destino. */
export interface Push<TValue = unknown> {
  readonly collection: string;
  readonly id: RecordId;
  readonly value: TValue;
  /**
   * La huella del contenido que se va a escribir, y la versión con la que se escribe.
   *
   * Van en el plan y no las recalcula quien escribe porque **el contenido y su huella tienen que
   * salir juntos, de la misma decisión**. Si quien escribe recalculara la huella por su cuenta,
   * cualquier discrepancia entre las dos formas de calcularla haría que el registro pareciera editado
   * fuera de proceso en el ciclo siguiente — y así para siempre.
   */
  readonly fingerprint: string;
  readonly version: string;
}

/** Un registro del destino que hay que traerse. */
export interface Apply<TValue = unknown> {
  readonly collection: string;
  readonly id: RecordId;
  readonly value: TValue;
  readonly fingerprint: string;
  readonly version: string;
}

/** Un registro que el destino marca como borrado y que hay que quitar aquí también. */
export interface Remove {
  readonly collection: string;
  readonly id: RecordId;
  readonly version: string;
}

/** Un id que aparece en más de un registro remoto de la misma colección. No se toca por ningún lado. */
export interface DuplicateIdentity {
  readonly collection: string;
  readonly id: RecordId;
  readonly refs: readonly unknown[];
}

/** Un registro que se borró aquí y hay que marcar como borrado en el destino (no eliminar). */
export interface Tombstone {
  readonly collection: string;
  readonly id: RecordId;
  readonly ref: unknown;
  readonly version: string;
}

/** Una lápida del destino tan vieja que ya no hace falta guardarla. */
export interface Purge {
  readonly collection: string;
  readonly id: RecordId;
  readonly ref: unknown;
}

/** Los dos lados cambiaron y hubo que elegir. */
export interface Conflict {
  readonly collection: string;
  readonly id: RecordId;
  readonly winner: 'remote' | 'local';
  /** `true` si se eligió sin saber cuándo se cambió aquí (`LocalItem.changedAt` era `null`). */
  readonly blind: boolean;
}

export interface EnginePlan<TValue = unknown> {
  readonly aborted: AbortReason | null;
  readonly apply: readonly Apply<TValue>[];
  readonly remove: readonly Remove[];
  readonly push: readonly Push<TValue>[];
  readonly tombstones: readonly Tombstone[];
  readonly purge: readonly Purge[];
  readonly duplicates: readonly DuplicateIdentity[];
  readonly conflicts: readonly Conflict[];
}
