import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
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

  async execute(): Promise<AuthSettingsView> {
    const clientId = await this.settings.clientId();
    return { clientId: clientId ?? '', isConfigured: clientId !== null };
  }
}
