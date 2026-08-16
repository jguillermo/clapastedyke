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
export interface Sync {
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
  /**
   * Huella/hash del contenido, para saber si cambió. Valor real, no un nombre de campo.
   *
   * **`null` significa «hay que recalcularla antes de escribir»**, y es lo que sale de una fusión:
   * los valores fusionados son contenido nuevo que no coincide con la huella de ningún lado, y el
   * motor no calcula huellas — no es su trabajo (ver `README.md`). Se eligió `null` y no `''` porque
   * una cadena vacía es indistinguible de una huella legítima: si alguien la persistía, el ciclo
   * siguiente veía `'' === ''` y declaraba convergencia **con contenidos distintos**, dejando la
   * divergencia congelada sin conflicto y sin rastro. Con `null`, el tipo obliga a mirarlo, y dos
   * `null` nunca cuentan como convergidos.
   */
  readonly keyfinder: string | null;
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
   * **Opcional, y a propósito — a diferencia de `sync.id`.** `sync.id` se hizo obligatorio porque
   * su ausencia con un default silencioso puede esconder un error real (leer `registro.id` cuando
   * el identificador vive en `sku`). Aquí no hay ningún default que ocultar: la ausencia de
   * ancestro es un estado **normal y frecuente** — la primera sincronización de cada registro, o
   * cualquiera escrito antes de que este campo existiera — no un descuido que haya que forzar a
   * declarar. Exigir la clave con un `undefined` explícito en cada registro sin ancestro solo
   * añadía ruido a cada literal sin ganar ninguna validación real.
   *
   * **Ausente** ⇒ el motor no puede atribuir un campo divergente a un lado concreto y cae en el
   * criterio de siempre: gana un lado entero por versión. Ver "Fusión de campos no solapados" en
   * el `README.md` de esta carpeta.
   *
   * **Tipado como `Record<string, unknown>` y no como los campos de negocio de `TValues`, a
   * propósito.** `Sync` en sí **no es genérico** por esta misma razón: `TValues` ya aparece en la
   * posición de nivel superior de `Registro<TValues>` (los campos de negocio aplanados), y hacer
   * que `sync.syncedValues` dependiera también de `TValues` le daría al compilador dos sitios
   * distintos desde los que inferir el mismo parámetro de tipo en la misma llamada — en cuanto uno
   * de ellos es un literal `undefined` (p. ej. quien SÍ quisiera dejarlo explícito), TypeScript
   * deja de poder resolver `TValues` y lo reduce a su cota (`object`), perdiendo el tipado de TODOS
   * los campos de negocio en cualquier llamada a `reconcile(...)` sin argumento de tipo explícito.
   * El motor de todos modos solo valida la forma del ancestro en tiempo de ejecución (`isRecord`,
   * ver `reconcile.ts`), así que no pierde nada al no tiparlo con `TValues`.
   */
  readonly syncedValues?: Record<string, unknown>;
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
  readonly sync: Sync;
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
  /**
   * Solo presente (y siempre `true`) cuando la versión del DESTINO no era fiable —ilegible, o de un
   * futuro que ningún reloj justifica— y hubo que re-estamparla con el reloj de este origen.
   *
   * Se marca porque tiene una consecuencia que conviene no esconder: una versión re-estampada es,
   * por construcción, la más alta que hay, así que el destino gana ese conflicto contra cualquier
   * edición local legítima. Que gane es coherente con que el destino sea la fuente de la verdad;
   * que fuera indistinguible de un conflicto decidido con dos fechas buenas, no. `blind` no sirve
   * para esto: habla solo del lado local.
   */
  readonly restamped?: boolean;
  /** Solo presente cuando `winner` es `'merged'`: qué campos de negocio vinieron de cada lado. */
  readonly mergedFrom?: {
    readonly remote: readonly string[];
    readonly local: readonly string[];
  };
}

/** Por qué un registro no se pudo tener en cuenta. */
export type IgnoredReason =
  /** Su campo de identidad no es un texto no vacío, así que no hay identidad que resolver. */
  | 'no-id'
  /** Otro registro LOCAL reclama el mismo id, y ganó por versión. */
  | 'duplicate-local';

/**
 * Un registro que el motor no pudo tener en cuenta, y por qué.
 *
 * Existe porque descartar en silencio es la peor forma de fallar: quien aplica el plan no tenía
 * ninguna forma de saber que había datos locales que nunca se iban a subir. Un id repetido del
 * destino sí se reportaba (`duplicates`); el mismo problema del lado local, no.
 */
export interface IgnoredRecord<TValues extends object = Record<string, unknown>> {
  /** De cuál de las dos colecciones de la entrada venía. */
  readonly side: 'base' | 'data';
  readonly reason: IgnoredReason;
  /** El id en conflicto; `null` cuando el motivo es justamente que no se pudo resolver. */
  readonly id: RecordId | null;
  readonly registro: Registro<TValues>;
}

/** Un id que aparece en más de un registro remoto. No se toca por ningún lado. */
export interface DuplicateIdentity<TValues extends object = Record<string, unknown>> {
  readonly id: RecordId;
  readonly registros: readonly Registro<TValues>[];
}

export interface EnginePlan<TValues extends object = Record<string, unknown>> {
  /**
   * Registros que hay que escribir en el destino: ganó lo local (incluidos los borrados
   * marcados), o son el resultado de una fusión que el destino todavía no tiene — y solo entonces
   * el MISMO registro aparece también en `pull` (ver "Fusión de campos no solapados" en `README.md`).
   */
  readonly push: readonly Registro<TValues>[];
  /**
   * Registros que hay que escribir aquí: ganó el destino (incluidos los que el destino borró), o
   * son el resultado de una fusión que aquí todavía no se tiene.
   */
  readonly pull: readonly Registro<TValues>[];
  readonly duplicates: readonly DuplicateIdentity<TValues>[];
  readonly conflicts: readonly Conflict[];
  /** Registros que no se pudieron tener en cuenta, de cualquiera de los dos lados, y por qué. */
  readonly ignored: readonly IgnoredRecord<TValues>[];
}
