import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Logger } from '../../../_common/logger/logger';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';

export interface SaveAuthSettingsRequest {
  /** En blanco = borrar el ajuste local y volver a usar el del despliegue. */
  clientId: string;
}

/** Guarda el identificador de cliente de este navegador. */
@Injectable({ providedIn: 'root' })
export class SaveAuthSettings extends UseCase<SaveAuthSettingsRequest, void> {
  private readonly settings = inject(AuthSettingsRepository);
  private readonly log = inject(Logger).scoped('auth/save-settings');

  async execute({ clientId }: SaveAuthSettingsRequest): Promise<void> {
    const trimmed = clientId.trim();
    const borrando = trimmed.length === 0;
    this.log.debug(borrando ? 'borrando el ajuste local' : 'guardando el ajuste local');
    await this.settings.saveClientId(borrando ? null : trimmed);
    // `local` es si queda un ajuste propio de este navegador; sin él puede seguir valiendo el del
    // despliegue, así que decir `isConfigured` aquí sería mentir.
    this.log.debug('ajuste guardado', { local: !borrando });
  }
}
