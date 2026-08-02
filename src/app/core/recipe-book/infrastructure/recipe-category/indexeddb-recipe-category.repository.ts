import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeCategoryMapper } from './recipe-category.mapper';
import { RecipeCategoryRecord } from '../records';

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
    return record ? RecipeCategoryMapper.toDomain(record) : null;
  }

  async byName(name: string): Promise<RecipeCategory | null> {
    const target = name.trim().toLowerCase();
    const record = (await this.store.all()).find((r) => r.name.toLowerCase() === target);
    return record ? RecipeCategoryMapper.toDomain(record) : null;
  }

  async save(category: RecipeCategory): Promise<void> {
    await this.store.put(RecipeCategoryMapper.toRecord(category));
    this.log.debug('categoría guardada', { id: category.id.value });
  }

  async all(): Promise<RecipeCategory[]> {
    const categories = (await this.store.all()).map(RecipeCategoryMapper.toDomain);
    this.log.debug('categorías leídas', { count: categories.length });
    return categories;
  }
}
