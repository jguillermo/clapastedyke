import { EntityId } from '../../../_common/entity-id';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeRecord } from '../records';
import { ingredientToDomain, ingredientToRecord } from '../value-record.mappers';

/**
 * ACL de persistencia: traduce `Recipe` ⇄ `RecipeRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeRepository`. Mapea los `RecipeIngredient` (vía `value-record.mappers`).
 *
 * La asimetría de nombres es deliberada: el dominio dice `ingredients` y el record persistido sigue
 * diciendo `lines` (igual que `ingredientId` dentro de cada uno). Renombrar la clave guardada
 * orfanaría todas las recetas ya escritas en IndexedDB; traducirla es justo el trabajo de este ACL.
 *
 * `toDomain` usa **`Recipe.restore`**, nunca `Recipe.create`: `create` graba un `RecipeSaved`, así
 * que rehidratar por ahí encolaría un evento por cada lectura de IndexedDB.
 */
export const RecipeMapper = {
  toRecord(recipe: Recipe): RecipeRecord {
    return {
      id: recipe.id.value,
      categoryId: recipe.categoryId.value,
      name: recipe.name,
      lines: recipe.ingredients.map(ingredientToRecord),
      flavorId: recipe.flavorId ? recipe.flavorId.value : null,
      portionsCapacityId: recipe.portionsCapacityId ? recipe.portionsCapacityId.value : null,
      moldCapacityId: recipe.moldCapacityId ? recipe.moldCapacityId.value : null,
    };
  },

  toDomain(record: RecipeRecord): Recipe {
    return Recipe.restore({
      id: new EntityId(record.id),
      categoryId: new EntityId(record.categoryId),
      name: record.name,
      ingredients: record.lines.map(ingredientToDomain),
      flavorId: record.flavorId ? new EntityId(record.flavorId) : null,
      portionsCapacityId: record.portionsCapacityId
        ? new EntityId(record.portionsCapacityId)
        : null,
      moldCapacityId: record.moldCapacityId ? new EntityId(record.moldCapacityId) : null,
      updatedAt: record.updatedAt ?? null,
    });
  },
};
