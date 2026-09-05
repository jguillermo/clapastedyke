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
import { SessionTokenRepository } from './domain/repositories/session-token.repository';
import { Authenticator } from './domain/services/authenticator';
import { Session } from './domain/services/session';
import { BackendAuthenticator } from './infrastructure/backend-authenticator';
import { ConfigAuthSettingsRepository } from './infrastructure/config-auth-settings.repository';
import { IndexedDbSessionHintRepository } from './infrastructure/indexeddb-session-hint.repository';
import { IndexedDbSessionTokenRepository } from './infrastructure/indexeddb-session-token.repository';
import { InMemorySession } from './infrastructure/in-memory-session';
import { SessionCredentialsProvider } from './infrastructure/session-credentials-provider';
import { SessionHintAccountHistory } from './infrastructure/session-hint-account-history';

/**
 * DI del contexto `auth`. **Aquí se decide el proveedor de identidad**: cambiar de proveedor es
 * escribir otro `Authenticator` y tocar esta línea; ni el dominio ni los casos de uso se enteran.
 *
 * **En el navegador no se persiste ninguna credencial de Google**: la de acceso vive en memoria y
 * muere con la pestaña, y el permiso duradero no sale nunca del backend. Lo que sí se guarda aquí es
 * una pista de con qué cuenta se estaba y el identificador de sesión que emite el backend — dos
 * cosas que por sí solas no abren nada, porque quien decide si esa sesión sigue viva es el servidor.
 *
 * Ese identificador viaja también en una cookie `HttpOnly` que este código no puede leer (ni él ni
 * un XSS), y esa es la vía preferida; se guarda además una copia porque la cookie es de otro dominio
 * y Safari e iOS la bloquean. Ver `BackendAuthenticator` y `SessionTokenRepository`.
 *
 * El app-initializer intenta **reanudar** con esa pista, y lo hace sin esperar: pedirle un token al
 * backend tarda unas décimas y bloquear el arranque por eso dejaría la cocina en blanco. Mientras
 * tanto la app funciona igual —local-first—, y cuando la sesión vuelve, la pantalla de cuenta se
 * entera sola porque lee una signal.
 *
 * Nadie llega a ver «Conectar con Google» durante esas décimas: en cuanto se lee la pista, la sesión
 * se abre **sin conexión** y solo asciende a activa cuando el backend contesta. Ver `ResumeSession`.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Authenticator, useClass: BackendAuthenticator },
    { provide: Session, useClass: InMemorySession },
    { provide: AuthSettingsRepository, useClass: ConfigAuthSettingsRepository },
    { provide: SessionHintRepository, useClass: IndexedDbSessionHintRepository },
    { provide: SessionTokenRepository, useClass: IndexedDbSessionTokenRepository },
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
