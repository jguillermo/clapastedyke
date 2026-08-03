import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { Logger } from '@core/_common/logger/logger';
import { postToAppsScript } from './apps-script-endpoint';
import { SyncGateway } from '../domain/services/sync.gateway';
import { SyncError, SyncOutcome, SyncRequest } from '../domain/services/sync.gateway.types';
import { SyncTarget } from '../domain/value-objects/sync-target';

/** Respuesta de la operación `upsert` del Web App (contrato de infraestructura). */
interface UpsertResponse {
  ok: true;
  spreadsheetId: string;
  spreadsheetUrl: string;
  applied?: Record<string, number>;
  cached?: boolean;
}

/**
 * Implementación del puerto contra **Google Sheets**, a través de un Web App de Apps Script.
 *
 * Este fichero y `apps-script-endpoint.ts` son los únicos del contexto que saben que el destino es
 * una hoja de cálculo: aquí viven la URL, el nombre de la operación y la forma de la respuesta.
 * Cambiar de destino es escribir otro `SyncGateway` y tocar una línea de `external-sync.providers.ts`.
 *
 * La app **nunca** llama a las APIs de Sheets o Drive: manda una sola operación al script, que
 * decide dónde está la hoja del usuario, la crea si hace falta y aplica el upsert con la credencial
 * de quien llama.
 *
 * Anticorruption Layer: traduce la respuesta plana a los value objects del dominio y la ausencia de
 * configuración a un fallo del puerto.
 */
@Injectable()
export class AppsScriptSyncGateway extends SyncGateway {
  private readonly config = inject(AppConfig);
  private readonly log = inject(Logger).scoped('external-sync/apps-script');

  async send({ credential, batch }: SyncRequest): Promise<SyncOutcome> {
    // A dónde se manda es configuración del despliegue, no del dominio ni de la sesión.
    const endpoint = this.config.integration.appsScriptUrl;
    if (!endpoint) {
      this.log.debug('sin URL de Apps Script configurada, no se envía nada');
      throw new SyncError(
        'NOT_CONFIGURED',
        'Falta la URL del Apps Script en la configuración del despliegue (ver appscript.md, paso 8).',
      );
    }

    // El límite exterior: qué sale y qué vuelve. NUNCA el token ni el contenido de las filas.
    this.log.debug('POST upsert ▶', { requestId: batch.requestId, filas: batch.total });
    const response = await postToAppsScript<UpsertResponse>(endpoint, {
      op: 'upsert',
      requestId: batch.requestId,
      accessToken: credential,
      sentAt: batch.syncedAt,
      payload: batch.payload(),
    });
    this.log.debug('POST upsert ✔', {
      requestId: batch.requestId,
      aplicadas: response.applied ?? {},
      cached: response.cached === true,
    });

    return {
      target: SyncTarget.of(response.spreadsheetId, response.spreadsheetUrl),
      applied: response.applied ?? {},
    };
  }
}
