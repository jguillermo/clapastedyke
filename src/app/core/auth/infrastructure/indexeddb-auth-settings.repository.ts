import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
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

  async clientId(): Promise<string | null> {
    const record = await this.store.get(RECORD_ID);
    const stored = (record?.clientId ?? '').trim();
    return stored.length > 0 ? stored : this.config.integration.googleClientId;
  }

  async saveClientId(clientId: string | null): Promise<void> {
    await this.store.put({ id: RECORD_ID, clientId });
  }
}
