import { EntityId } from '../../_common/entity-id';
import { SpongeRecipe } from '../domain/entities/sponge-recipe';
import { RecipeYield } from '../domain/value-objects/recipe-yield';
import { SpongeRecipeRecord } from './records';
import { lineToDomain, lineToRecord, quantityToDomain, quantityToRecord } from './value-record.mappers';

export const SpongeRecipeMapper = {
    toRecord(recipe: SpongeRecipe): SpongeRecipeRecord {
        return {
            id: recipe.id.value,
            name: recipe.name,
            flavor: recipe.flavor,
            referenceYield: {
                weight: quantityToRecord(recipe.referenceYield.weight),
                servings: recipe.referenceYield.servings,
            },
            lines: recipe.lines.map(lineToRecord),
        };
    },

    toDomain(record: SpongeRecipeRecord): SpongeRecipe {
        const recipeYield = RecipeYield.of(quantityToDomain(record.referenceYield.weight), record.referenceYield.servings);
        return SpongeRecipe.create(
            new EntityId(record.id),
            record.name,
            recipeYield,
            record.lines.map(lineToDomain),
            record.flavor,
        );
    },
};
