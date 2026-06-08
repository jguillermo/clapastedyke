import { Quantity } from '../../../_common/quantity';

interface RecipeYieldData {
    weight: Quantity;
    servings?: number;
    size?: string;
}

/**
 * The sponge's reference yield: how much it weighs (in grams), optionally how
 * many servings that weight feeds, and an optional size label (tamaño). This
 * weight governs the scaling of the whole cake. Identity by value.
 */
export class RecipeYield {
    readonly weight: Quantity;
    readonly servings?: number;
    readonly size?: string;

    private constructor(data: RecipeYieldData) {
        this.weight = data.weight;
        this.servings = data.servings;
        this.size = data.size;
    }

    static of(weight: Quantity, servings?: number, size?: string): RecipeYield {
        // Quantity.of enforces weight > 0.
        if (servings !== undefined && (!Number.isInteger(servings) || servings <= 0)) {
            throw new Error(`Servings must be a positive integer when provided, got ${servings}`);
        }
        return new RecipeYield({ weight, servings, size: size?.trim() || undefined });
    }

    equals(other: RecipeYield): boolean {
        return this.weight.equals(other.weight) && this.servings === other.servings && this.size === other.size;
    }
}
