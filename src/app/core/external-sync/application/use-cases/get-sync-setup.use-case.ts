import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncSetupSource } from '../../domain/services/sync-setup-source';
import { SetupSnippetId } from '../../domain/services/sync-setup.types';

export interface SyncSetupView {
  /** El código que hay que pegar en el editor del destino. Vacío si no se pudo leer. */
  script: string;
  /** El manifiesto que acompaña al código. Vacío si no se pudo leer. */
  manifest: string;
  /** El identificador de esta app, que el destino tiene que aceptar. Vacío si falta. */
  clientId: string;
  /** El origen desde el que se sirve la app, que el proveedor tiene que autorizar. */
  origin: string;
  /** La dirección del destino desplegado. Vacía mientras no se haya configurado. */
  endpoint: string;
  /** Ya no falta nada por configurar. No dice que funcione: eso lo demuestra la ida y vuelta. */
  configured: boolean;
}

/**
 * Reúne lo que hay que llevarse a la consola del proveedor para dejar montado el destino.
 *
 * Devuelve un DTO **plano y listo para pintar**: la pantalla lee `setup().script`, no busca dentro de
 * una lista. Los huecos vacíos son parte de la respuesta —significan «esto falta»— y por eso este
 * caso de uso no lanza cuando algo no está: la guía tiene que poder enseñar precisamente lo que
 * queda por hacer.
 */
@Injectable({ providedIn: 'root' })
export class GetSyncSetup extends UseCase<void, SyncSetupView> {
  private readonly source = inject(SyncSetupSource);
  private readonly log = inject(Logger).scoped('external-sync/get-sync-setup');

  async execute(): Promise<SyncSetupView> {
    this.log.debug('ejecutando');

    const setup = await this.source.read();
    const value = (id: SetupSnippetId): string =>
      setup.snippets.find((snippet) => snippet.id === id)?.value ?? '';

    this.log.debug('puesta en marcha resuelta', { configured: setup.configured });
    return {
      script: value('script'),
      manifest: value('manifest'),
      clientId: value('clientId'),
      origin: value('origin'),
      endpoint: value('endpoint'),
      configured: setup.configured,
    };
  }
}
