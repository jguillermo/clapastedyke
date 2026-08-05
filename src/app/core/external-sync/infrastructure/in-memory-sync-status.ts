import { Injectable, signal, Signal } from '@angular/core';
import { SyncStatus, SyncStatusSnapshot } from '../domain/services/sync-status';
import { SyncTarget } from '../domain/value-objects/sync-target';

const DISCONNECTED: SyncStatusSnapshot = {
  phase: 'disconnected',
  target: null,
  lastSyncedAt: null,
  lastError: null,
};

/**
 * Estado de la sincronización en memoria, por sesión.
 *
 * `markDisconnected()` no apaga una luz: **vuelve al estado inicial completo** — se olvida la hoja,
 * la última fecha y el error. Es lo que garantiza que, tras cerrar sesión, la pantalla no siga
 * mostrando el enlace a la hoja de la cuenta anterior.
 */
@Injectable()
export class InMemorySyncStatus extends SyncStatus {
  private readonly state = signal<SyncStatusSnapshot>(DISCONNECTED);
  private readonly changes = signal(0);

  readonly snapshot: Signal<SyncStatusSnapshot> = this.state.asReadonly();

  /**
   * El contador **no** se reinicia al desconectar, aunque el resto del estado sí.
   *
   * Cerrar sesión también cambia lo que las vistas tienen que mostrar, y volver a cero haría que una
   * vista que ya hubiera visto el 0 no notara nada. Un contador que solo sube no tiene ese problema.
   */
  readonly revision: Signal<number> = this.changes.asReadonly();

  markDataChanged(): void {
    this.changes.update((count) => count + 1);
  }

  markConnected(): void {
    this.state.update((current) => ({ ...current, phase: 'idle', lastError: null }));
  }

  markDisconnected(): void {
    this.state.set(DISCONNECTED);
  }

  markSyncing(): void {
    this.state.update((current) => ({ ...current, phase: 'syncing', lastError: null }));
  }

  markSynced(target: SyncTarget, at: string): void {
    this.state.set({ phase: 'idle', target, lastSyncedAt: at, lastError: null });
  }

  markFailed(message: string): void {
    this.state.update((current) => ({ ...current, phase: 'error', lastError: message }));
  }
}
