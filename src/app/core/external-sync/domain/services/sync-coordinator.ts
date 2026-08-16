import { Signal } from '@angular/core';

/**
 * Quién sincroniza cuando hay varias pestañas abiertas, y cómo se enteran las demás.
 *
 * ## Por qué hace falta
 *
 * Todas las pestañas comparten la misma IndexedDB y la misma hoja. Sin coordinación, cada una corre su
 * propio ciclo: se multiplican las llamadas a Google —y la cuota es por usuario, no por pestaña—, dos
 * pestañas pueden escribir la misma fila a la vez, y la que acabe segunda pisa a la primera.
 *
 * La salida es que **solo una trabaja**. Las demás no se quedan obsoletas: cuando la que trabaja acaba,
 * lo anuncia, y las otras releen de IndexedDB, que es de donde leen siempre.
 *
 * ## El relevo es automático
 *
 * La pestaña que sincroniza puede cerrarse en cualquier momento, así que el turno no se puede pedir una
 * vez y darlo por ganado: se pide y **se espera**. Quien esté esperando pasa a ser la que trabaja en
 * cuanto la anterior desaparezca, sin que nadie tenga que enterarse ni reintentar.
 *
 * ## Degrada a lo de antes, no a algo peor
 *
 * Si el navegador no ofrece las piezas para coordinarse, **todas las pestañas se consideran la que
 * trabaja**. Es exactamente el comportamiento que había antes de que esto existiera: se gasta más cuota
 * y vuelve la posibilidad de pisarse, pero nada deja de funcionar. Lo contrario —que nadie trabaje— sí
 * rompería la sincronización entera.
 */
export abstract class SyncCoordinator {
  /**
   * `true` si a esta pestaña le toca sincronizar.
   *
   * Es una signal y no una promesa porque **cambia**: una pestaña que no era la que trabajaba pasa a
   * serlo cuando se cierra la que lo era.
   */
  abstract readonly isLeader: Signal<boolean>;

  /** Se pone en la cola para trabajar. Idempotente: llamarlo dos veces no pide dos turnos. */
  abstract claim(): void;

  /** Avisa a las demás pestañas de que los datos locales cambiaron y conviene releerlos. */
  abstract announce(): void;

  /** Registra qué hacer cuando **otra** pestaña avisa. Lo propio nunca se recibe. */
  abstract onAnnounced(handler: () => void): void;
}
