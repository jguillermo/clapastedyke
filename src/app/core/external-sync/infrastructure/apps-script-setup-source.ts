import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { Logger } from '@core/_common/logger/logger';
import { SyncSetupSource } from '../domain/services/sync-setup-source';
import { SetupSnippet, SyncSetup } from '../domain/services/sync-setup.types';

/**
 * Dónde viven las fuentes del Web App, servidas junto a la app. Rutas **relativas** a propósito:
 * resuelven contra el `<base href>`, que en la demo de GitHub Pages es `/clapastedyke/` (mismo
 * criterio que `config.json`).
 */
const SCRIPT_URL = 'apps-script/Code.gs';
const MANIFEST_URL = 'apps-script/appsscript.json';

/**
 * La puesta en marcha **de este destino concreto**: un Web App de Apps Script.
 *
 * Junto a `apps-script-sync.gateway.ts` y `apps-script-endpoint.ts`, es de los pocos ficheros que
 * saben que al otro lado hay una hoja de cálculo de Google. Aquí vive el detalle de dónde están las
 * fuentes del script y qué datos del despliegue hay que llevarse a la consola.
 *
 * **Las fuentes se sirven desde `public/`, no se empaquetan en el bundle.** Es lo que permite que la
 * pantalla enseñe *exactamente* el código que hay que pegar sin que nadie lo transcriba, y que
 * corregir el script sea reemplazar un fichero del despliegue. Como contrapartida hay que ir a la red
 * a leerlo, así que la lectura **nunca lanza**: un fichero ausente deja su hueco vacío y la pantalla
 * lo cuenta, en vez de tirar la guía entera.
 */
@Injectable()
export class AppsScriptSetupSource extends SyncSetupSource {
  private readonly config = inject(AppConfig);
  private readonly log = inject(Logger).scoped('external-sync/apps-script-setup');

  async read(): Promise<SyncSetup> {
    const [script, manifest] = await Promise.all([
      this.readFile(SCRIPT_URL),
      this.readFile(MANIFEST_URL),
    ]);

    const { appsScriptUrl, googleClientId } = this.config.integration;
    const snippets: SetupSnippet[] = [
      { id: 'script', value: script },
      { id: 'manifest', value: manifest },
      { id: 'clientId', value: googleClientId ?? '' },
      { id: 'origin', value: window.location.origin },
      { id: 'endpoint', value: appsScriptUrl ?? '' },
    ];

    // Booleanos y tamaños, nunca los valores: el identificador y la dirección son configuración de
    // despliegue y no van a un registro. Es justo lo que hace falta para «la guía sale en blanco».
    this.log.debug('fuentes de la puesta en marcha leídas', {
      script: script.length,
      manifest: manifest.length,
      clientId: googleClientId !== null,
      endpoint: appsScriptUrl !== null,
    });

    return { snippets, configured: appsScriptUrl !== null && googleClientId !== null };
  }

  /** Devuelve el fichero, o cadena vacía si no se pudo leer. No lanza: el hueco vacío ya informa. */
  private async readFile(url: string): Promise<string> {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        this.log.warn('no se pudo leer una fuente de la puesta en marcha', undefined, {
          url,
          status: response.status,
        });
        return '';
      }
      return await response.text();
    } catch (error) {
      // Degradación silenciosa: la guía se queda sin el bloque de código y el usuario no sabría por
      // qué. Aquí es donde se registra, una sola vez, con la causa entera.
      this.log.warn('no se pudo leer una fuente de la puesta en marcha', error, { url });
      return '';
    }
  }
}
