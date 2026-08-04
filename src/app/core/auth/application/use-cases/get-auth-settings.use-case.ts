import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Logger } from '../../../_common/logger/logger';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';

export interface AuthSettingsView {
  /** `false` mientras no haya identificador de cliente: la pantalla lo usa para explicar qué falta. */
  isConfigured: boolean;
}

/**
 * ¿Está la app en condiciones de conectar una cuenta?
 *
 * Devuelve un booleano y **no el identificador**: la pantalla ya no lo pide ni lo enseña, así que
 * sacarlo de aquí solo serviría para que acabara pintado en algún sitio.
 */
@Injectable({ providedIn: 'root' })
export class GetAuthSettings extends UseCase<void, AuthSettingsView> {
  private readonly settings = inject(AuthSettingsRepository);
  private readonly log = inject(Logger).scoped('auth/get-settings');

  async execute(): Promise<AuthSettingsView> {
    const clientId = await this.settings.clientId();
    // Booleano, nunca el identificador de cliente: la configuración del despliegue no va a un registro.
    this.log.debug('ajustes leídos', { isConfigured: clientId !== null });
    return { isConfigured: clientId !== null };
  }
}
