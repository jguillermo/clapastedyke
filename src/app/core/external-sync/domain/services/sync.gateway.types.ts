import { SyncBatch } from '../value-objects/sync-batch';
import { SyncProbe } from '../value-objects/sync-probe';
import { SyncTarget } from '../value-objects/sync-target';
import { RemoteSnapshot } from './sync-reader.types';

/** Lo mínimo para actuar contra el destino: con qué se autoriza. */
export interface CredentialRequest {
  /**
   * Credencial del usuario que autoriza la operación. Nunca se registra ni se guarda.
   *
   * Es lo ÚNICO que el dominio le da al destino además de los datos: **a dónde va y cómo se llega**
   * es asunto de la implementación, no de esta capa.
   */
  credential: string;
}

export interface TargetRequest extends CredentialRequest {
  /** Dónde está la copia de esta cuenta. */
  target: SyncTarget;
}

/** Poner al día la forma del destino, a partir de lo que ya se leyó de él. */
export interface MigrateRequest extends TargetRequest {
  readonly snapshot: RemoteSnapshot;
}

/** Una fila del destino señalada por su tabla y su posición. */
export interface RemoteRowRef {
  readonly table: string;
  readonly index: number;
}

/** Marcar filas como borradas, sin quitarlas. */
export interface MarkDeletedRequest extends TargetRequest {
  readonly rows: readonly (RemoteRowRef & { readonly version: string })[];
}

/** Quitar filas del destino. Solo para lápidas viejas. */
export interface PurgeRequest extends TargetRequest {
  readonly rows: readonly RemoteRowRef[];
}

/**
 * Escribir **algunas celdas** de una fila que ya existe, dejando el resto como está.
 *
 * Es lo que hace falta para corregir el destino sin tocar lo que escribió una persona: ponerle el id a
 * una fila que se añadió a mano (con su huella y su versión), o devolverle el id a una a la que se lo
 * cambiaron. Reescribir la fila entera no serviría — el contenido es del usuario y no hay nada que
 * cambiarle—, y reescribir el bloque la movería de sitio.
 */
export interface StampedRow extends RemoteRowRef {
  /** Qué columnas se escriben, por **nombre de campo** del esquema (`id`, `version`, `huella`…). */
  readonly cells: Readonly<Record<string, string>>;
}

export interface StampRequest extends TargetRequest {
  readonly rows: readonly StampedRow[];
}

export interface SyncRequest extends TargetRequest {
  batch: SyncBatch;
}

export interface SyncOutcome {
  /** Filas aplicadas por tabla, tal como las cuenta el destino. Sirve para dar parte al usuario. */
  applied: Readonly<Record<string, number>>;
}

export interface ProbeRequest extends TargetRequest {
  /** El dato que tiene que volver. Ver {@link SyncProbe}. */
  probe: SyncProbe;
}

export interface ProbeOutcome {
  /**
   * Lo que se **leyó** de donde se escribió la prueba. Se devuelve en crudo, sin juzgarlo: quien
   * decide si la ida y vuelta salió bien es el value object, no el transporte.
   */
  echo: string;
}

/** Formas en que puede fallar una operación contra el destino. Parte del contrato del puerto. */
export type SyncErrorCode =
  | 'UNAUTHENTICATED'
  /** El destino ya no está: lo borraron, o está en la papelera. Se recrea. */
  | 'TARGET_GONE'
  | 'REJECTED'
  | 'QUOTA'
  | 'NETWORK'
  | 'INTERNAL';

/**
 * El fallo que declara el puerto, para que el caso de uso no tenga que conocer los errores concretos
 * de la implementación. `message` va escrito para leerse en pantalla.
 */
export class SyncError extends Error {
  constructor(
    readonly code: SyncErrorCode,
    message: string,
    /**
     * El fallo original, cuando lo hay (`{ cause }`). El `message` está escrito para leerse en
     * pantalla y por eso pierde el detalle técnico; la causa lo conserva para que el registro
     * pueda enseñar la cadena entera. Ver logging-conventions.md → «un dueño por fallo».
     */
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SyncError';
  }

  /** `true` cuando reintentar más tarde tiene sentido (red o límite de cuota). */
  get isTransient(): boolean {
    return this.code === 'NETWORK' || this.code === 'QUOTA';
  }
}
