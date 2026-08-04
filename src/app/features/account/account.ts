import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  type OnInit,
  signal,
} from '@angular/core';
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
import { CodeBlock } from '@components/code-block/code-block';
import { CopyField } from '@components/copy-field/copy-field';
import { Icon } from '@components/icon/icon';
import { Alert } from '@components/alert/alert';
import { Logger } from '@core/_common/logger/logger';
import { GetAuthSettings } from '@core/auth/application/use-cases/get-auth-settings.use-case';
import { SignIn } from '@core/auth/application/use-cases/sign-in.use-case';
import { SignOut } from '@core/auth/application/use-cases/sign-out.use-case';
import { WatchSession } from '@core/auth/application/use-cases/watch-session.use-case';
import {
  GetSyncSetup,
  SyncSetupView,
} from '@core/external-sync/application/use-cases/get-sync-setup.use-case';
import { OpenSyncTarget } from '@core/external-sync/application/use-cases/open-sync-target.use-case';
import { Synchronize } from '@core/external-sync/application/use-cases/synchronize.use-case';
import { VerifySyncConnection } from '@core/external-sync/application/use-cases/verify-sync-connection.use-case';
import { WatchSyncStatus } from '@core/external-sync/application/use-cases/watch-sync-status.use-case';

/** Una cosa concreta que puede hacer quien está delante, en imperativo. */
interface RemedyAction {
  text: string;
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
  /** El paso de la guía de puesta en marcha donde está el detalle largo. */
  guideStep?: number;
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
 * Tres bloques: **cuenta** (conectar / cerrar sesión, con la lista de pasos), **sincronización**
 * (estado, hoja, pendientes y sincronización manual) e **instalación** (el runbook de quien publica
 * la app, plegado).
 *
 * No hay bloque de «configuración». Que el despliegue traiga Client ID no es un estado que merezca
 * sitio propio en la pantalla: es la primera comprobación de conectar, y ahí se cuenta — con su
 * nombre, su ✔ y, si falta, el motivo y a dónde ir. Un panel permanente le explicaba el contenido de
 * un fichero de despliegue a quien solo venía a por su copia de seguridad.
 *
 * ## Conectar se cuenta paso a paso, y termina probando la ida y vuelta
 *
 * «Conectado» no significa «funciona». Iniciar sesión solo demuestra que el usuario se identificó;
 * entre eso y «mis recetas se guardan» está el permiso que no se concedió, el despliegue que
 * contesta pero no escribe y la hoja que alguien borró. Por eso conectar es una secuencia de cinco
 * pasos que el usuario ve marcarse, y el último de verdad es **mandar un dato de prueba y volver a
 * leerlo**: hasta que ese vuelve igual, la conexión no está lista.
 *
 * La feature solo orquesta casos de uso y traduce cada uno a un paso de la lista; ninguna de las
 * cinco operaciones sabe que hay una lista.
 *
 * ## Dos públicos en una pantalla, y no se mezclan
 *
 * **Quien usa la app hace una cosa: pulsar «Conectar con Google», elegir cuenta y aceptar un
 * permiso.** Nada más — ni consolas, ni proyectos, ni ficheros. La tarjeta de instalación es el
 * runbook de **quien publica la app**: se hace una vez, sirve para todos sus usuarios, y por eso
 * viene plegada y rotulada como lo que es.
 *
 * Lo mismo con los fallos: `StepRemedy` separa lo que puede resolver quien está delante de lo que
 * solo se arregla en la instalación. Cuando no hay nada que la persona pueda hacer, se le dice
 * exactamente eso —y que sus datos siguen a salvo— en vez de mandarla a Google Cloud.
 *
 * El montaje sí vive aquí, y no solo en `manual/appscript.md`, porque se hace **con la app
 * delante**: cada valor que hay que pegar sale con su botón de copiar y ya resuelto con la
 * configuración de ESTE despliegue. `GetSyncSetup` los trae; el código se lee de `public/`, así que
 * lo que se enseña es literalmente el fichero que se despliega, no una transcripción que se quede
 * vieja.
 *
 * Solo inyecta casos de uso. El estado reactivo llega por las signals que exponen `WatchSession` y
 * `WatchSyncStatus`, así que la vista no toca ni la sesión ni la cola. El porqué de cada ajuste y el
 * diagnóstico de fallos siguen en `manual/appscript.md`.
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
    CodeBlock,
    CopyField,
    Icon,
    Alert,
  ],
})
export class Account implements OnInit {
  private readonly watchSession = inject(WatchSession);
  private readonly watchStatus = inject(WatchSyncStatus);
  private readonly signIn = inject(SignIn);
  private readonly signOut = inject(SignOut);
  private readonly readSettings = inject(GetAuthSettings);
  private readonly readSetup = inject(GetSyncSetup);
  private readonly openTarget = inject(OpenSyncTarget);
  private readonly verifyConnection = inject(VerifySyncConnection);
  private readonly sync = inject(Synchronize);
  private readonly log = inject(Logger).scoped('ui/account');
  /** Para `afterNextRender` fuera del constructor: el salto a un paso de la guía. */
  private readonly injector = inject(Injector);

  /** Estado de la sesión y de la sincronización, tal como los publica cada caso de uso. */
  protected readonly session = this.watchSession.state;
  protected readonly status = this.watchStatus.state;

  protected readonly busy = signal(false);
  /** Error de la última acción del usuario (los de sincronización viven en `status`). */
  protected readonly actionError = signal('');

  /**
   * Lo que hay que llevarse a la consola de Google para dejar montado el destino. `null` mientras se
   * lee (el código sale de `public/`, así que hay una ida a la red).
   */
  protected readonly setup = signal<SyncSetupView | null>(null);

  /**
   * Si la guía de puesta en marcha está desplegada. **Se abre sola cuando falta configuración**: quien
   * ya lo tiene montado no necesita doce pasos delante cada vez que entra, y quien no, no debería
   * tener que buscarlos.
   */
  protected readonly guideOpen = signal(false);

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
   * Los cinco pasos, en orden. Cada uno es **un caso de uso**: si un paso necesitara saber algo del
   * anterior que no sea «salió bien», el que estaría mal partido es el caso de uso.
   *
   * Cada uno lleva además **qué está haciendo** y **qué hacer si se rompe, separado por quién puede
   * hacerlo**. Casi todos estos fallos son de la instalación, no de la cuenta de quien está delante:
   * ese reparto es lo que evita pedirle a alguien que solo quería su copia de seguridad que abra la
   * consola de Google.
   */
  private readonly steps: readonly ConnectStep[] = [
    {
      label: 'Leyendo el Client ID de la configuración',
      doing: 'Buscando el identificador de la app en su configuración…',
      run: () => this.readClientId(),
      remedy: {
        what: 'Leo el identificador de esta app ante Google. Viene con la instalación, es el mismo para todo el mundo y no depende de tu cuenta.',
        userActions: [],
        deployerHint:
          'Falta googleClientId en public/config.json. Se crea una vez en la consola de Google Cloud (paso 3 de la guía) y se pega en ese fichero; no hay que recompilar.',
        guideStep: 3,
      },
    },
    {
      label: 'Conectando con tu cuenta de Google',
      doing: 'Esperando a que elijas cuenta y aceptes el permiso…',
      run: () => this.authenticate(),
      remedy: {
        what: 'Le pido a Google que te identifique y me dé permiso para crear un archivo en tu Drive. El permiso es el más estrecho que existe: solo alcanza los archivos que crea esta app, no ve el resto de tu Drive.',
        userActions: [
          {
            text: 'Si no llegaste a ver la ventana de Google, la bloqueó el navegador: permite las ventanas emergentes de este sitio y vuelve a intentarlo.',
          },
          {
            text: 'Cuando Google te pregunte, marca la casilla del permiso. Sin ella no hay dónde guardar la copia.',
          },
        ],
        deployerHint:
          'Si Google habló de un origen no autorizado o de «acceso bloqueado», es cosa de la instalación: falta autorizar esta dirección en el Client ID, o dar de alta esa cuenta como usuario de prueba.',
        guideStep: 2,
      },
    },
    {
      label: 'Preparando la hoja en tu Drive',
      doing: 'Pidiendo que se localice tu hoja de cálculo, o que se cree…',
      run: () => this.prepareTarget(),
      remedy: {
        what: 'Pido que se busque en tu Drive la hoja «Clapastedyke — Recetario», o que se cree si es la primera vez. Quien la crea es el sincronizador que viene con la instalación.',
        userActions: [],
        deployerHint:
          'El sincronizador no está desplegado, o su dirección no está en public/config.json. Es un Apps Script que se despliega una vez (pasos 5 a 9 de la guía).',
        guideStep: 5,
      },
    },
    {
      label: 'Enviando y leyendo un dato de prueba',
      doing: 'Escribiendo un dato de prueba y volviéndolo a leer…',
      run: () => this.checkRoundTrip(),
      remedy: {
        what: 'Escribo un dato de usar y tirar en tu hoja y lo leo de vuelta. Es lo único que demuestra que todo funciona antes de mandar nada tuyo.',
        userActions: [],
        deployerHint:
          'La hoja existe pero la escritura no cuaja. Suele ser un despliegue anticuado: hay que volver a pegar el Code.gs y publicar una versión nueva (guardar en el editor no despliega).',
        guideStep: 5,
      },
    },
    {
      label: 'Sincronizando tu recetario',
      doing: 'Mandando tus recetas e insumos a la hoja…',
      run: () => this.pushEverything(),
      remedy: {
        what: 'Mando todas tus recetas e insumos a la hoja de una vez. Repetirlo no duplica nada.',
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

  async ngOnInit(): Promise<void> {
    // Angular no espera este hook: sin `catch` un fallo sería un rechazo no capturado.
    try {
      const setup = await this.readSetup.execute();
      this.setup.set(setup);
      // NO se abre sola aunque falte configuración: quien entra aquí casi siempre viene a por su
      // copia de seguridad, y esos pasos no son suyos. Si algo falla, el aviso del paso roto ofrece
      // el botón que la abre justo por donde toca.
      this.log.debug('guía de puesta en marcha lista', { configurado: setup.configured });
    } catch (error) {
      // El caso de uso no lanza —los huecos vienen vacíos—, así que llegar aquí es un fallo de
      // verdad. La guía se queda sin datos y hay que dejar rastro de por qué.
      this.log.error('no se pudo preparar la guía de puesta en marcha', error);
    }
  }

  protected toggleGuide(): void {
    this.guideOpen.update((open) => !open);
  }

  /** El design system no registra; aquí sí interesa saber que alguien se llevó un trozo de la guía. */
  protected onCopied(what: string): void {
    this.log.debug('copiado de la guía', { what });
  }

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
   * Abre la guía por el paso que toca y baja hasta él.
   *
   * El desplazamiento se hace **después** de que Angular haya pintado la guía: hasta entonces el
   * destino no existe en el documento, porque el cuerpo de la tarjeta está detrás de un `@if`.
   */
  protected showGuideStep(step: number): void {
    this.guideOpen.set(true);
    this.log.debug('saltando a un paso de la guía', { step });
    afterNextRender(
      () =>
        document.getElementById(`paso-${step}`)?.scrollIntoView({
          // Respeta a quien pidió que la interfaz no se mueva (WCAG 2.3.3).
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        }),
      { injector: this.injector },
    );
  }

  protected async disconnect(): Promise<void> {
    this.progress.set([]);
    this.failure.set(null);
    this.ready.set(false);
    await this.run('desconectar cuenta', () => this.signOut.execute());
  }

  /** Empuja el recetario completo. Idempotente: repetirlo no duplica nada en la hoja. */
  protected async syncAll(): Promise<void> {
    await this.run('sincronizar todo', async () => {
      await this.sync.execute({ scope: 'all' });
    });
  }

  // ── Los pasos ────────────────────────────────────────────────────────────────────────────────

  /**
   * Que exista Client ID es el primer paso de la lista, y no un estado permanente de la pantalla,
   * porque solo importa cuando alguien intenta conectar. Enseñarlo siempre era contar el detalle de
   * un fichero de despliegue a quien solo quería su copia de seguridad.
   */
  private async readClientId(): Promise<string> {
    const { isConfigured } = await this.readSettings.execute();
    if (!isConfigured) {
      throw new Error(
        'Este despliegue no trae Client ID de OAuth en public/config.json, así que no se puede conectar ninguna cuenta. Sigue la guía de puesta en marcha, más abajo.',
      );
    }
    return 'Encontrado en la configuración del despliegue';
  }

  private async authenticate(): Promise<string> {
    const { email } = await this.signIn.execute();
    return email;
  }

  private async prepareTarget(): Promise<string> {
    await this.openTarget.execute();
    return 'La hoja está lista en tu Drive';
  }

  private async checkRoundTrip(): Promise<string> {
    await this.verifyConnection.execute();
    return 'El dato de prueba ha vuelto igual que se envió';
  }

  private async pushEverything(): Promise<string> {
    const result = await this.sync.execute({ scope: 'all' });
    if (!result.synced) {
      // `Synchronize` no lanza: informa del desenlace y deja el motivo en el estado.
      throw new Error(this.status().lastError ?? 'No se ha podido subir el recetario.');
    }
    return result.rows === 1 ? '1 fila enviada' : `${result.rows} filas enviadas`;
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
