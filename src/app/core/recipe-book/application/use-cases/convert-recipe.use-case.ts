import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';
import { ConversionOption } from '../../domain/entities/conversion-option';
import { RecipeConversionService } from '../../domain/services/recipe-conversion.service';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';
import { IngredientRepository } from '../../domain/repositories/ingredient.repository';
import { PreviewRecipeCost } from './preview-recipe-cost.use-case';

export interface ConvertRecipeRequest {
    recipeId: string;
    /** Opción de porciones elegida (id del catálogo) — opcional. */
    portionsOptionId?: string;
    /** Opción de molde elegida (id del catálogo) — opcional. */
    moldOptionId?: string;
}

export interface ConvertedRecipeLine {
    name: string;
    quantity: { value: number; unit: BaseUnit };
    /** Coste proporcional ya formateado (`'S/ 1.50'`). */
    cost: string;
}

export interface ConvertRecipeResult {
    /** Factor combinado aplicado (porciones × molde; 1 = base). */
    factor: number;
    /** Labels de las opciones elegidas, para mostrar (p. ej. ['Doble', 'Molde grande']). */
    optionLabels: string[];
    lines: ConvertedRecipeLine[];
    /** Total de materiales ya formateado. */
    total: string;
}

/**
 * Proyecta una receta convertida a un tamaño (query, no persiste): escala las
 * líneas por el factor combinado de las opciones elegidas (porciones × molde) y las
 * costea, todo listo para pintar (memoria `calculos-solo-en-negocio`). El dominio
 * escala; el use case orquesta y costea.
 */
@Injectable({ providedIn: 'root' })
export class ConvertRecipe extends UseCase<ConvertRecipeRequest, ConvertRecipeResult> {
    private readonly recipes = inject(RecipeRepository);
    private readonly options = inject(ConversionOptionRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly conversion = inject(RecipeConversionService);
    private readonly cost = inject(PreviewRecipeCost);

    async execute({ recipeId, portionsOptionId, moldOptionId }: ConvertRecipeRequest): Promise<ConvertRecipeResult> {
        const recipe = await this.recipes.byId(new EntityId(recipeId));
        if (!recipe) {
            throw new Error(`Recipe ${recipeId} not found`);
        }
        const portions = await this.optionOf(portionsOptionId, 'portions');
        const mold = await this.optionOf(moldOptionId, 'mold');
        const factor = (portions?.factor ?? 1) * (mold?.factor ?? 1);
        const optionLabels = [portions?.label, mold?.label].filter((l): l is string => !!l);

        const converted = this.conversion.convert({ lines: recipe.lines, factor });

        const byId = new Map((await this.ingredients.all()).map((i) => [i.id.value, i]));
        const costInput = converted.lines.map((line) => {
            const ingredient = byId.get(line.ingredientId.value);
            return {
                purchasePrice: ingredient
                    ? {
                          amount: ingredient.purchasePrice.amount,
                          per: {
                              value: ingredient.purchasePrice.per.value,
                              unit: ingredient.purchasePrice.per.unit,
                          },
                      }
                    : null,
                quantity: { value: line.quantity.value, unit: line.quantity.unit },
            };
        });
        const { items, total } = await this.cost.execute({ lines: costInput });

        const lines: ConvertedRecipeLine[] = converted.lines.map((line, i) => ({
            name: byId.get(line.ingredientId.value)?.name ?? '',
            quantity: { value: line.quantity.value, unit: line.quantity.unit },
            cost: items[i]?.cost ?? '',
        }));

        return { factor, optionLabels, lines, total };
    }

    /** Carga una opción por id y verifica que pertenezca al grupo esperado. */
    private async optionOf(
        id: string | undefined,
        group: 'portions' | 'mold',
    ): Promise<ConversionOption | null> {
        if (!id) {
            return null;
        }
        const option = await this.options.byId(new EntityId(id));
        if (!option) {
            throw new Error(`Conversion option ${id} not found`);
        }
        if (option.group !== group) {
            throw new Error(`Option ${id} does not belong to the "${group}" group`);
        }
        return option;
    }
}
