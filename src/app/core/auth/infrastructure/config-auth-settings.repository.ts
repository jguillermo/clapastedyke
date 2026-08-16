import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { Logger } from '@core/_common/logger/logger';
import { AuthSettingsRepository } from '../domain/repositories/auth-settings.repository';

/**
 * Los ajustes salen de la **configuración del despliegue** (`public/config.json`), y de ningún otro
 * sitio.
 *
 * El prefijo de transporte es `Config` porque esa es la fuente: el fichero que se sirve junto a la
 * app, leído antes de arrancar. No hay IndexedDB de por medio — el identificador de cliente
 * identifica a la *aplicación*, así que no es un dato de este navegador ni de este usuario, y
 * guardarlo por navegador solo conseguía que dos personas con la misma app tuvieran configuraciones
 * distintas sin saberlo.
 *
 * Queda un store `auth_settings` en IndexedDB de cuando sí se guardaba aquí; sigue declarado en
 * `_common/infrastructure/indexeddb/database.ts` porque los stores solo se AÑADEN, pero ya nadie lo
 * lee ni lo escribe.
 */
@Injectable()
export class ConfigAuthSettingsRepository extends AuthSettingsRepository {
  private readonly config = inject(AppConfig);
  private readonly log = inject(Logger).scoped('auth/settings-repo');

  async clientId(): Promise<string | null> {
    const clientId = this.config.integration.googleClientId;
    // Un booleano, nunca el identificador: es configuración de despliegue y no va a un registro.
    // Y es justo lo que hay que saber cuando «no conecta y no sé por qué».
    this.log.debug('identificador de cliente leído del despliegue', {
      configurado: clientId !== null,
    });
    return clientId;
  }
}
