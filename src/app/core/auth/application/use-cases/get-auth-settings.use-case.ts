import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Logger } from '../../../_common/logger/logger';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';

export interface AuthSettingsView {
  clientId: string;
  /** `false` mientras no haya `clientId`: la pantalla lo usa para explicar qué falta. */
  isConfigured: boolean;
}

/** Lee el ajuste efectivo para rellenar el formulario de la pantalla de cuenta. */
@Injectable({ providedIn: 'root' })
export class GetAuthSettings extends UseCase<void, AuthSettingsView> {
  private readonly settings = inject(AuthSettingsRepository);
  private readonly log = inject(Logger).scoped('auth/get-settings');

  async execute(): Promise<AuthSettingsView> {
    const clientId = await this.settings.clientId();
    // Booleano, nunca el identificador de cliente: un secreto de despliegue no va a un registro.
    this.log.debug('ajustes leídos', { isConfigured: clientId !== null });
    return { clientId: clientId ?? '', isConfigured: clientId !== null };
  }
}
