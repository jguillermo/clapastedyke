import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeFlavorMapper } from './recipe-flavor.mapper';
import { RecipeFlavorRecord } from '../records';
import { isAlive, stamped, tombstoned } from '../synced-record';

/**
 * Implementación IndexedDB de `RecipeFlavorRepository` sobre `IndexedDbStore` (store `flavors`);
 * traduce con `RecipeFlavorMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeFlavorRepository extends RecipeFlavorRepository {
  private readonly store = new IndexedDbStore<RecipeFlavorRecord>('flavors');
  private readonly log = inject(Logger).scoped('recipe-book/flavor-repo');

  nextIdentity(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  async byId(id: EntityId): Promise<RecipeFlavor | null> {
    const record = await this.store.get(id.value);
    return record && isAlive(record) ? RecipeFlavorMapper.toDomain(record) : null;
  }

  async all(): Promise<RecipeFlavor[]> {
    const flavors = (await this.store.all()).filter(isAlive).map(RecipeFlavorMapper.toDomain);
    this.log.debug('sabores leídos', { count: flavors.length });
    return flavors;
  }

  async save(flavor: RecipeFlavor): Promise<void> {
    await this.store.put(stamped(RecipeFlavorMapper.toRecord(flavor), new Date().toISOString()));
    this.log.debug('sabor guardado', { id: flavor.id.value });
  }

  /**
   * Borrado **lógico**: antes se quitaba el documento, y así el borrado no llegaba a los demás
   * dispositivos — el primero que estuviera desconectado lo resubía y el sabor reaparecía.
   */
  async delete(id: EntityId): Promise<void> {
    const record = await this.store.get(id.value);
    if (!record) {
      this.log.debug('borrar un sabor que no está: no hay nada que hacer', { id: id.value });
      return;
    }
    await this.store.put(tombstoned(record, new Date().toISOString()));
    this.log.debug('sabor borrado', { id: id.value });
  }
}
