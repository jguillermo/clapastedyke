import { EntityId } from '../../../_common/entity-id';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { RecipeFlavorRecord } from '../records';

/**
 * ACL de persistencia: traduce `RecipeFlavor` ⇄ `RecipeFlavorRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeFlavorRepository`. Mapea el `EntityId` y el `label`.
 */
export const RecipeFlavorMapper = {
    toRecord(flavor: RecipeFlavor): RecipeFlavorRecord {
        return { id: flavor.id.value, label: flavor.label };
    },

    toDomain(record: RecipeFlavorRecord): RecipeFlavor {
        return RecipeFlavor.create(new EntityId(record.id), record.label);
    },
};
