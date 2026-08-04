import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { AuthSettingsRepository } from './domain/repositories/auth-settings.repository';
import { Authenticator } from './domain/services/authenticator';
import { Session } from './domain/services/session';
import { ConfigAuthSettingsRepository } from './infrastructure/config-auth-settings.repository';
import { GoogleAuthenticator } from './infrastructure/google-authenticator';
import { InMemorySession } from './infrastructure/in-memory-session';
import { SessionCredentialsProvider } from './infrastructure/session-credentials-provider';

/**
 * DI del contexto `auth`. **Aquí se decide el proveedor de identidad**: cambiar Google por otro es
 * escribir otro `Authenticator` y tocar esta línea; ni el dominio ni los casos de uso se enteran.
 *
 * **Este contexto no persiste nada.** La sesión vive en memoria y los ajustes salen de la
 * configuración del despliegue. Sin app-initializer: sin sesión no hay nada que arrancar, y ese es el
 * estado inicial de la app.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Authenticator, useClass: GoogleAuthenticator },
    { provide: Session, useClass: InMemorySession },
    { provide: AuthSettingsRepository, useClass: ConfigAuthSettingsRepository },
    // Cómo obtiene otro contexto las credenciales de la sesión. El contrato es del shared kernel,
    // así que nadie necesita conocer este contexto para actuar en nombre del usuario.
    { provide: CredentialsProvider, useClass: SessionCredentialsProvider },
  ]);
}
