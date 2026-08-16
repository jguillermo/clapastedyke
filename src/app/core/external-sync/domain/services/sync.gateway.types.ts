import { SyncProbe } from '../value-objects/sync-probe';
import { SyncTarget } from '../value-objects/sync-target';

/** Lo mínimo para actuar contra el destino: con qué se autoriza. */
export interface CredentialRequest {
  /**
   * Credencial del usuario que autoriza la operación. Nunca se registra ni se guarda.
   *
   * Es lo ÚNICO que el dominio le da al destino además de los datos: **a dónde va y cómo se llega** es
   * asunto de la implementación, no de esta capa.
   */
  credential: string;
}

export interface TargetRequest extends CredentialRequest {
  /** Dónde está la copia de esta cuenta. */
  target: SyncTarget;
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
