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
 * Metadatos de sincronización que acompañan a los campos de negocio de cada registro — los mismos
 * que ya se guardan junto al dato en el almacén, no algo que haya que mapear por fuera. Se llama
 * `sync` y no "auditoría": estos campos no existen para llevar un historial de quién hizo qué, sino
 * para que el motor pueda comparar y versionar (`keyfinder`, `deleted`, `createdAt`/`updatedAt`,
 * `syncedValues`).
 */
export interface Sync<TValues = unknown> {
  /**
   * Nombre del campo de negocio que es el identificador del registro. **No es el valor del id**:
   * es el nombre del campo donde vive (p. ej. `'sku'` ⇒ la identidad real está en `registro.sku`).
   *
   * **Obligatorio, sin default.** Sin él no hay forma de validar qué campo leer como identidad —
   * dejarlo opcional con un valor por defecto silencioso escondería el error de quien construye el
   * registro sin pensarlo (p. ej. una colección cuyo id vive en `sku` que se indexara por `id` sin
   * que nada avisara). El caso común (`registro.id`) se escribe explícito: `sync: { id: 'id', ... }`.
   */
  readonly id: string;
  /** Huella/hash del contenido, para saber si cambió. Valor real, no un nombre de campo. */
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
  /**
   * Snapshot de los campos de negocio (sin `sync`) que este registro LOCAL sabía que coincidía con
   * el destino la última vez que convergieron — el ancestro común que hace falta para una fusión de
   * tres vías (el mismo papel que el *merge base* en `git`). Solo tiene sentido en un registro de
   * `data`; el motor lo ignora en `base`.
   *
   * Ausente (primera sincronización de este registro, o escrito antes de que este campo
   * existiera) ⇒ el motor no puede atribuir un campo divergente a un lado concreto y cae en el
   * criterio de siempre: gana un lado entero por versión. Ver "Fusión de campos no solapados" en
   * el `README.md` de esta carpeta.
   */
  readonly syncedValues?: TValues;
}

/**
 * Un registro tal como vive en la base de datos: los campos de negocio **aplanados al nivel
 * superior** (opacos para el motor, sin envoltorio `values` aparte) junto con sus metadatos de
 * sincronización en `sync`. Misma forma en `base` y en `data`.
 *
 * `TValues` es el tipo de los campos de negocio **solos**, sin `sync` — `Registro<TValues>` es
 * la intersección de los dos: `{ ...camposDeNegocio, sync }`.
 */
export type Registro<TValues extends object = Record<string, unknown>> = TValues & {
  readonly sync: Sync<TValues>;
};

export interface EngineInput<TValues extends object = Record<string, unknown>> {
  /** Lo que hay en el destino — la fuente de verdad. */
  readonly base: readonly Registro<TValues>[];
  /** Lo que hay aquí — snapshot local COMPLETO de esta colección (incluye los borrados marcados). */
  readonly data: readonly Registro<TValues>[];
  readonly now: number;
  /** Identidad de este origen (dispositivo, proceso...), para desempatar conflictos de forma estable. */
  readonly originId: string;
}

/** Los dos lados cambiaron y hubo que decidir qué hacer. */
export interface Conflict {
  readonly id: RecordId;
  /**
   * `'merged'` cuando los dos lados cambiaron campos distintos y no hizo falta descartar ninguno
   * (ver "Fusión de campos no solapados" en `README.md`). `'remote'`/`'local'` cuando hubo que
   * elegir un lado entero — por solapamiento real (el mismo campo, valores distintos) o por no
   * tener ancestro con el que fusionar.
   */
  readonly winner: 'remote' | 'local' | 'merged';
  /** `true` si se eligió sin poder leer una fecha local con la que comparar. Siempre `false` si `winner` es `'merged'` — una fusión no es una apuesta a ciegas. */
  readonly blind: boolean;
  /** Solo presente cuando `winner` es `'merged'`: qué campos de negocio vinieron de cada lado. */
  readonly mergedFrom?: {
    readonly remote: readonly string[];
    readonly local: readonly string[];
  };
}

/** Un id que aparece en más de un registro remoto. No se toca por ningún lado. */
export interface DuplicateIdentity<TValues extends object = Record<string, unknown>> {
  readonly id: RecordId;
  readonly registros: readonly Registro<TValues>[];
}

export interface EnginePlan<TValues extends object = Record<string, unknown>> {
  /**
   * Registros que hay que escribir en el destino: ganó lo local (incluidos los borrados
   * marcados), o son el resultado de una fusión — en ese caso, el MISMO registro aparece también
   * en `pull` (ver "Fusión de campos no solapados" en `README.md`).
   */
  readonly push: readonly Registro<TValues>[];
  /**
   * Registros que hay que escribir aquí: ganó el destino (incluidos los que el destino borró), o
   * son el resultado de una fusión — en ese caso, el MISMO registro aparece también en `push`.
   */
  readonly pull: readonly Registro<TValues>[];
  readonly duplicates: readonly DuplicateIdentity<TValues>[];
  readonly conflicts: readonly Conflict[];
}
