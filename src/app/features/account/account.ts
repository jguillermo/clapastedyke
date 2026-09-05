import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardSubtitle } from '@components/card/card-subtitle';
import { CardTitle } from '@components/card/card-title';
import { Button } from '@components/button/button';
import { Badge } from '@components/badge/badge';
import { Checklist, ChecklistItem, ChecklistState } from '@components/checklist/checklist';
import { Icon } from '@components/icon/icon';
import { Alert } from '@components/alert/alert';
import { Logger } from '@core/_common/logger/logger';
import { SignIn } from '@core/auth/application/use-cases/sign-in.use-case';
import { SignOut } from '@core/auth/application/use-cases/sign-out.use-case';
import { WatchSession } from '@core/auth/application/use-cases/watch-session.use-case';
import { PrepareSyncTarget } from '@core/external-sync/application/use-cases/prepare-sync-target.use-case';
import {
  SynchronizeResult,
  SynchronizeTables,
} from '@core/external-sync/application/use-cases/synchronize-tables.use-case';
import { VerifySyncConnection } from '@core/external-sync/application/use-cases/verify-sync-connection.use-case';
import { WatchSyncStatus } from '@core/external-sync/application/use-cases/watch-sync-status.use-case';
import { AppRestart } from '@platform/restart/app-restart';

/** Una cosa concreta que puede hacer quien está delante, en imperativo. */
interface RemedyAction {
  text: string;
  /** A dónde tiene que ir, si hay que ir a algún sitio. */
  url?: string;
  /** Cómo se llama ese sitio, para que el enlace no diga «aquí». */
  urlLabel?: string;
}

/**
 * Qué hacer cuando un paso falla, **separado por quién puede hacerlo**.
 *
 * La separación es la parte importante. Casi todo lo que puede romperse aquí se arregla en la
 * *instalación* —la consola de Google, el despliegue del script, el fichero de configuración—, y eso
 * lo hace una vez quien publica la app, no quien la usa. Decirle a alguien que solo quería su copia
 * de seguridad que «abra Google Cloud Console» no es ayuda: es ruido que además le hace pensar que la
 * culpa o el trabajo son suyos.
 *
 * Va **junto al paso**, y no derivado del código de error, porque lo que hay que hacer depende de
 * *dónde* se rompió, no de cómo. «No se pudo contactar» significa cosas distintas en el paso que
 * prepara la hoja (el script no está desplegado) y en el que sincroniza (se cayó la red un momento).
 */
interface StepRemedy {
  /** Qué estaba intentando hacer la app. Sin esto, el error no se puede situar. */
  what: string;
  /** Lo que puede resolver quien está delante sin salir de su cuenta. Vacío = no puede hacer nada. */
  userActions: readonly RemedyAction[];
  /** Qué falta en la instalación, en una frase, para quien la mantiene. */
  deployerHint?: string;
  /**
   * Ofrece «Reinstalar desde cero». Solo en los pasos donde reintentar no puede bastar: lo que hay
   * guardado apunta a una hoja que ya no sirve.
   */
  offerReinstall?: boolean;
}

/** Un paso de la conexión: lo que se cuenta, lo que hace y qué hacer si se rompe. */
interface ConnectStep {
  label: string;
  /** Qué está pasando mientras corre. Se enseña bajo el rótulo, en presente. */
  doing: string;
  /** Devuelve el detalle que se enseña bajo el rótulo cuando el paso sale bien. */
  run: () => Promise<string>;
  remedy: StepRemedy;
}

/** El paso que se rompió y por qué. `null` = no ha fallado nada en este intento. */
interface ConnectFailure {
  step: ConnectStep;
  /** Lo que dijo el error, tal cual. Es el dato de diagnóstico, no la instrucción. */
  reason: string;
}

/**
 * Pantalla de cuenta (`/cuenta`): conectar una cuenta de Google y ver el estado de la
 * sincronización con la hoja de cálculo.
 *
 * Dos bloques: **cuenta** (conectar / cerrar sesión, con la lista de pasos) y **sincronización**
 * (estado, hoja, pendientes, comprobar la hoja y sincronización manual). Nada más — aquí no hay
 * consolas, ni ficheros de configuración, ni pasos de instalación: todo eso lo hace la app sola cuando
 * el usuario conecta.
 *
 * De las dos acciones del pie, **«Comprobar la hoja» solo lee**: compara y cuenta lo que haría, sin
 * tocar la hoja ni los datos de este dispositivo. Es lo que se pulsa para decidir si conviene pulsar la
 * otra. Ver `SynchronizeTables` en modo simulación.
 *
 * ## Conectar lo hace todo, y se cuenta paso a paso
 *
 * Al pulsar «Conectar con Google» la app crea la hoja en el Drive del usuario y la pone al día. Son
 * unos segundos y varias llamadas a Google, así que se cuenta por pasos en vez de dejar un spinner
 * mudo.
 *
 * «Conectado» tampoco significa «funciona»: entre identificarse y «mis recetas se guardan» está el
 * permiso que no se concedió y la hoja que se puede crear pero no escribir. Por eso el penúltimo paso
 * es **mandar un dato de prueba y volver a leerlo de la hoja**: hasta que ese vuelve igual, la
 * conexión no está lista.
 *
 * El último paso es el **ciclo completo**, no una subida: baja lo que haya en la hoja, lo fusiona con
 * lo de aquí y sube lo que toque. Es el mismo que la app corre sola cada dos minutos — el botón solo
 * lo adelanta.
 *
 * La feature solo orquesta casos de uso y traduce cada uno a un paso de la lista; ninguna de las
 * operaciones sabe que hay una lista.
 *
 * ## Cerrar sesión vacía el aparato, y por eso se pregunta
 *
 * No es «salir»: `SignOut` borra **todo** lo que este navegador guarda —recetas, insumos, cola,
 * enlace a la hoja, pista de sesión— y deja el aparato como recién instalado. Lo que estuviera
 * sincronizado sigue en la hoja de Drive y vuelve al conectar; **lo que quedara en la cola se
 * pierde**, así que la pregunta lleva esa cuenta (`status().pendingLabel`), que es lo único que esta
 * pantalla sabe y el caso de uso no.
 *
 * Se pregunta en el pie, no en un diálogo, igual que borrar una receta. Y al terminar se rearranca la
 * app (`AppRestart`): con el almacenamiento vacío, lo que quedara en memoria hablaría de datos que ya
 * no existen, y solo una carga en frío vuelve a sembrar el recetario de ejemplo.
 *
 * ## No queda ningún paso manual
 *
 * La app crea la hoja y la escribe ella misma con las APIs de Sheets y Drive. No hay nada que
 * desplegar, nada que instalar en la cuenta de nadie y ningún interruptor que encender: **una casilla
 * de permiso y ya**.
 *
 * Aun así, `StepRemedy` reparte los fallos por quién puede resolverlos: lo que depende de quien está
 * delante (permitir la ventana emergente, aceptar la casilla, mirar la conexión) va arriba; lo que es
 * de la instalación de la app se dice como tal, sin mandar a nadie a una consola.
 *
 * Solo inyecta casos de uso. El estado reactivo llega por las signals que exponen `WatchSession` y
 * `WatchSyncStatus`, así que la vista no toca ni la sesión ni la cola.
 */
@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  host: { class: 'block min-h-dvh bg-surface-page' },
  imports: [
    RouterLink,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Button,
    Badge,
    Checklist,
    Icon,
    Alert,
  ],
})
export class Account {
  private readonly watchSession = inject(WatchSession);
  private readonly watchStatus = inject(WatchSyncStatus);
  private readonly signIn = inject(SignIn);
  private readonly signOut = inject(SignOut);
  private readonly prepareTarget = inject(PrepareSyncTarget);
  private readonly verifyConnection = inject(VerifySyncConnection);
  private readonly sync = inject(SynchronizeTables);
  private readonly restart = inject(AppRestart);
  private readonly log = inject(Logger).scoped('ui/account');

  /** Estado de la sesión y de la sincronización, tal como los publica cada caso de uso. */
  protected readonly session = this.watchSession.state;
  protected readonly status = this.watchStatus.state;

  /** Hay una cuenta detrás, aunque ahora mismo no se pueda hablar con el servidor. */
  protected readonly hasSession = computed(() => this.session().phase !== 'disconnected');

  /**
   * Se puede actuar en nombre del usuario. Es lo que separa «tienes sesión» de «puedes usarla», y
   * gobierna las tres acciones que necesitan al servidor: sincronizar, comprobar y cerrar sesión.
   */
  protected readonly canOperate = computed(() => this.session().phase === 'active');

  protected readonly busy = signal(false);

  /**
   * La pregunta de «¿seguro que quieres cerrar sesión?» está en pantalla.
   *
   * Se pregunta **en el sitio**, en el pie de la tarjeta, igual que borrar una receta: un diálogo
   * encima para una acción que ya está a la vista añade un paso sin añadir información.
   */
  protected readonly confirmingSignOut = signal(false);
  /** Error de la última acción del usuario (los de sincronización viven en `status`). */
  protected readonly actionError = signal('');

  /** Resumen de la última comprobación de la hoja. Vacío = todavía no se comprobó. */
  protected readonly checkSummary = signal('');

  /**
   * Cuál de las dos acciones del pie está en marcha.
   *
   * Hace falta porque `busy` es una sola: con ella en los dos botones, pulsar «Comprobar» pondría a
   * girar también «Sincronizar todo», y quien lo viera creería que se está escribiendo en su hoja
   * cuando no se está tocando nada.
   */
  protected readonly running = signal<'check' | 'sync' | null>(null);

  /** Los pasos de la conexión, tal como los pinta `migo-checklist`. Vacío = todavía no se intentó. */
  protected readonly progress = signal<ChecklistItem[]>([]);
  /** La ida y vuelta salió bien y el recetario está arriba: la conexión está lista de verdad. */
  protected readonly ready = signal(false);

  /**
   * El paso que se rompió, con lo que hay que hacer. `null` mientras no falle nada.
   *
   * Es lo que se pinta en lugar del mensaje pelado: **un error sin salida no es información**, es un
   * callejón. Aquí van las tres cosas que hacen falta para salir — qué intentaba hacer la app, qué
   * contestó, y qué tiene que hacer quien está delante.
   */
  protected readonly failure = signal<ConnectFailure | null>(null);

  /**
   * Algún paso se quedó a medias. Es lo que saca el botón de reintentar **aunque la sesión esté
   * abierta**: si lo que falló fue la hoja o la prueba, «Cerrar sesión» no sería la salida.
   */
  protected readonly failed = computed(() => this.failure() !== null);

  /**
   * Los cuatro pasos, en orden. Cada uno es **un caso de uso**: si un paso necesitara saber algo del
   * anterior que no sea «salió bien», el que estaría mal partido es el caso de uso.
   *
   * Cada uno lleva además **qué está haciendo** y **qué hacer si se rompe, separado por quién puede
   * hacerlo**. Ningún paso pide nada al usuario salvo lo que ya está haciendo: elegir cuenta y
   * aceptar el permiso.
   */
  private readonly steps: readonly ConnectStep[] = [
    {
      label: 'Conectando con tu cuenta de Google',
      doing: 'Esperando a que elijas cuenta y aceptes los permisos…',
      run: () => this.authenticate(),
      remedy: {
        what: 'Le pido a Google que te identifique y me dé permiso para crear tu hoja y escribirla. El permiso sobre tu Drive es el más estrecho que existe: solo alcanza los archivos que crea esta app.',
        userActions: [
          {
            text: 'Si no llegaste a ver la ventana de Google, la bloqueó el navegador: permite las ventanas emergentes de este sitio y vuelve a intentarlo.',
          },
          {
            text: 'Cuando Google te pregunte, acepta las casillas. Sin ellas no hay dónde guardar la copia ni quién la escriba.',
          },
        ],
        deployerHint:
          'Si Google habló de un origen no autorizado o de «acceso bloqueado», es de la instalación de la app: falta autorizar esta dirección en el Client ID, o dar de alta esa cuenta como usuario de prueba.',
      },
    },
    {
      label: 'Preparando tu hoja en Drive',
      doing: 'Creando la hoja «Clapastedyke — Recetario» en tu Drive…',
      run: () => this.prepare(),
      remedy: {
        what: 'Creo la hoja en tu Drive con sus pestañas y sus cabeceras. Se hace una sola vez: la próxima vez que conectes, se reutiliza la misma. Si la borraste, se crea otra.',
        userActions: [
          {
            text: 'Comprueba tu conexión y pulsa Reintentar: crear la hoja es una sola llamada y no deja nada a medias.',
          },
        ],
        offerReinstall: true,
      },
    },
    {
      label: 'Enviando y leyendo un dato de prueba',
      doing: 'Escribiendo un dato de prueba en tu hoja y volviéndolo a leer…',
      run: () => this.checkRoundTrip(),
      remedy: {
        what: 'Escribo un dato de usar y tirar en tu hoja y lo leo de vuelta. Es lo único que demuestra que todo funciona antes de mandar nada tuyo.',
        userActions: [
          {
            text: 'Si borraste la hoja, créala otra vez: se hace desde cero y no pierdes nada de este dispositivo.',
          },
        ],
        offerReinstall: true,
      },
    },
    {
      label: 'Sincronizando tu recetario',
      doing: 'Comparando tu hoja con este dispositivo y poniendo los dos al día…',
      run: () => this.pushEverything(),
      remedy: {
        what: 'Leo tu hoja, la comparo con lo que hay en este dispositivo y pongo los dos al día: lo que falte aquí baja, y lo que falte allí sube. Repetirlo no duplica nada.',
        userActions: [
          { text: 'Comprueba tu conexión y pulsa Reintentar.' },
          {
            text: 'Si habló de cuota o de que está ocupado, espera un momento y reintenta: Google limita las llamadas y no pasa nada por repetir.',
          },
          {
            text: 'Tus datos no se han perdido: siguen guardados en este dispositivo y lo que quede pendiente se reintenta solo.',
          },
        ],
      },
    },
  ];

  /**
   * Conecta la cuenta recorriendo los pasos y marcándolos según ocurren.
   *
   * Se para en el primero que falla y deja los siguientes en `pending`: así se lee de un vistazo
   * hasta dónde llegó. Reintentar vuelve a empezar desde arriba — todos los pasos son idempotentes.
   */
  protected async connect(): Promise<void> {
    this.log.debug('conectar cuenta ▶', { pasos: this.steps.length });
    this.busy.set(true);
    this.actionError.set('');
    this.failure.set(null);
    this.ready.set(false);
    this.progress.set(
      this.steps.map((step): ChecklistItem => ({ label: step.label, state: 'pending' })),
    );

    try {
      for (const [index, step] of this.steps.entries()) {
        this.mark(index, 'running', step.doing);
        try {
          this.mark(index, 'done', await step.run());
        } catch (error) {
          // El detalle en la lista NO sustituye al registro: el usuario ve una frase amable y aquí
          // queda la cadena de errores entera con su pila, con el paso en el que se rompió.
          this.log.warn('conectar cuenta ✘', error, { paso: step.label });
          const reason = describe(error);
          this.mark(index, 'failed', reason);
          this.failure.set({ step, reason });
          return;
        }
      }
      this.ready.set(true);
      this.log.debug('conectar cuenta ✔');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Olvida la hoja de esta cuenta, crea otra y reintenta desde el principio.
   *
   * Es la salida de «esta hoja ya no sirve»: reintentar sin más no arreglaría nada, porque lo que hay
   * guardado sigue apuntando a ella. La anterior **no se borra** — se queda en el Drive del usuario,
   * que es el único que puede decidir tirar sus datos.
   */
  protected async reinstall(): Promise<void> {
    this.log.debug('recrear la hoja ▶');
    try {
      await this.prepareTarget.recreate();
    } catch (error) {
      // El fallo se cuenta igual que cualquier otro de la conexión, así que se deja que lo haga
      // `connect()`: aquí solo queda constancia de que no se llegó a recrear.
      this.log.warn('recrear la hoja ✘', error);
    }
    await this.connect();
  }

  /**
   * Pregunta antes de cerrar sesión. **Siempre pregunta**, haya o no cambios pendientes: lo que está
   * en juego no es la sesión sino todo lo guardado en este aparato, y eso no se pulsa sin querer.
   *
   * Lo que cambia con la cola llena es el aviso, no la pregunta: entonces se dice cuántos cambios se
   * van a perder, que es lo único irrecuperable de la operación.
   */
  protected askToDisconnect(): void {
    this.confirmingSignOut.set(true);
  }

  protected keepSession(): void {
    this.confirmingSignOut.set(false);
  }

  /**
   * Cierra la sesión, borra todo lo local y **rearranca la app**.
   *
   * El rearranque no es cosmético: al salir se vacía el almacenamiento entero, así que lo que la
   * pantalla tuviera leído habla de datos que ya no existen. Con la carga en frío vuelve a correr la
   * siembra y el recetario de ejemplo está de nuevo ahí, que es el estado que se prometió.
   *
   * Si cerrar sesión falla, **no se rearranca**: el mensaje de error se quedaría sin poder leerse.
   */
  protected async disconnect(): Promise<void> {
    this.confirmingSignOut.set(false);
    this.progress.set([]);
    this.failure.set(null);
    this.ready.set(false);
    await this.run('desconectar cuenta', () => this.signOut.execute());
    if (!this.actionError()) {
      this.restart.restart();
    }
  }

  /**
   * Sincroniza en las dos direcciones: baja lo de la hoja, lo fusiona y sube lo que toque.
   *
   * Idempotente: repetirlo no duplica nada ni deshace nada. Y no hace falta pulsarlo — la app ya
   * sincroniza sola; esto es para cuando alguien quiere que pase **ahora**.
   */
  protected async syncAll(): Promise<void> {
    this.running.set('sync');
    try {
      await this.run('sincronizar', async () => {
        const result = await this.sync.execute({});
        if (!result.synced && result.reason !== 'disconnected') {
          // El ciclo no lanza: informa del desenlace y deja el motivo en el estado.
          throw new Error(this.status().lastError ?? 'No se ha podido sincronizar con tu hoja.');
        }
      });
    } finally {
      this.running.set(null);
    }
  }

  /**
   * Compara la hoja con lo que hay aquí y cuenta lo que haría, **sin tocar nada**.
   *
   * Es una herramienta de diagnóstico, y por eso está aquí y no escondida: los dos fallos que pueden
   * hundir la sincronización —que un mismo dato dé una huella distinta según venga del modelo o de una
   * celda, y que una columna que la app recalcula cuente como dato— no se ven en ningún test, porque en
   * un test los dos lados atraviesan el mismo código. Solo se ven contra una hoja de verdad.
   *
   * El resumen va a la pantalla; el detalle (qué campo difiere en qué fila) al registro, que es donde
   * se puede leer sin límite de sitio. Con `"debug": true` en `public/config.json` ya sale.
   */
  protected async checkSheet(): Promise<void> {
    this.checkSummary.set('');
    this.running.set('check');
    try {
      await this.run('comprobar la hoja', async () => {
        this.checkSummary.set(summaryOf(await this.sync.execute({ dryRun: true })));
      });
    } finally {
      this.running.set(null);
    }
  }

  // ── Los pasos ────────────────────────────────────────────────────────────────────────────────

  private async authenticate(): Promise<string> {
    const { email } = await this.signIn.execute();
    return email;
  }

  private async prepare(): Promise<string> {
    const { created } = await this.prepareTarget.execute();
    return created ? 'Hoja creada en tu Drive' : 'Ya tenías tu hoja, se reutiliza';
  }

  private async checkRoundTrip(): Promise<string> {
    await this.verifyConnection.execute();
    return 'El dato de prueba ha vuelto igual que se envió';
  }

  private async pushEverything(): Promise<string> {
    const result = await this.sync.execute({});
    if (!result.synced) {
      // El ciclo no lanza: informa del desenlace y deja el motivo en el estado.
      throw new Error(this.status().lastError ?? 'No se ha podido sincronizar tu recetario.');
    }
    return movements(result);
  }

  // ── Apoyo ────────────────────────────────────────────────────────────────────────────────────

  /** Cambia el estado de un paso sin tocar los demás (la lista es inmutable, como toda signal). */
  private mark(index: number, state: ChecklistState, detail?: string): void {
    this.progress.update((steps) =>
      steps.map((step, position) => (position === index ? { ...step, state, detail } : step)),
    );
  }

  /**
   * Envuelve una acción del usuario: un solo sitio para el «ocupado», el mensaje de error **y el
   * registro**. Por eso lleva `label`: es lo que hace que la traza diga *qué* se intentó.
   */
  private async run(label: string, action: () => Promise<unknown>): Promise<void> {
    this.log.debug(`${label} ▶`);
    this.busy.set(true);
    this.actionError.set('');
    try {
      await action();
      this.log.debug(`${label} ✔`);
    } catch (error) {
      // El mensaje en pantalla NO sustituye al registro: el usuario ve una frase amable y aquí
      // queda la cadena de errores entera con su pila.
      this.log.warn(`${label} ✘`, error);
      this.actionError.set(describe(error));
    } finally {
      this.busy.set(false);
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'La acción no se ha podido completar.';
}

/**
 * El desenlace de una comprobación, en una frase.
 *
 * Se leen **las malas noticias primero**: un ciclo que se negaría a seguir, o filas que hay que
 * arreglar a mano, importan más que las cuentas de lo que se movería. Un resumen que empezara por «12
 * filas al día» dejaría enterrado el «y una pestaña ha desaparecido».
 */
function summaryOf(result: SynchronizeResult): string {
  if (!result.synced && result.reason !== undefined && result.reason !== 'blocked') {
    return {
      disconnected: 'No hay ninguna cuenta conectada.',
      'no-target': 'Esta cuenta todavía no tiene hoja: conéctala primero.',
      'stale-session': 'La sesión cambió mientras se comprobaba. Vuelve a intentarlo.',
      'stale-target': 'La hoja cambió mientras se comprobaba. Vuelve a intentarlo.',
      failed: 'No se ha podido leer la hoja. El motivo está en la consola.',
    }[result.reason];
  }

  const { barrier } = result.problems;
  if (barrier !== null) {
    return `La sincronización se negaría a seguir: ${barrier}. El detalle está en la consola.`;
  }

  // Solo van arriba las que piden mano humana. Un id cambiado y un alta sin id los arregla el propio
  // ciclo, así que son movimientos, no deberes del usuario.
  const problems = [
    count(result.problems.duplicates, 'id repetido', 'ids repetidos'),
    count(result.problems.unreadable, 'fila ilegible', 'filas ilegibles'),
    count(result.problems.ignored, 'fila local sin id', 'filas locales sin id'),
  ].filter((text) => text !== '');

  const moves = [
    count(result.movements.applied, 'fila bajaría', 'filas bajarían'),
    count(result.movements.pushed, 'fila subiría', 'filas subirían'),
    count(result.movements.removed, 'fila se borraría', 'filas se borrarían'),
    count(result.movements.merged, 'fila se fusionaría', 'filas se fusionarían'),
  ].filter((text) => text !== '');

  const head = problems.length > 0 ? `Hay que revisar: ${problems.join(', ')}. ` : '';
  const body = moves.length > 0 ? moves.join(', ') : 'todo está al día';
  return `${head}${body}. El detalle está en la consola.`;
}

/**
 * Lo que se movió en un ciclo, en una frase.
 *
 * Se cuentan las cuatro cosas porque la sincronización va en las dos direcciones: decir solo «12 filas
 * enviadas» esconde que además bajaron ocho de otro dispositivo, que es justo lo que a alguien le
 * interesa saber la primera vez que conecta un segundo aparato. Y las fusionadas aparte, porque son
 * las que antes se habrían perdido: un cambio de cada lado en campos distintos del mismo dato.
 */
function movements(result: SynchronizeResult): string {
  const parts = [
    count(result.movements.pushed, 'fila subida', 'filas subidas'),
    count(result.movements.applied, 'fila bajada', 'filas bajadas'),
    count(result.movements.removed, 'fila borrada', 'filas borradas'),
    count(result.movements.merged, 'fila fusionada', 'filas fusionadas'),
    count(result.problems.unreadable, 'fila ilegible', 'filas ilegibles'),
  ].filter((text) => text !== '');

  return parts.length === 0 ? 'Ya estaba todo al día' : parts.join(', ');
}

/** `''` cuando no hay ninguno, para que el resumen no se llene de ceros. */
function count(total: number, one: string, many: string): string {
  if (total === 0) {
    return '';
  }
  return total === 1 ? `1 ${one}` : `${total} ${many}`;
}
