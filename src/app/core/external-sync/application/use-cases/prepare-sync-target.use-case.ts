import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncError } from '../../domain/services/sync.gateway.types';

export interface PrepareSyncTargetResult {
  /** Dirección donde el usuario puede abrir su copia. */
  targetUrl: string;
  /** `true` si se acaba de crear la hoja; `false` si ya la tenía y se reutiliza. */
  created: boolean;
}

/**
 * Deja lista la hoja del usuario: la suya si ya la tiene, una nueva si no.
 *
 * ## Tres estados, y los tres importan
 *
 * 1. **No hay ninguna recordada** → se crea. Es la primera vez.
 * 2. **Hay una y sigue ahí** → se reutiliza tal cual, sin tocar nada.
 * 3. **Hay una pero ya no existe** (el usuario la borró o la mandó a la papelera) → se crea otra y se
 *    olvida la anterior.
 *
 * El tercero es la razón de que esto pregunte antes de dar nada por bueno. Sin esa comprobación, el
 * caso «borré la hoja» acabaría en un 404 en mitad de la sincronización, con los cambios del usuario
 * ya en vuelo y un mensaje que no explicaría nada. Se pregunta a **Drive**, que es quien sabe de
 * papeleras: una hoja en la papelera todavía responde a Sheets, y escribir en ella sería tirar los
 * datos a un sitio que el usuario dio por borrado.
 *
 * Es idempotente: llamarlo dos veces seguidas no crea dos hojas.
 */
@Injectable({ providedIn: 'root' })
export class PrepareSyncTarget extends UseCase<void, PrepareSyncTargetResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly gateway = inject(SyncGateway);
  private readonly log = inject(Logger).scoped('external-sync/prepare-sync-target');

  async execute(): Promise<PrepareSyncTargetResult> {
    this.log.debug('ejecutando');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.log.debug('sin credenciales → no hay Drive donde crear nada');
      throw new SyncError(
        'UNAUTHENTICATED',
        'No hay ninguna cuenta conectada, así que no se puede preparar dónde guardar la copia.',
      );
    }

    const remembered = await this.targets.forAccount(credentials.accountId);
    if (remembered) {
      if (await this.gateway.exists({ credential: credentials.token, target: remembered })) {
        this.log.debug('la hoja recordada sigue ahí, se reutiliza', { targetId: remembered.id });
        return { targetUrl: remembered.url, created: false };
      }
      this.log.debug('la hoja recordada ya no existe, se olvidará y se creará otra', {
        targetId: remembered.id,
      });
      await this.targets.remove(credentials.accountId);
    }

    const target = await this.gateway.create({ credential: credentials.token });
    await this.targets.save(credentials.accountId, target);

    this.log.debug('hoja creada y recordada', { targetId: target.id });
    return { targetUrl: target.url, created: true };
  }

  /**
   * Olvida la hoja de esta cuenta y crea otra desde cero.
   *
   * Es la salida cuando la que hay dejó de servir de una forma que `exists()` no detecta —alguien le
   * cambió las pestañas a mano, por ejemplo—. **La anterior no se borra**: se queda en el Drive del
   * usuario, que es el único que puede decidir tirar sus datos.
   */
  async recreate(): Promise<PrepareSyncTargetResult> {
    const credentials = await this.credentials.current();
    if (credentials) {
      this.log.debug('olvidando la hoja anterior para crear otra');
      await this.targets.remove(credentials.accountId);
    }
    return this.execute();
  }
}
