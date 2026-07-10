import { EntityId } from '../../../_common/entity-id';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCategoryRecord } from '../records';

/**
 * ACL de persistencia: traduce `RecipeCategory` ⇄ `RecipeCategoryRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeCategoryRepository`. Entidad de catálogo: solo id + nombre.
 */
export const RecipeCategoryMapper = {
    toRecord(category: RecipeCategory): RecipeCategoryRecord {
        return {
            id: category.id.value,
            name: category.name,
        };
    },

    toDomain(record: RecipeCategoryRecord): RecipeCategory {
        return RecipeCategory.create(new EntityId(record.id), record.name);
    },
};
