import { computed, inject, Injectable, Signal } from '@angular/core';
import { UseCase } from '@core/_common/use-case';
import { SyncOutbox } from '../../domain/services/sync-outbox';
import { SyncPhase, SyncStatus } from '../../domain/services/sync-status';

export interface SyncStatusView {
  phase: SyncPhase;
  /** Etiqueta lista para pintar, para que la vista no tenga que traducir estados. */
  label: string;
  /** Dirección donde el usuario puede abrir su copia; `null` si todavía no hay ninguna. */
  targetUrl: string | null;
  /** Fecha de la última sincronización ya formateada; `'—'` si todavía no ha habido ninguna. */
  lastSyncedLabel: string;
  lastError: string | null;
  pending: number;
}

const LABELS: Readonly<Record<SyncPhase, string>> = {
  disconnected: 'Sin conectar',
  idle: 'Al día',
  syncing: 'Sincronizando…',
  error: 'Error',
};

/**
 * Proyecta el estado de la sincronización para la UI, junto con los cambios que quedan en la cola.
 *
 * Como `WatchSession`: además de `execute()` expone `state`, la signal que la plantilla lee.
 * Así la feature sigue inyectando solo casos de uso y no los servicios de dominio que hay debajo.
 */
@Injectable({ providedIn: 'root' })
export class WatchSyncStatus extends UseCase<void, SyncStatusView> {
  private readonly status = inject(SyncStatus);
  private readonly outbox = inject(SyncOutbox);

  readonly state: Signal<SyncStatusView> = computed(() => {
    const snapshot = this.status.snapshot();
    return {
      phase: snapshot.phase,
      label: LABELS[snapshot.phase],
      targetUrl: snapshot.target?.url ?? null,
      lastSyncedLabel: formatMoment(snapshot.lastSyncedAt),
      lastError: snapshot.lastError,
      pending: this.outbox.pending(),
    };
  });

  async execute(): Promise<SyncStatusView> {
    return this.state();
  }
}

/** El DTO sale listo para pintar: la vista no formatea fechas. */
function formatMoment(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) {
    return '—';
  }
  return moment.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
