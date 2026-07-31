import { Injectable } from '@angular/core';
import { AppConfig, CONFIG_DOCUMENT_URL, IntegrationConfig } from './app-config';

/** Forma del `public/config.json` (contrato de infraestructura, todo opcional). */
interface ConfigDocument {
  appsScriptUrl?: string;
  googleClientId?: string;
}

const EMPTY: IntegrationConfig = { appsScriptUrl: null, googleClientId: null };

/**
 * Lee `config.json` desde `public/` con `fetch` en runtime (sin `HttpClient`, que no está provisto
 * en la app — mismo patrón que `HttpSeedDataSource`). Si el fichero no existe o falla la lectura,
 * la configuración queda vacía en lugar de romper el arranque: la app sigue siendo usable en local
 * y la pantalla de cuenta explica qué falta.
 *
 * La URL es **relativa** a propósito: resuelve contra el `<base href>`, que en la demo de GitHub
 * Pages es `/clapastedyke/`.
 */
@Injectable()
export class PublicFileAppConfig extends AppConfig {
  private value: IntegrationConfig = EMPTY;

  get integration(): IntegrationConfig {
    return this.value;
  }

  async load(): Promise<void> {
    try {
      const res = await fetch(CONFIG_DOCUMENT_URL, { cache: 'no-cache' });
      if (!res.ok) {
        return;
      }
      const doc = (await res.json()) as ConfigDocument;
      this.value = {
        appsScriptUrl: trimmedOrNull(doc.appsScriptUrl),
        googleClientId: trimmedOrNull(doc.googleClientId),
      };
    } catch {
      this.value = EMPTY;
    }
  }
}

function trimmedOrNull(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
