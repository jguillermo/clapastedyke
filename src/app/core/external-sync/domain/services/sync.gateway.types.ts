import { SyncBatch } from '../value-objects/sync-batch';
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
  ) {
    super(message);
    this.name = 'SyncError';
  }

  /** `true` cuando reintentar más tarde tiene sentido (red o límite de cuota). */
  get isTransient(): boolean {
    return this.code === 'NETWORK' || this.code === 'QUOTA';
  }
}
