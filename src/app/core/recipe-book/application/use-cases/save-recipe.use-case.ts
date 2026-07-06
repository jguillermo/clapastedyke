import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { SupplyLine } from '../../domain/value-objects/supply-line';
import { RecipePropertyValue } from '../../domain/value-objects/recipe-property-value';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

interface RecipeValueInput {
    propertyId: string;
    value: string | number; // peso → gramos; número → número; texto → string
}

interface RecipeLineInput {
    supplyId: string;
    quantity: number;
}

/** Entrada de {@link SaveRecipe}: la categoría destino, el nombre, los valores de propiedad y las líneas de insumo. */
export interface SaveRecipeRequest {
    categoryId: string;
    name: string;
    values: RecipeValueInput[];
    lines: RecipeLineInput[];
}

/**
 * Guarda una receta dentro de su categoría. Upsert por (categoría, nombre). La invocan las pantallas
 * de alta/edición de receta del recetario. Construye los valores de propiedad según el esquema de la
 * categoría y valida obligatorias/tipos (la regla vive en `RecipeCategory.validateValues`) y que
 * cada insumo exista.
 *
 * Orquesta RecipeRepository (upsert), RecipeCategoryRepository (esquema de la categoría) y
 * SupplyRepository (existencia de cada insumo); arma los VO RecipePropertyValue y SupplyLine.
 * Publica `RecipeSaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipe extends UseCase<SaveRecipeRequest, { id: string }> {
    private readonly recipes = inject(RecipeRepository);
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly supplies = inject(SupplyRepository);
    private readonly bus = inject(EventBus);

    async execute({ categoryId, name, values, lines }: SaveRecipeRequest): Promise<{ id: string }> {
        const categoryEntityId = new EntityId(categoryId);
        const category = await this.categories.byId(categoryEntityId);
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }

        const propertyValues = values.map((input) => this.toValue(category, input));
        category.validateValues(propertyValues);

        const supplyLines = await this.buildLines(lines);

        const existing = await this.recipes.byNameInCategory(categoryEntityId, name);
        const id = existing?.id ?? this.recipes.nextIdentity();
        const recipe = Recipe.create(id, categoryEntityId, name, propertyValues, supplyLines);

        await this.recipes.save(recipe);
        await this.bus.publish([RecipeBookEvents.recipeSaved(id.value, !existing, categoryId)]);
        return { id: id.value };
    }

    private toValue(category: RecipeCategory, input: RecipeValueInput): RecipePropertyValue {
        const property = category.property(input.propertyId);
        if (!property) {
            throw new Error(`Unknown property ${input.propertyId}`);
        }
        if (property.type === 'weight') {
            return RecipePropertyValue.of(input.propertyId, 'weight', Quantity.of(Number(input.value), 'g'));
        }
        if (property.type === 'number') {
            return RecipePropertyValue.of(input.propertyId, 'number', Number(input.value));
        }
        // text / flavor / options: el valor guardado es el label (string).
        return RecipePropertyValue.of(input.propertyId, property.type, String(input.value));
    }

    private async buildLines(lines: RecipeLineInput[]): Promise<SupplyLine[]> {
        const built: SupplyLine[] = [];
        for (const line of lines) {
            const supplyId = new EntityId(line.supplyId);
            const supply = await this.supplies.byId(supplyId);
            if (!supply) {
                throw new Error(`Supply ${line.supplyId} does not exist`);
            }
            built.push(SupplyLine.of(supplyId, Quantity.of(line.quantity, supply.baseUnit)));
        }
        return built;
    }
}
