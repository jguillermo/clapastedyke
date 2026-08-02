import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { AuthSettingsRepository } from '../domain/repositories/auth-settings.repository';

/**
 * Documento plano de los ajustes, persistido en IndexedDB (store `auth_settings`).
 *
 * Solo configuración. Deliberadamente NO hay campos para la credencial ni la cuenta: si no hay
 * dónde escribirlos, no se pueden filtrar por descuido.
 */
interface AuthSettingsRecord {
  id: string;
  clientId?: string | null;
}

/** Clave fija: hay un único ajuste por navegador. */
const RECORD_ID = 'auth';

/**
 * Ajustes en IndexedDB con **respaldo en la configuración del despliegue**: si este navegador no ha
 * guardado nada, se devuelve el valor de `public/config.json`. Es una composición de dos fuentes de
 * datos, que es justo el trabajo de un repositorio; así la regla de precedencia («lo que guardó el
 * usuario manda») está en un solo sitio y ni el dominio ni los casos de uso la repiten.
 */
@Injectable()
export class IndexedDbAuthSettingsRepository extends AuthSettingsRepository {
  private readonly store = new IndexedDbStore<AuthSettingsRecord>('auth_settings');
  private readonly config = inject(AppConfig);
  private readonly log = inject(Logger).scoped('auth/settings-repo');

  async clientId(): Promise<string | null> {
    const record = await this.store.get(RECORD_ID);
    const stored = (record?.clientId ?? '').trim();
    if (stored.length > 0) {
      this.log.debug('usando el ajuste guardado en este navegador');
      return stored;
    }
    // Qué fuente ganó es justo lo que hay que saber cuando «no conecta y no sé por qué».
    const fromDeployment = this.config.integration.googleClientId;
    this.log.debug('sin ajuste local, se cae al del despliegue', {
      configurado: fromDeployment !== null,
    });
    return fromDeployment;
  }

  async saveClientId(clientId: string | null): Promise<void> {
    await this.store.put({ id: RECORD_ID, clientId });
    this.log.debug('ajuste persistido', { local: clientId !== null });
  }
}
