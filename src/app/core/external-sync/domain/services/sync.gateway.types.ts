import { SyncBatch } from '../value-objects/sync-batch';
import { SyncProbe } from '../value-objects/sync-probe';
import { SyncTarget } from '../value-objects/sync-target';

export interface SyncRequest {
  /**
   * Credencial del usuario que autoriza la escritura. Nunca se registra ni se guarda.
   *
   * Es lo ÚNICO que el dominio le pasa al destino además del lote: **a dónde va y cómo se llega es
   * asunto de la implementación**, no de esta capa.
   */
  credential: string;
  batch: SyncBatch;
}

export interface SyncOutcome {
  target: SyncTarget;
  /** Filas aplicadas por tabla, tal como las cuenta el destino. Sirve para dar parte al usuario. */
  applied: Readonly<Record<string, number>>;
}

/** Lo mínimo para pedirle al destino que exista: con qué se autoriza y nada más. */
export interface OpenRequest {
  /** Credencial del usuario que autoriza la operación. Nunca se registra ni se guarda. */
  credential: string;
}

export interface ProbeRequest extends OpenRequest {
  /** El dato que tiene que volver. Ver {@link SyncProbe}. */
  probe: SyncProbe;
}

export interface ProbeOutcome {
  target: SyncTarget;
  /**
   * Lo que el destino **leyó** de donde escribió la prueba. Se devuelve en crudo, sin juzgarlo: quien
   * decide si la ida y vuelta salió bien es el value object, no el transporte.
   */
  echo: string;
}

/** Formas en que puede fallar una sincronización. Parte del contrato del puerto. */
export type SyncErrorCode =
  'UNAUTHENTICATED' | 'NOT_CONFIGURED' | 'REJECTED' | 'QUOTA' | 'NETWORK' | 'INTERNAL';

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
