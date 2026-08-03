import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardSubtitle } from '@components/card/card-subtitle';
import { CardTitle } from '@components/card/card-title';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { Button } from '@components/button/button';
import { Badge } from '@components/badge/badge';
import { Icon } from '@components/icon/icon';
import { Alert } from '@components/alert/alert';
import { Logger } from '@core/_common/logger/logger';
import { GetAuthSettings } from '@core/auth/application/use-cases/get-auth-settings.use-case';
import { SaveAuthSettings } from '@core/auth/application/use-cases/save-auth-settings.use-case';
import { SignIn } from '@core/auth/application/use-cases/sign-in.use-case';
import { SignOut } from '@core/auth/application/use-cases/sign-out.use-case';
import { WatchSession } from '@core/auth/application/use-cases/watch-session.use-case';
import { Synchronize } from '@core/external-sync/application/use-cases/synchronize.use-case';
import { WatchSyncStatus } from '@core/external-sync/application/use-cases/watch-sync-status.use-case';

/**
 * Pantalla de cuenta (`/cuenta`): conectar una cuenta de Google y ver el estado de la
 * sincronización con la hoja de cálculo.
 *
 * Tres bloques, en el orden en que se usan la primera vez: **configuración** (el Client ID de OAuth
 * de este navegador), **cuenta** (conectar / cerrar sesión) y **sincronización** (estado, hoja,
 * pendientes y sincronización manual).
 *
 * Solo inyecta casos de uso. El estado reactivo llega por las signals que exponen `WatchSession` y
 * `WatchSyncStatus`, así que la vista no toca ni la sesión ni la cola. La guía de puesta en marcha
 * está en `appscript.md`.
 */
@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  host: { class: 'block min-h-dvh bg-surface-page' },
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    FormField,
    InputField,
    Button,
    Badge,
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
  private readonly writeSettings = inject(SaveAuthSettings);
  private readonly sync = inject(Synchronize);
  private readonly log = inject(Logger).scoped('ui/account');

  /** Estado de la sesión y de la sincronización, tal como los publica cada caso de uso. */
  protected readonly session = this.watchSession.state;
  protected readonly status = this.watchStatus.state;

  protected readonly busy = signal(false);
  protected readonly settingsSaved = signal(false);
  /** Error de la última acción del usuario (los de sincronización viven en `status`). */
  protected readonly actionError = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({ clientId: '' });

  async ngOnInit(): Promise<void> {
    // Angular no espera este hook: sin `catch` un fallo sería un rechazo no capturado y el
    // formulario se quedaría vacío sin explicación.
    try {
      const settings = await this.readSettings.execute();
      this.form.patchValue({ clientId: settings.clientId });
      this.log.debug('ajustes cargados en el formulario', {
        isConfigured: settings.isConfigured,
      });
    } catch (error) {
      this.log.warn('no se pudieron leer los ajustes: el formulario arranca vacío', error);
    }
  }

  /** Guarda la configuración de este navegador sin conectar todavía. */
  protected async saveSettings(): Promise<void> {
    await this.run('guardar ajustes', async () => {
      await this.writeSettings.execute(this.form.getRawValue());
      this.settingsSaved.set(true);
    });
  }

  /**
   * Conecta con Google. Guarda antes lo que haya en el formulario: es lo que el usuario espera tras
   * pegar su Client ID y pulsar «Conectar» directamente.
   */
  protected async connect(): Promise<void> {
    await this.run('conectar cuenta', async () => {
      await this.writeSettings.execute(this.form.getRawValue());
      await this.signIn.execute();
    });
  }

  protected async disconnect(): Promise<void> {
    await this.run('desconectar cuenta', () => this.signOut.execute());
  }

  /** Empuja el recetario completo. Idempotente: repetirlo no duplica nada en la hoja. */
  protected async syncAll(): Promise<void> {
    await this.run('sincronizar todo', async () => {
      await this.sync.execute({ scope: 'all' });
    });
  }

  /**
   * Envuelve una acción del usuario: un solo sitio para el «ocupado», el mensaje de error **y el
   * registro**. Por eso lleva `label`: es lo que hace que la traza diga *qué* se intentó.
   */
  private async run(label: string, action: () => Promise<unknown>): Promise<void> {
    this.log.debug(`${label} ▶`);
    this.busy.set(true);
    this.actionError.set('');
    this.settingsSaved.set(false);
    try {
      await action();
      this.log.debug(`${label} ✔`);
    } catch (error) {
      // El mensaje en pantalla NO sustituye al registro: el usuario ve una frase amable y aquí
      // queda la cadena de errores entera con su pila.
      this.log.warn(`${label} ✘`, error);
      this.actionError.set(
        error instanceof Error ? error.message : 'La acción no se ha podido completar.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
