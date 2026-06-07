import { Quantity } from '../../../_common/quantity';

interface RecipeYieldData {
    weight: Quantity;
    servings?: number;
}

/**
 * The sponge's reference yield: how much it weighs (in grams) and, optionally,
 * how many servings that weight feeds. This weight governs the scaling of the
 * whole cake. Identity by value.
 */
export class RecipeYield {
    readonly weight: Quantity;
    readonly servings?: number;

    private constructor(data: RecipeYieldData) {
        this.weight = data.weight;
        this.servings = data.servings;
    }

    static of(weight: Quantity, servings?: number): RecipeYield {
        // Quantity.of enforces weight > 0.
        if (servings !== undefined && (!Number.isInteger(servings) || servings <= 0)) {
            throw new Error(`Servings must be a positive integer when provided, got ${servings}`);
        }
        return new RecipeYield({ weight, servings });
    }

    equals(other: RecipeYield): boolean {
        return this.weight.equals(other.weight) && this.servings === other.servings;
    }
}
