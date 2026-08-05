import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SynchronizeWithRemote } from './synchronize-with-remote.use-case';

/**
 * Cuánto se le da al primer ciclo antes de dejar entrar al usuario.
 *
 * Es un compromiso, y conviene saber de qué: sin plazo, una hoja lenta o una cuota agotada dejaría la app
 * sin arrancar; sin espera, alguien podría editar sobre datos viejos justo antes de que llegaran los
 * nuevos. Ocho segundos cubren un ciclo normal con holgura y no se sienten como una app rota.
 */
const BOOT_TIMEOUT_MS = 8_000;

export interface BootSyncResult {
  /** `true` si se llegó a bajar y fusionar antes de arrancar. */
  readonly synced: boolean;
  /** Por qué no se esperó, si no se esperó. */
  readonly reason?: 'disconnected' | 'timeout' | 'failed';
}

/**
 * La primera sincronización, **antes** de que la app deje trabajar.
 *
 * El requisito es que al abrir con conexión se baje todo de la hoja antes de empezar. Esto lo cumple, con
 * dos límites deliberados:
 *
 * 1. **Hay plazo.** Si el ciclo tarda más de lo razonable, la app entra igual con lo que tiene en local y
 *    la sincronización sigue por detrás. La alternativa —esperar indefinidamente— convierte una hoja
 *    lenta, una cuota agotada o una red mala en una app que no abre.
 * 2. **Sin cuenta no se espera nada.** Es el caso normal de quien no ha conectado nada, y la app es
 *    local-first: bloquear el arranque de alguien que no usa la integración sería cobrarle por algo que
 *    no tiene.
 *
 * **Nunca lanza.** Un fallo aquí es «arranca con lo local», no «no arranca».
 *
 * > El plazo no se aplica al ciclo: el ciclo sigue su curso. Lo que se abandona es **la espera**, no el
 * > trabajo. Cortar la sincronización a mitad la dejaría a medias justo en el momento más delicado.
 */
@Injectable({ providedIn: 'root' })
export class BootSync extends UseCase<void, BootSyncResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly cycle = inject(SynchronizeWithRemote);
  private readonly log = inject(Logger).scoped('external-sync/boot');

  async execute(): Promise<BootSyncResult> {
    // Esto es lo que hace honesta a la puerta: `current()` espera a la reanudación silenciosa, así que en
    // un arranque en frío contesta de verdad en vez de decir «no hay cuenta» siempre.
    if (!(await this.credentials.current())) {
      this.log.debug('arranque sin cuenta: se entra con lo local');
      return { synced: false, reason: 'disconnected' };
    }

    this.log.debug('arranque: se espera la primera sincronización', { plazo: BOOT_TIMEOUT_MS });
    const cycle = this.cycle.execute();
    const outcome = await Promise.race([
      cycle.then((result): 'ok' | 'failed' => (result.synced ? 'ok' : 'failed')),
      wait(BOOT_TIMEOUT_MS).then(() => 'timeout' as const),
    ]);

    if (outcome === 'ok') {
      this.log.debug('arranque: la hoja ya está aplicada');
      return { synced: true };
    }

    // Ni el plazo ni un fallo cortan el ciclo: sigue por su cuenta y su resultado llegará al estado.
    // Lo único que se abandona es la espera.
    this.log.debug('arranque: se entra sin esperar más', { outcome });
    return { synced: false, reason: outcome };
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
