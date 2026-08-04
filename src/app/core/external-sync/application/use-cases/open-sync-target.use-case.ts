import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncError } from '../../domain/services/sync.gateway.types';

export interface SyncTargetView {
  id: string;
  /** Dirección que el usuario puede abrir para ver su copia. */
  url: string;
}

/**
 * Prepara el sitio donde se va a guardar la copia: si no existe, el destino lo crea.
 *
 * Es un paso propio —y no un detalle de sincronizar— porque tiene su propio resultado visible (la
 * dirección de la copia) y sus propios motivos de fallo, y porque al conectar una cuenta el usuario
 * necesita ver que **eso** funcionó antes de que empiece a subir nada suyo.
 *
 * Idempotente: repetirlo no crea un segundo destino.
 */
@Injectable({ providedIn: 'root' })
export class OpenSyncTarget extends UseCase<void, SyncTargetView> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly gateway = inject(SyncGateway);
  private readonly log = inject(Logger).scoped('external-sync/open-sync-target');

  async execute(): Promise<SyncTargetView> {
    this.log.debug('ejecutando');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.log.debug('sin credenciales → no hay a dónde escribir');
      throw new SyncError(
        'UNAUTHENTICATED',
        'No hay ninguna cuenta conectada, así que no se puede preparar dónde guardar la copia.',
      );
    }

    const target = await this.gateway.open({ credential: credentials.token });
    this.log.debug('destino preparado', { targetId: target.id });
    return { id: target.id, url: target.url };
  }
}
