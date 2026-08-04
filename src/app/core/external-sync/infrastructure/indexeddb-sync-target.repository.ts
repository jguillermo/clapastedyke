import { inject, Injectable } from '@angular/core';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { SyncTargetRepository } from '../domain/repositories/sync-target.repository';
import { SyncTarget } from '../domain/value-objects/sync-target';

/**
 * Documento plano. La clave (`id`) es el identificador de la cuenta: una entrada por persona, y
 * ninguna ve la de otra.
 */
interface SyncTargetRecord {
  id: string;
  targetId: string;
  targetUrl: string;
  createdAt: string;
}

/**
 * Dónde tiene su hoja cada cuenta, en IndexedDB.
 *
 * Aquí no hay ningún secreto que guardar: la autoridad para escribir es el token de la sesión, que
 * vive en memoria y desaparece al recargar. Esto solo recuerda **una dirección**, para no crear una
 * hoja nueva cada vez que alguien conecta.
 *
 * Legado: un registro sin `targetId` es de una versión anterior y **se ignora** — se devuelve `null`
 * y la próxima conexión crea la hoja de nuevo. Nunca se inventa un valor para rellenarlo.
 */
@Injectable()
export class IndexedDbSyncTargetRepository extends SyncTargetRepository {
  private readonly store = new IndexedDbStore<SyncTargetRecord>('sync_targets');
  private readonly log = inject(Logger).scoped('external-sync/target-repo');

  async forAccount(accountId: string): Promise<SyncTarget | null> {
    const record = await this.store.get(accountId);
    if (!record?.targetId) {
      return null;
    }
    return SyncTarget.of(record.targetId, record.targetUrl);
  }

  async save(accountId: string, target: SyncTarget): Promise<void> {
    await this.store.put({
      id: accountId,
      targetId: target.id,
      targetUrl: target.url,
      createdAt: new Date().toISOString(),
    });
    this.log.debug('destino recordado', { targetId: target.id });
  }

  async remove(accountId: string): Promise<void> {
    await this.store.delete(accountId);
    this.log.debug('destino olvidado');
  }
}
