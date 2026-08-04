import { Injectable, InjectionToken, inject } from '@angular/core';
import { AppConfig, ConfigDocument, CONFIG_DOCUMENT_URL, IntegrationConfig } from './app-config';

/**
 * El documento ya leído, tal cual venía del fichero. `null` significa **no se pudo leer** —no
 * existe, no es JSON válido, la red falló—, que no es lo mismo que estar vacío: quien despliega
 * quiere saber la diferencia.
 *
 * Tiene factoría por defecto (`null`) para que un `TestBed` que no lo declare no reviente.
 */
export const CONFIG_DOCUMENT = new InjectionToken<ConfigDocument | null>('migo.config.document', {
  factory: () => null,
});

/**
 * Lee `config.json` desde `public/` con `fetch` (sin `HttpClient`, que no está provisto en la app —
 * mismo patrón que `HttpSeedDataSource`).
 *
 * **Se llama desde `main.ts`, antes de `bootstrapApplication`**, y por eso es una función suelta y no
 * un método de un servicio: cuando corre todavía no hay inyector. A cambio, cuando la app arranca la
 * configuración ya está resuelta y es **síncrona** para todo el mundo — incluido el `Logger`, que si
 * no se perdería las trazas del propio arranque.
 *
 * **Nunca lanza y nunca registra**: devuelve `null` y deja que el arranque decida qué contar, que es
 * quien ya tiene un `Logger` (un dueño por fallo).
 *
 * La URL es **relativa** a propósito: resuelve contra el `<base href>`, que en la demo de GitHub
 * Pages es `/clapastedyke/`.
 */
export async function readConfigDocument(): Promise<ConfigDocument | null> {
  try {
    const res = await fetch(CONFIG_DOCUMENT_URL, { cache: 'no-cache' });
    return res.ok ? ((await res.json()) as ConfigDocument) : null;
  } catch {
    return null;
  }
}

const EMPTY: IntegrationConfig = { googleClientId: null };

/**
 * {@link AppConfig} sobre el documento servido en `public/config.json`.
 *
 * No lee nada: recibe el documento ya resuelto por {@link readConfigDocument} y solo lo **normaliza**
 * —cadenas en blanco a `null`, claves ausentes a su defecto—, que es la tolerancia que hace falta
 * cuando el fichero lo escribe una persona a mano.
 *
 * Si el documento no se pudo leer, la integración queda apagada y `debug` en `false`: la app sigue
 * siendo usable en local y la pantalla de cuenta explica qué falta.
 */
@Injectable()
export class PublicFileAppConfig extends AppConfig {
  private readonly document = inject(CONFIG_DOCUMENT);

  get debug(): boolean {
    return this.document?.debug === true;
  }

  get integration(): IntegrationConfig {
    if (!this.document) {
      return EMPTY;
    }
    return { googleClientId: trimmedOrNull(this.document.googleClientId) };
  }
}

function trimmedOrNull(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
