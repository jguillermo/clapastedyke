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
  /**
   * Los cambios que quedan por subir, en palabras y con la concordancia ya resuelta
   * («1 cambio sin sincronizar» / «4 cambios sin sincronizar»). `''` cuando no queda ninguno, para
   * que quien avise de ellos no tenga que decidir si hay algo que decir.
   *
   * Va aquí y no en la plantilla por la misma razón que `lastSyncedLabel`: la vista pinta, no
   * redacta. Y el aviso de cerrar sesión —donde esta frase importa— no puede permitirse un
   * «1 cambios».
   */
  pendingLabel: string;
  /**
   * **¿Está todo sincronizado?**, en un solo valor.
   *
   * Vive aquí y no en cada vista porque antes se deducía por separado en dos sitios —el aviso flotante
   * y la pantalla de cuenta— con dos reglas escritas a mano que podían dejar de coincidir. Una de las
   * dos habría acabado diciendo «al día» mientras la otra decía que faltaban cosas.
   *
   * Son las dos condiciones a la vez: el ciclo no está trabajando ni ha fallado, **y** no queda nada
   * en la cola. Sin la segunda, un cambio local recién hecho contaría como sincronizado hasta que el
   * ciclo siguiente lo mirara.
   */
  upToDate: boolean;
}

const LABELS: Readonly<Record<SyncPhase, string>> = {
  disconnected: 'Sin conectar',
  reconnect: 'Reconectar',
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
      pendingLabel: describePending(this.outbox.pending()),
      upToDate: snapshot.phase === 'idle' && this.outbox.pending() === 0,
    };
  });

  /**
   * Cuántas veces la sincronización ha cambiado los datos locales. Sube y nunca baja.
   *
   * Va **aparte de `state`** a propósito: una vista que quiera recargarse cuando llegan datos nuevos
   * solo debe reaccionar a eso, no a que el rótulo pase de «Sincronizando…» a «Al día». Metido en el
   * mismo objeto, cualquier cambio de fase provocaría una recarga de más — y en el libro 3D eso es
   * releer el catálogo entero y volver a pintar las páginas.
   *
   * Se lee comparando con el último valor visto; no hay que suscribirse a nada. Ver `SyncStatus`.
   */
  readonly revision: Signal<number> = this.status.revision;

  async execute(): Promise<SyncStatusView> {
    return this.state();
  }
}

/** `''` cuando no queda nada: quien avisa no tiene que decidir si hay algo que decir. */
function describePending(pending: number): string {
  if (pending === 0) {
    return '';
  }
  return pending === 1 ? '1 cambio sin sincronizar' : `${pending} cambios sin sincronizar`;
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
