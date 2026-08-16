import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AccountHistory } from '@core/_common/credentials/account-history';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { ResumeSession } from './application/use-cases/resume-session.use-case';
import { AuthSettingsRepository } from './domain/repositories/auth-settings.repository';
import { SessionHintRepository } from './domain/repositories/session-hint.repository';
import { Authenticator } from './domain/services/authenticator';
import { Session } from './domain/services/session';
import { ConfigAuthSettingsRepository } from './infrastructure/config-auth-settings.repository';
import { GoogleAuthenticator } from './infrastructure/google-authenticator';
import { IndexedDbSessionHintRepository } from './infrastructure/indexeddb-session-hint.repository';
import { InMemorySession } from './infrastructure/in-memory-session';
import { SessionCredentialsProvider } from './infrastructure/session-credentials-provider';
import { SessionHintAccountHistory } from './infrastructure/session-hint-account-history';

/**
 * DI del contexto `auth`. **Aquí se decide el proveedor de identidad**: cambiar Google por otro es
 * escribir otro `Authenticator` y tocar esta línea; ni el dominio ni los casos de uso se enteran.
 *
 * **La credencial nunca se persiste**: vive en memoria y muere con la pestaña. Lo único que se guarda
 * es una pista de con qué cuenta se estaba, que por sí sola no abre nada.
 *
 * El app-initializer intenta **reanudar** con esa pista, y lo hace sin esperar: pedirle un token al
 * proveedor tarda unas décimas y bloquear el arranque por eso dejaría la cocina en blanco. Mientras
 * tanto la app funciona igual —local-first—, y cuando la sesión vuelve, la pantalla de cuenta se
 * entera sola porque lee una signal.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Authenticator, useClass: GoogleAuthenticator },
    { provide: Session, useClass: InMemorySession },
    { provide: AuthSettingsRepository, useClass: ConfigAuthSettingsRepository },
    { provide: SessionHintRepository, useClass: IndexedDbSessionHintRepository },
    // Cómo obtiene otro contexto las credenciales de la sesión. El contrato es del shared kernel,
    // así que nadie necesita conocer este contexto para actuar en nombre del usuario.
    { provide: CredentialsProvider, useClass: SessionCredentialsProvider },
    // Si este navegador tuvo cuenta alguna vez. Lo pregunta el recetario para no sembrar datos de
    // ejemplo encima de datos de verdad, y se contesta sin red. Ver `AccountHistory`.
    { provide: AccountHistory, useClass: SessionHintAccountHistory },
    // `void`: el caso de uso absorbe su propio fallo, así que no puede dejar un rechazo suelto.
    provideAppInitializer(() => {
      void inject(ResumeSession).execute();
    }),
  ]);
}
