import { inject, Injectable } from '@angular/core';
import { AppConfig } from '@core/_common/infrastructure/config/app-config';
import { Logger } from '@core/_common/logger/logger';
import { postToAppsScript } from './apps-script-endpoint';
import { SyncGateway } from '../domain/services/sync.gateway';
import {
  OpenRequest,
  ProbeOutcome,
  ProbeRequest,
  SyncError,
  SyncOutcome,
  SyncRequest,
} from '../domain/services/sync.gateway.types';
import { SyncTarget } from '../domain/value-objects/sync-target';

/** Respuesta común a las tres operaciones del Web App (contrato de infraestructura). */
interface AppsScriptResponse {
  ok: true;
  spreadsheetId: string;
  spreadsheetUrl: string;
  applied?: Record<string, number>;
  cached?: boolean;
  /** Solo en `verify`: lo que el script leyó de la hoja después de escribir la prueba. */
  echo?: string | null;
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
    // El límite exterior: qué sale y qué vuelve. NUNCA el token ni el contenido de las filas.
    this.log.debug('POST upsert ▶', { requestId: batch.requestId, filas: batch.total });
    const response = await this.post({
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
      target: this.targetOf(response),
      applied: response.applied ?? {},
    };
  }

  /**
   * `hello`: el script localiza la hoja del usuario o la crea, y devuelve dónde quedó. No escribe
   * ninguna fila del recetario.
   */
  async open({ credential }: OpenRequest): Promise<SyncTarget> {
    this.log.debug('POST hello ▶');
    const response = await this.post({
      op: 'hello',
      requestId: crypto.randomUUID(),
      accessToken: credential,
      sentAt: new Date().toISOString(),
    });
    this.log.debug('POST hello ✔');
    return this.targetOf(response);
  }

  /**
   * `verify`: el script escribe la prueba en la pestaña `_meta` de la hoja y la relee de allí. El
   * `echo` es lo que leyó, en crudo — comparar es cosa del caso de uso.
   */
  async probe({ credential, probe }: ProbeRequest): Promise<ProbeOutcome> {
    this.log.debug('POST verify ▶');
    const response = await this.post({
      op: 'verify',
      requestId: crypto.randomUUID(),
      accessToken: credential,
      sentAt: new Date().toISOString(),
      probe: probe.value,
    });
    // El valor de la prueba no dice nada de nadie (es un identificador de usar y tirar), pero se
    // registra solo si volvió algo, no qué: la línea sirve para ver si el script contestó.
    this.log.debug('POST verify ✔', { conEco: (response.echo ?? '').length > 0 });

    return { target: this.targetOf(response), echo: response.echo ?? '' };
  }

  /**
   * A dónde se manda es configuración del despliegue, no del dominio ni de la sesión. Se resuelve en
   * cada llamada —y no al construir— porque sin URL no es un fallo de arranque: la app funciona
   * entera en local, y solo esta operación tiene algo que decir.
   */
  private post(body: Record<string, unknown>): Promise<AppsScriptResponse> {
    const endpoint = this.config.integration.appsScriptUrl;
    if (!endpoint) {
      this.log.debug('sin URL de Apps Script configurada, no se envía nada');
      throw new SyncError(
        'NOT_CONFIGURED',
        'Falta la URL del Apps Script en la configuración del despliegue (ver manual/appscript.md, paso 8).',
      );
    }
    return postToAppsScript<AppsScriptResponse>(endpoint, body);
  }

  private targetOf(response: AppsScriptResponse): SyncTarget {
    return SyncTarget.of(response.spreadsheetId, response.spreadsheetUrl);
  }
}
