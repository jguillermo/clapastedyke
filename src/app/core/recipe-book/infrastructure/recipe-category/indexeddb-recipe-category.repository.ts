import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeCategoryMapper } from './recipe-category.mapper';
import { RecipeCategoryRecord } from '../records';
import { isAlive, stamped, tombstoned } from '../synced-record';

/**
 * Implementación IndexedDB de `RecipeCategoryRepository` sobre `IndexedDbStore` (store
 * `recipe_categories`); traduce con `RecipeCategoryMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeCategoryRepository extends RecipeCategoryRepository {
  private readonly store = new IndexedDbStore<RecipeCategoryRecord>('recipe_categories');
  private readonly log = inject(Logger).scoped('recipe-book/category-repo');

  nextIdentity(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  async byId(id: EntityId): Promise<RecipeCategory | null> {
    const record = await this.store.get(id.value);
    return record && isAlive(record) ? RecipeCategoryMapper.toDomain(record) : null;
  }

  async byName(name: string): Promise<RecipeCategory | null> {
    const target = name.trim().toLowerCase();
    const record = (await this.store.all()).find(
      (r) => isAlive(r) && r.name.toLowerCase() === target,
    );
    return record ? RecipeCategoryMapper.toDomain(record) : null;
  }

  async save(category: RecipeCategory): Promise<void> {
    await this.store.put(
      stamped(RecipeCategoryMapper.toRecord(category), new Date().toISOString()),
    );
    this.log.debug('categoría guardada', { id: category.id.value });
  }

  /** Borrado **lógico**, para que llegue a los demás dispositivos. Ver `synced-record.ts`. */
  async delete(id: EntityId): Promise<void> {
    const record = await this.store.get(id.value);
    if (!record) {
      this.log.debug('borrar una categoría que no está: no hay nada que hacer', { id: id.value });
      return;
    }
    await this.store.put(tombstoned(record, new Date().toISOString()));
    this.log.debug('categoría borrada', { id: id.value });
  }

  async all(): Promise<RecipeCategory[]> {
    const categories = (await this.store.all()).filter(isAlive).map(RecipeCategoryMapper.toDomain);
    this.log.debug('categorías leídas', { count: categories.length });
    return categories;
  }
}
