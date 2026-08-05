import { EntityId } from '../../../_common/entity-id';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCategoryRecord } from '../records';

/**
 * ACL de persistencia: traduce `RecipeCategory` ⇄ `RecipeCategoryRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeCategoryRepository`. Entidad de catálogo: solo id + nombre.
 *
 * `toDomain` usa **`restore`**, nunca `create`: `create` graba un `RecipeCategorySaved`.
 */
export const RecipeCategoryMapper = {
  toRecord(category: RecipeCategory): RecipeCategoryRecord {
    return {
      id: category.id.value,
      name: category.name,
    };
  },

  toDomain(record: RecipeCategoryRecord): RecipeCategory {
    return RecipeCategory.restore({
      id: new EntityId(record.id),
      name: record.name,
      updatedAt: record.updatedAt ?? null,
    });
  },
};
