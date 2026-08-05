import { inject, Injectable, signal, Signal } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { SyncCoordinator } from '../domain/services/sync-coordinator';

/**
 * El nombre del turno y del canal. Es el mismo para todas las pestañas del mismo origen, que es
 * exactamente lo que se quiere: es lo que las hace competir por el mismo turno.
 */
const CHANNEL = 'clapastedyke:sync';

/**
 * Coordinación entre pestañas con **Web Locks** y **BroadcastChannel**.
 *
 * ## Cómo se pide el turno
 *
 * `navigator.locks.request` recibe una función y mantiene el turno **mientras su promesa no se
 * resuelva**. Aquí se le da una que no se resuelve nunca, así que esta pestaña se queda con el turno
 * hasta que se cierra — y al cerrarse, el navegador lo suelta solo y la siguiente en la cola lo recibe.
 * No hay que soltar nada a mano, ni detectar que la otra pestaña murió, ni reintentar: el relevo es del
 * navegador.
 *
 * Es también lo que hace que **una recarga no se quede sin nadie trabajando**: la pestaña que se va
 * suelta el turno al descargarse y la que llega lo pide otra vez.
 *
 * ## Por qué las dos piezas y no una
 *
 * El turno dice *quién* trabaja; el canal dice *que ya está hecho*. Con solo el turno, las demás
 * pestañas seguirían mostrando lo de antes hasta que alguien las recargara.
 *
 * ## Sin estas APIs, todas trabajan
 *
 * Es el comportamiento que había antes, no uno peor: se gasta más cuota, pero nada deja de sincronizar.
 * Lo contrario —dar por hecho que nadie trabaja— dejaría la app sin sincronización en silencio.
 */
@Injectable()
export class WebLocksSyncCoordinator extends SyncCoordinator {
  private readonly log = inject(Logger).scoped('external-sync/coordinator');

  private readonly leader = signal(false);
  readonly isLeader: Signal<boolean> = this.leader.asReadonly();

  private claimed = false;
  private channel: BroadcastChannel | null = null;
  private readonly handlers: (() => void)[] = [];

  claim(): void {
    if (this.claimed) {
      return;
    }
    this.claimed = true;

    const locks = navigator.locks as LockManager | undefined;
    if (!locks) {
      // Sin Web Locks no se puede repartir el turno, así que se trabaja: perder cuota es mejor que no
      // sincronizar.
      this.log.warn(
        'este navegador no reparte turnos entre pestañas; todas sincronizarán',
        undefined,
      );
      this.leader.set(true);
      return;
    }

    // La promesa que no se resuelve es lo que mantiene el turno. El `void` es honesto: `request` solo
    // puede rechazar si el turno se aborta, y aquí no se aborta nunca.
    void locks
      .request(CHANNEL, () => {
        this.log.debug('esta pestaña sincroniza');
        this.leader.set(true);
        return new Promise<never>(() => {
          // a propósito: mientras no se resuelva, el turno es de esta pestaña
        });
      })
      .catch((error: unknown) => {
        this.log.warn('no se pudo mantener el turno de sincronización', error);
        this.leader.set(false);
      });
  }

  announce(): void {
    this.open()?.postMessage('changed');
  }

  onAnnounced(handler: () => void): void {
    this.handlers.push(handler);
    this.open();
  }

  /**
   * El canal, abierto la primera vez que hace falta.
   *
   * `BroadcastChannel` **no se entrega a sí mismo**, así que quien avisa no se despierta con su propio
   * aviso y no hay que filtrar nada.
   */
  private open(): BroadcastChannel | null {
    if (this.channel) {
      return this.channel;
    }
    if (typeof BroadcastChannel === 'undefined') {
      this.log.debug('sin canal entre pestañas: las demás recargarán cuando el usuario las use');
      return null;
    }

    this.channel = new BroadcastChannel(CHANNEL);
    this.channel.onmessage = () => {
      this.log.debug('otra pestaña ha sincronizado; hay que releer');
      for (const handler of this.handlers) {
        handler();
      }
    };
    return this.channel;
  }
}
