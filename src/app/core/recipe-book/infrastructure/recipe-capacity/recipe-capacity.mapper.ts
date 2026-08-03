import { EntityId } from '../../../_common/entity-id';
import { RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeCapacityRecord } from '../records';

/**
 * ACL de persistencia: traduce `RecipeCapacity` ⇄ `RecipeCapacityRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeCapacityRepository`. Mapea el `EntityId`, el `group`, el `label` y el
 * `factor`.
 *
 * `toDomain` usa **`restore`**, nunca `create`: `create` graba un `RecipeCapacitySaved`.
 */
export const RecipeCapacityMapper = {
  toRecord(capacity: RecipeCapacity): RecipeCapacityRecord {
    return {
      id: capacity.id.value,
      group: capacity.group,
      label: capacity.label,
      factor: capacity.factor,
    };
  },

  toDomain(record: RecipeCapacityRecord): RecipeCapacity {
    return RecipeCapacity.restore({
      id: new EntityId(record.id),
      group: record.group,
      label: record.label,
      factor: record.factor,
    });
  },
};
