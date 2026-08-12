/**
 * El contrato del motor: qué recibe y qué devuelve. Ver `README.md` de esta carpeta para la
 * explicación completa de cómo se usa; aquí solo están los tipos, documentados en el sitio donde
 * importa a quien los usa.
 *
 * El motor siempre reconcilia **una sola colección** por llamada — quien tenga varias, llama a
 * `reconcile()` una vez por cada una. Nada de lo que hay aquí sabe qué es Google, qué es una hoja de
 * cálculo, ni qué es HTTP.
 */

export type RecordId = string;

/**
 * Metadatos de sincronización/auditoría que acompañan a `values` en cada registro — los mismos que
 * ya se guardan junto al dato en el almacén, no algo que haya que mapear por fuera.
 */
export interface Auditoria {
  /**
   * Nombre del campo de `values` que es el identificador del registro. **No es el valor del id**:
   * es el nombre del campo donde vive (p. ej. `'sku'` ⇒ la identidad real está en `values.sku`).
   * Por defecto `'id'` (⇒ `values.id`).
   */
  readonly id?: string;
  /** Huella/hash de `values`, para saber si el contenido cambió. Valor real, no un nombre de campo. */
  readonly keyfinder: string;
  /** Si este registro está borrado (borrado lógico — nunca se elimina físicamente el dato). */
  readonly deleted: boolean;
  /** Cuándo se creó, en formato de reloj lógico híbrido (`millis-contador-origen`, ver `hybrid-clock.ts`). */
  readonly createdAt: string;
  /**
   * Cuándo se modificó por última vez, mismo formato. Se usa antes que `createdAt` si está — un
   * registro nunca editado no tiene `updatedAt`, y su fecha de cambio es la de su creación.
   */
  readonly updatedAt?: string;
}

/**
 * Un registro tal como vive en la base de datos: contenido de negocio (`values`, opaco para el
 * motor) más los metadatos de sincronización (`auditoria`). Misma forma en `base` y en `data`.
 */
export interface Registro<TValues = unknown> {
  readonly values: TValues;
  readonly auditoria: Auditoria;
}

export interface EngineInput<TValues = unknown> {
  /** Lo que hay en el destino — la fuente de verdad. */
  readonly base: readonly Registro<TValues>[];
  /** Lo que hay aquí — snapshot local COMPLETO de esta colección (incluye los borrados marcados). */
  readonly data: readonly Registro<TValues>[];
  readonly now: number;
  /** Identidad de este origen (dispositivo, proceso...), para desempatar conflictos de forma estable. */
  readonly originId: string;
}

/** Los dos lados cambiaron y hubo que elegir. */
export interface Conflict {
  readonly id: RecordId;
  readonly winner: 'remote' | 'local';
  /** `true` si se eligió sin poder leer una fecha local con la que comparar. */
  readonly blind: boolean;
}

/** Un id que aparece en más de un registro remoto. No se toca por ningún lado. */
export interface DuplicateIdentity<TValues = unknown> {
  readonly id: RecordId;
  readonly registros: readonly Registro<TValues>[];
}

export interface EnginePlan<TValues = unknown> {
  /** Registros que hay que escribir en el destino: ganó lo local, incluidos los borrados marcados. */
  readonly push: readonly Registro<TValues>[];
  /** Registros que hay que escribir aquí: ganó el destino, incluidos los que el destino borró. */
  readonly apply: readonly Registro<TValues>[];
  readonly duplicates: readonly DuplicateIdentity<TValues>[];
  readonly conflicts: readonly Conflict[];
}
