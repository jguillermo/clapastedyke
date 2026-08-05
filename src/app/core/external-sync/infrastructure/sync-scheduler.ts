import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { SynchronizeWithRemote } from '../application/use-cases/synchronize-with-remote.use-case';
import { SyncCoordinator } from '../domain/services/sync-coordinator';
import { SyncStatus } from '../domain/services/sync-status';

/** Lo que espera un cambio local antes de salir. Corto: el usuario acaba de guardar. */
const AFTER_CHANGE_MS = 5_000;

/** Cada cuánto se mira el destino por si otro dispositivo escribió. */
const POLL_MS = 2 * 60_000;

/**
 * Lo mínimo entre dos ciclos, para los disparadores **ambientales**.
 *
 * Es la pieza que evita el fallo de cuota, y el culpable no es el intervalo: es el **foco**.
 * `visibilitychange` salta en *cada* cambio de pestaña, así que alguien alternando entre la app y otra
 * cosa treinta veces por minuto dispararía treinta ciclos — noventa peticiones, por encima de las 60/min
 * que Google da por usuario. Y vería «error» sin haber hecho nada raro.
 *
 * ## Solo se aplica a lo ambiental, y esa distinción importa
 *
 * Un disparador **ambiental** (arranque, intervalo, foco, vuelve la red) no lo pidió nadie: si llega
 * demasiado pronto, se descarta y no se pierde nada, porque el siguiente llegará solo.
 *
 * Un disparador **deliberado** (el usuario guardó, o toca reintentar tras un fallo, o pulsó el botón) sí
 * lo pidió alguien, y **ya viene limitado por su propio temporizador**: el rebote de cinco segundos, la
 * espera creciente, o el dedo del usuario. Aplicarle además este mínimo lo descartaría sin volver a
 * programarlo — y entonces un cambio local esperaría al intervalo de dos minutos, y un reintento
 * programado a los cinco segundos no ocurriría nunca. Los dos serían fallos silenciosos: nada avisa de
 * un ciclo que no pasó.
 */
const MIN_GAP_MS = 20_000;

/** La espera tras un fallo, y su techo. Se duplica en cada fallo seguido. */
const BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

/**
 * Decide **cuándo** se sincroniza. No sincroniza: eso es del ciclo.
 *
 * ## Los disparadores
 *
 * | cuándo | por qué |
 * |---|---|
 * | al arrancar | para empezar con lo que hay en el destino |
 * | ~5 s tras un cambio local | subir pronto, pero no en cada tecla |
 * | cada ~2 min | por si otro dispositivo escribió |
 * | al recuperar el foco | el momento en que el usuario vuelve a mirar |
 * | al volver la conexión | lo que estaba pendiente sale enseguida |
 * | al avisar otra pestaña | **no** dispara ciclo: solo hay que releer |
 *
 * ## Un solo ciclo, y uno más si hace falta
 *
 * Dos ciclos a la vez se pisarían escribiendo. El ciclo ya se protege con su propio cerrojo, pero aquí
 * se hace además explícito: si algo dispara mientras hay uno en marcha, se anota **que hay que repetir**
 * y se repite una vez al acabar. Sin eso, un cambio hecho durante un ciclo esperaría al intervalo.
 *
 * ## Nada de esto corre en un manejador del bus
 *
 * El bus de eventos se detiene en el primer evento cuyo suscriptor falla, sin tope de reintentos: una
 * espera de red dentro de un manejador **bloquearía la cola de eventos entera** de la app, a varios
 * reintentos por segundo. Por eso quien reacciona a un cambio local solo llama a `afterLocalChange()`,
 * que programa un temporizador y vuelve enseguida. La espera creciente vive aquí, no en el bus.
 */
@Injectable({ providedIn: 'root' })
export class SyncScheduler {
  private readonly cycle = inject(SynchronizeWithRemote);
  private readonly coordinator = inject(SyncCoordinator);
  private readonly status = inject(SyncStatus);
  private readonly log = inject(Logger).scoped('external-sync/scheduler');

  private timer: ReturnType<typeof setTimeout> | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private running = false;
  /** Algo disparó mientras corría un ciclo: hay que repetir al acabar. */
  private again = false;
  private lastRunAt = 0;
  private failures = 0;
  private started = false;

  /**
   * Arranca los disparadores. Idempotente: dos llamadas no ponen dos intervalos.
   *
   * Los oyentes no se retiran nunca, y es correcto: viven lo que vive la pestaña, igual que el
   * planificador. Retirarlos exigiría un ciclo de vida que nadie tiene por qué gestionar.
   */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.coordinator.claim();
    // Otra pestaña ha sincronizado: los datos ya están en IndexedDB, así que aquí solo hay que releer.
    this.coordinator.onAnnounced(() => this.status.markDataChanged());

    this.poll = setInterval(() => this.request('intervalo'), POLL_MS);

    // El foco: el momento en que el usuario vuelve a mirar. Es también el disparador que más veces
    // salta, y por eso todos comparten el intervalo mínimo.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.request('foco');
      }
    });
    window.addEventListener('online', () => this.request('vuelve la conexión'));

    this.request('arranque');
    this.log.debug('planificador en marcha', { cada: POLL_MS, minimo: MIN_GAP_MS });
  }

  /**
   * Un cambio local acaba de guardarse: se sube en cuanto pase el rebote.
   *
   * El rebote se reinicia con cada cambio, así que editar cinco insumos seguidos manda **un** ciclo y no
   * cinco. Vuelve enseguida: quien llama puede ser un manejador del bus.
   */
  afterLocalChange(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    // Deliberado: ya lo limita este rebote, así que no se le aplica además el mínimo ambiental.
    this.timer = setTimeout(() => void this.run('cambio local', true), AFTER_CHANGE_MS);
  }

  /**
   * Un ciclo **ya**, sin esperar el mínimo ambiental y sin esperar a que acabe.
   *
   * Es para quien reacciona a un hecho que cambia todo el panorama —entrar con una cuenta, reanudar la
   * sesión— y no puede quedarse esperando: quien avisa suele ser un manejador del bus, y ahí no se
   * espera nunca a la red.
   */
  syncNow(trigger: string): void {
    void this.run(trigger, true);
  }

  /**
   * Un disparador ambiental pide un ciclo. Puede que no toque todavía, y entonces no pasa nada.
   *
   * **El botón de la pantalla no pasa por aquí**: una feature solo puede inyectar casos de uso, no esto,
   * así que llama al ciclo directamente. La única consecuencia es que un disparo ambiental puede llegar
   * justo después de un ciclo hecho a mano, porque el mínimo no se enteró. Es una petición de más cada
   * vez que alguien pulsa el botón, y no compensa romper la regla de capas por eso.
   */
  private request(trigger: string): void {
    void this.run(trigger, false);
  }

  private async run(trigger: string, deliberate: boolean): Promise<void> {
    if (!this.coordinator.isLeader()) {
      // Otra pestaña está trabajando. La nuestra se enterará por el canal.
      return;
    }
    if (this.running) {
      this.again = true;
      this.log.debug('ciclo en marcha; se repetirá al acabar', { trigger });
      return;
    }

    const waited = Date.now() - this.lastRunAt;
    if (!deliberate && waited < MIN_GAP_MS) {
      this.log.debug('demasiado pronto para otro ciclo', { trigger, esperado: waited });
      return;
    }

    this.running = true;
    this.lastRunAt = Date.now();
    try {
      const result = await this.cycle.execute();

      if (result.synced) {
        this.failures = 0;
        // Los datos locales han cambiado: hay que releerlos aquí y avisar a las demás pestañas. Si no,
        // el usuario editaría sobre lo viejo y su guardado ganaría con contenido antiguo.
        if (result.applied > 0 || result.removed > 0) {
          this.status.markDataChanged();
          this.coordinator.announce();
        }
      } else if (result.reason === 'failed' || result.reason === 'blocked') {
        this.backOff(trigger, result.reason);
      }
    } finally {
      this.running = false;
    }

    if (this.again) {
      this.again = false;
      await this.run('repetición', true);
    }
  }

  /**
   * Espera creciente tras un fallo.
   *
   * Reintentar cada dos minutos contra una red que no está, o contra una hoja con una pestaña borrada,
   * solo llena la consola y gasta cuota. Duplicar la espera deja sitio a que el problema se arregle
   * —vuelve la red, el usuario recoloca su hoja— sin dejar de intentarlo.
   */
  private backOff(trigger: string, reason: string): void {
    this.failures += 1;
    const wait = Math.min(BACKOFF_MS * 2 ** (this.failures - 1), MAX_BACKOFF_MS);

    if (this.timer) {
      clearTimeout(this.timer);
    }
    // Deliberado: la espera creciente ES el límite de este reintento. Tratarlo como ambiental lo
    // descartaría por llegar antes del mínimo, y el reintento no ocurriría en su momento.
    this.timer = setTimeout(() => void this.run('reintento', true), wait);
    this.log.debug('ciclo sin éxito; se reintenta más tarde', { trigger, reason, wait });
  }

  /** Solo para tests: suelta los temporizadores para que no sobrevivan al caso. */
  stopForTests(): void {
    if (this.poll) {
      clearInterval(this.poll);
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.poll = null;
    this.timer = null;
    this.started = false;
  }
}
