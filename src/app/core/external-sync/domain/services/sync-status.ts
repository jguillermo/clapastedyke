import { Signal } from '@angular/core';
import { SyncTarget } from '../value-objects/sync-target';

/**
 * Estados posibles de la sincronización. `disconnected` no es un error: es el estado normal de la
 * app mientras el usuario no ha conectado ninguna cuenta.
 */
/**
 * `disconnected` no es un error: es el estado normal mientras el usuario no ha conectado ninguna cuenta.
 *
 * `reconnect` **sí** pide algo: había sesión y ya no la hay. Es distinto de `disconnected` porque lo que
 * el usuario tiene que hacer es distinto —volver a entrar, no «conectar por primera vez»— y distinto de
 * `error` porque no se ha roto nada: el token de Google dura una hora y en un navegador no hay forma de
 * renovarlo indefinidamente. Confundirlo con un error haría pensar que se perdió algo.
 */
export type SyncPhase = 'disconnected' | 'reconnect' | 'idle' | 'syncing' | 'error';

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

  /**
   * Cuántas veces han cambiado los datos locales por una sincronización. Sube y nunca baja.
   *
   * ## Por qué hace falta un contador
   *
   * Cuando un ciclo trae filas del destino, las escribe en IndexedDB — y **nadie observa IndexedDB**.
   * Las vistas guardan lo que leyeron al montarse, así que seguirían mostrando lo de antes hasta que el
   * usuario navegara a otro sitio y volviera.
   *
   * Eso no es solo cosmético: si edita sobre un catálogo viejo, lo que guarde saldrá **con contenido
   * antiguo y una versión nueva**, y le ganará al cambio legítimo del otro dispositivo. La vista
   * desactualizada se convierte en pérdida de datos.
   *
   * Es un número y no un booleano ni un evento porque así una vista solo tiene que comparar con el que
   * vio la última vez: no hay que suscribirse, ni desuscribirse, ni preocuparse por perderse un aviso
   * ocurrido antes de montar.
   */
  abstract readonly revision: Signal<number>;

  /** Los datos locales acaban de cambiar por una sincronización (de esta pestaña o de otra). */
  abstract markDataChanged(): void;

  /** Hay sesión: ya se puede sincronizar. */
  abstract markConnected(): void;

  /** No hay sesión: se olvidan el destino, la fecha y el error. */
  abstract markDisconnected(): void;

  /**
   * Había sesión y ya no la hay: hay que volver a entrar.
   *
   * **Conserva el destino y la fecha**, al contrario que `markDisconnected()`: la hoja sigue siendo la
   * de esa persona y su enlace le sigue sirviendo. Borrarlos daría a entender que se perdió algo.
   */
  abstract markNeedsReconnect(): void;

  abstract markSyncing(): void;

  abstract markSynced(target: SyncTarget, at: string): void;

  abstract markFailed(message: string): void;
}
