import { Injectable } from '@angular/core';
import { IngredientLine } from '../value-objects/ingredient-line';

export interface RecipeConversionInput {
    /** Líneas de ingrediente de la receta en su tamaño base (factor 1). */
    readonly lines: readonly IngredientLine[];
    /** Factor combinado de las opciones elegidas (1 = base; porciones × molde…). */
    readonly factor: number;
}

export interface ConvertedRecipe {
    /** Líneas escaladas por el factor (cantidades exactas, sin redondeo). */
    readonly lines: IngredientLine[];
}

/**
 * Servicio de dominio puro (sin estado): escala las líneas de una receta base por
 * un factor combinado. La conversión es la misma multiplicación independientemente
 * de la dimensión (porciones/molde); el factor se calcula fuera (producto de las
 * opciones elegidas). Es un servicio por consistencia con `CakeScalingService`.
 */
@Injectable({ providedIn: 'root' })
export class RecipeConversionService {
    convert({ lines, factor }: RecipeConversionInput): ConvertedRecipe {
        return {
            lines: lines.map((line) => IngredientLine.of(line.ingredientId, line.quantity.scaleBy(factor))),
        };
    }
}
