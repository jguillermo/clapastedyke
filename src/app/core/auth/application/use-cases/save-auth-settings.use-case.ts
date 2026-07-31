import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';

export interface SaveAuthSettingsRequest {
  /** En blanco = borrar el ajuste local y volver a usar el del despliegue. */
  clientId: string;
}

/** Guarda el identificador de cliente de este navegador. */
@Injectable({ providedIn: 'root' })
export class SaveAuthSettings extends UseCase<SaveAuthSettingsRequest, void> {
  private readonly settings = inject(AuthSettingsRepository);

  async execute({ clientId }: SaveAuthSettingsRequest): Promise<void> {
    const trimmed = clientId.trim();
    await this.settings.saveClientId(trimmed.length > 0 ? trimmed : null);
  }
}
