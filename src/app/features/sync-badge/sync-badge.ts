import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SyncIndicator, SyncIndicatorState } from '@components/sync-indicator/sync-indicator';
import { Logger } from '@core/_common/logger/logger';
import { WatchSyncStatus } from '@core/external-sync/application/use-cases/watch-sync-status.use-case';

/**
 * Conecta el aviso de sincronización con el estado real de la app.
 *
 * Existe porque el componente del design system **no puede importar nada de la app** —ni un caso de uso,
 * ni el `Logger`—, así que alguien tiene que traducir «en qué punto está la sincronización» a «qué pinta
 * el aviso». Ese alguien es esto: una pieza de una línea de plantilla que sí puede inyectar el caso de uso.
 *
 * ## Por qué está en `features/` y no en `features/_common/`
 *
 * Aunque lo monte el armazón y no una ruta, inyecta un caso de uso — y `features/_common/` **no puede
 * importar de `core/`** (ver `features-common-conventions.md`). Así que vive aquí, como una feature más,
 * y la única que la usa es la raíz de la app, que no es una feature y puede.
 *
 * ## Cuándo se ve
 *
 * | Situación | Qué se ve |
 * |---|---|
 * | al día, y nada pendiente | **nada** |
 * | hay cambios sin subir | el número |
 * | sincronizando **con algo pendiente** | «Sincronizando» |
 * | sincronizando sin nada pendiente | **nada** |
 * | caducó la sesión | «Reconectar» |
 * | falló | el aviso en rojo |
 * | sin cuenta conectada | **nada** |
 *
 * Las dos filas de «nada» son las que lo hacen discreto. Sin la segunda, cada dos minutos aparecería un
 * aviso girando para decir que todo va bien: eso enseña a no mirarlo. Y sin la última, alguien que solo
 * usa la app en local vería para siempre un cartel sobre algo que no ha pedido.
 */
@Component({
  selector: 'app-sync-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SyncIndicator],
  template: `
    <migo-sync-indicator [state]="state()" [pending]="status().pending" (activated)="open()" />
  `,
})
export class SyncBadge {
  private readonly watchStatus = inject(WatchSyncStatus);
  private readonly router = inject(Router);
  private readonly log = inject(Logger).scoped('ui/sync-badge');

  protected readonly status = this.watchStatus.state;

  protected readonly state = computed<SyncIndicatorState>(() => {
    const { phase, pending } = this.status();
    switch (phase) {
      case 'error':
        return 'error';
      case 'reconnect':
        return 'reconnect';
      case 'syncing':
        // Sin nada pendiente, un ciclo es rutina y no hay nada que contar.
        return pending > 0 ? 'syncing' : 'hidden';
      case 'idle':
        return pending > 0 ? 'pending' : 'hidden';
      case 'disconnected':
        // Quien no ha conectado cuenta no tiene copia remota de la que avisar.
        return 'hidden';
    }
  });

  protected open(): void {
    this.log.debug('aviso de sincronización pulsado ▶');
    void this.router.navigate(['/cuenta']);
  }
}
