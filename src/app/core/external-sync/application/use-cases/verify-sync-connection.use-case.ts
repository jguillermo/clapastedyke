import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncError } from '../../domain/services/sync.gateway.types';
import { SyncProbe } from '../../domain/value-objects/sync-probe';

export interface VerifySyncConnectionResult {
  /** Dónde se hizo la prueba, para poder enseñar el enlace en cuanto sale bien. */
  targetUrl: string;
}

/**
 * Comprueba que la conexión sirve **de verdad**: escribe un dato de prueba en la hoja del usuario, lo
 * vuelve a leer de allí y comprueba que es el mismo.
 *
 * Por qué no basta con que la hoja exista: existir solo demuestra que Drive la tiene. Entre eso y
 * «mis recetas se guardan» queda todo lo que suele romperse de verdad —el permiso que se revocó, la
 * pestaña que alguien renombró, la escritura que Google acepta y no aplica— y nada de eso se ve hasta
 * que se intenta escribir y volver a leer.
 *
 * No escribe nada del usuario, así que se puede repetir tantas veces como haga falta.
 */
@Injectable({ providedIn: 'root' })
export class VerifySyncConnection extends UseCase<void, VerifySyncConnectionResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly gateway = inject(SyncGateway);
  private readonly log = inject(Logger).scoped('external-sync/verify-sync-connection');

  async execute(): Promise<VerifySyncConnectionResult> {
    this.log.debug('ejecutando');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.log.debug('sin credenciales → no hay nada que comprobar');
      throw new SyncError(
        'UNAUTHENTICATED',
        'No hay ninguna cuenta conectada, así que no se puede comprobar la conexión.',
      );
    }

    const target = await this.targets.forAccount(credentials.accountId);
    if (!target) {
      this.log.debug('sin hoja → no hay dónde escribir la prueba');
      throw new SyncError('TARGET_GONE', 'Todavía no hay una hoja preparada para esta cuenta.');
    }

    const probe = SyncProbe.of(crypto.randomUUID());
    const { echo } = await this.gateway.probe({ credential: credentials.token, target, probe });

    if (!probe.matches(echo)) {
      // Es una degradación de las que no se ven: el sincronizador contestó «bien» y aun así lo
      // escrito no está. Sin esta línea, el usuario solo tendría el mensaje amable de la pantalla.
      this.log.warn('la prueba de ida y vuelta no ha vuelto igual', undefined, {
        targetId: target.id,
        conEco: echo.length > 0,
      });
      throw new SyncError(
        'REJECTED',
        'El dato de prueba no ha vuelto igual que como se envió. Tu hoja existe pero no se está escribiendo bien.',
      );
    }

    this.log.debug('ida y vuelta correcta', { targetId: target.id });
    return { targetUrl: target.url };
  }
}
