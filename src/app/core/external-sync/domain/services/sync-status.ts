import { Signal } from '@angular/core';
import { SyncTarget } from '../value-objects/sync-target';

/**
 * Estados posibles de la sincronización. `disconnected` no es un error: es el estado normal de la
 * app mientras el usuario no ha conectado ninguna cuenta.
 */
export type SyncPhase = 'disconnected' | 'idle' | 'syncing' | 'error';

export interface SyncStatusSnapshot {
  phase: SyncPhase;
  /** Dónde quedó la copia, en cuanto el destino lo confirma. */
  target: SyncTarget | null;
  /** ISO de la última sincronización correcta de esta sesión. */
  lastSyncedAt: string | null;
  /** Mensaje accionable del último fallo (ya traducido para el usuario). */
  lastError: string | null;
}

/**
 * Guarda en qué punto está la sincronización, para que la pantalla de cuenta pueda contarlo. Estado
 * en memoria y por sesión: al cerrar sesión se reinicia por completo.
 */
export abstract class SyncStatus {
  abstract readonly snapshot: Signal<SyncStatusSnapshot>;

  /** Hay sesión: ya se puede sincronizar. */
  abstract markConnected(): void;

  /** No hay sesión: se olvidan el destino, la fecha y el error. */
  abstract markDisconnected(): void;

  abstract markSyncing(): void;

  abstract markSynced(target: SyncTarget, at: string): void;

  abstract markFailed(message: string): void;
}
