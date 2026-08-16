import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeMapper } from './recipe.mapper';
import { RecipeRecord } from '../records';
import { SaveOptions } from '../../domain/repositories/save-options';
import { isAlive, persisted, tombstoned } from '../synced-record';

/**
 * Implementación IndexedDB de `RecipeRepository` sobre `IndexedDbStore` (store `recipes`);
 * traduce con `RecipeMapper`. Se enlaza en `recipe-book.providers.ts`.
 */
@Injectable()
export class IndexedDbRecipeRepository extends RecipeRepository {
  private readonly store = new IndexedDbStore<RecipeRecord>('recipes');
  private readonly log = inject(Logger).scoped('recipe-book/recipe-repo');

  nextIdentity(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  async byId(id: EntityId): Promise<Recipe | null> {
    const record = await this.store.get(id.value);
    return record && isAlive(record) ? RecipeMapper.toDomain(record) : null;
  }

  async byNameInCategory(categoryId: EntityId, name: string): Promise<Recipe | null> {
    const target = name.trim().toLowerCase();
    const record = (await this.store.all()).find(
      (r) => isAlive(r) && r.categoryId === categoryId.value && r.name.toLowerCase() === target,
    );
    return record ? RecipeMapper.toDomain(record) : null;
  }

  async byCategory(categoryId: EntityId): Promise<Recipe[]> {
    return (await this.store.all())
      .filter((r) => isAlive(r) && r.categoryId === categoryId.value)
      .map(RecipeMapper.toDomain);
  }

  async save(recipe: Recipe, options?: SaveOptions): Promise<void> {
    await this.store.put(persisted(RecipeMapper.toRecord(recipe), options));
    this.log.debug('receta guardada', { id: recipe.id.value });
  }

  /** Borrado **lógico**, para que llegue a los demás dispositivos. Ver `synced-record.ts`. */
  async delete(id: EntityId): Promise<void> {
    const record = await this.store.get(id.value);
    if (!record) {
      this.log.debug('borrar una receta que no está: no hay nada que hacer', { id: id.value });
      return;
    }
    await this.store.put(tombstoned(record, new Date().toISOString()));
    this.log.debug('receta borrada', { id: id.value });
  }

  async all(): Promise<Recipe[]> {
    const recipes = (await this.store.all()).filter(isAlive).map(RecipeMapper.toDomain);
    this.log.debug('recetas leídas', { count: recipes.length });
    return recipes;
  }
}
