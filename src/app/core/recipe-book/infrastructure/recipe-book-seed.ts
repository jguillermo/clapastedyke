import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { buildSystemCategories, RecipeCategory } from '../domain/entities/recipe-category';
import { ConversionOption } from '../domain/entities/conversion-option';
import { Flavor } from '../domain/entities/flavor';
import { Ingredient } from '../domain/entities/ingredient';
import { Recipe } from '../domain/entities/recipe';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { RecipeProperty } from '../domain/value-objects/recipe-property';
import { RecipePropertyValue } from '../domain/value-objects/recipe-property-value';
import { IngredientLine } from '../domain/value-objects/ingredient-line';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { ConversionOptionRepository } from '../domain/repositories/conversion-option.repository';
import { FlavorRepository } from '../domain/repositories/flavor.repository';
import { IngredientRepository } from '../domain/repositories/ingredient.repository';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { SeedDataSource } from './seed-data-source';
import { SeedState } from './seed-state';
import {
    SeedCategory,
    SeedIngredient,
    SeedRecipe,
    SeedRecipeValue,
} from './recipe-book-seed-document';

/** Identifica este seed en el marcador persistido ({@link SeedState}). */
const SEED_KEY = 'recipe-book';

/**
 * Siembra el libro de recetas al arrancar.
 *
 * Dos responsabilidades separadas:
 * 1. **Estructura (código).** Las categorías de sistema (Queques, Rellenos, Coberturas) se
 *    **reconcilian en cada arranque** contra el esquema canónico (`buildSystemCategories()`):
 *    faltantes se crean, esquemas obsoletos se reparan, conservando la visibilidad (`selectable`)
 *    elegida por el usuario. Las categorías de usuario no se tocan.
 * 2. **Contenido (JSON).** Sabores, opciones de conversión, ingredientes, categorías custom y
 *    recetas se cargan desde `public/seed/recipe-book.seed.json` (vía {@link SeedDataSource}) y se
 *    guardan en los **repositorios IndexedDB** (el flujo normal). Se aplica **una sola vez**: un
 *    marcador persistido ({@link SeedState}) registra la versión sembrada; si ya se aplicó, no se
 *    vuelve a ejecutar, de modo que el usuario puede editar o **borrar** libremente los datos sin
 *    que el seed los vuelva a insertar. Subir `version` en el JSON lo re-aplica a propósito.
 *
 * Desactivación: `"enabled": false` en el JSON (o fichero ausente) → se omite el contenido; la
 * estructura de sistema se sigue reconciliando. Nunca rompe el arranque: los fallos se registran
 * y se continúa.
 */
@Injectable({ providedIn: 'root' })
export class RecipeBookSeed {
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly flavors = inject(FlavorRepository);
    private readonly options = inject(ConversionOptionRepository);
    private readonly ingredients = inject(IngredientRepository);
    private readonly recipes = inject(RecipeRepository);
    private readonly source = inject(SeedDataSource);
    private readonly seedState = inject(SeedState);

    /** ¿Ya se insertó la data seed alguna vez? (marcador persistido en IndexedDB). */
    async hasSeeded(): Promise<boolean> {
        return (await this.seedState.appliedVersion(SEED_KEY)) !== null;
    }

    async run(): Promise<void> {
        await this.seedSystemCategories();

        const doc = await this.source.load();
        if (!doc || doc.enabled === false) {
            return;
        }

        // Ejecuta una sola vez: si ya se sembró esta versión (o mayor), no se repite.
        const applied = await this.seedState.appliedVersion(SEED_KEY);
        const version = doc.version ?? 1;
        if (applied !== null && applied >= version) {
            return;
        }

        // Orden: primero lo que las recetas referencian (sabores/opciones/categorías/ingredientes).
        for (const f of doc.flavors ?? []) {
            await this.createIfAbsent(f.id, this.flavors, () =>
                Flavor.create(new EntityId(f.id), f.label),
            );
        }
        for (const o of doc.conversionOptions ?? []) {
            await this.createIfAbsent(o.id, this.options, () =>
                ConversionOption.create(new EntityId(o.id), o.group, o.label, o.factor),
            );
        }
        for (const c of doc.categories ?? []) {
            await this.createIfAbsent(c.id, this.categories, () => this.buildCategory(c));
        }
        for (const ing of doc.ingredients ?? []) {
            await this.createIfAbsent(ing.id, this.ingredients, () => this.buildIngredient(ing));
        }
        for (const r of doc.recipes ?? []) {
            if (await this.recipes.byId(new EntityId(r.id))) {
                continue; // ya existe → no se modifica
            }
            const recipe = await this.buildRecipe(r);
            if (recipe) {
                await this.recipes.save(recipe);
            }
        }

        // Marca la siembra como aplicada: no se repetirá salvo que suba la versión del JSON.
        await this.seedState.markApplied(SEED_KEY, version);
    }

    /** Crea las categorías de sistema que falten y reconcilia las existentes con el esquema canónico. */
    private async seedSystemCategories(): Promise<void> {
        const byId = new Map((await this.categories.all()).map((c) => [c.id.value, c]));
        for (const canonical of buildSystemCategories()) {
            const existing = byId.get(canonical.id.value);
            await this.categories.save(existing ? existing.reconcileSchema(canonical) : canonical);
        }
    }

    /** Guarda el agregado que produce `build` solo si su id no existe ya (create-if-absent). */
    private async createIfAbsent<T>(
        id: string,
        repo: { byId(id: EntityId): Promise<T | null>; save(aggregate: T): Promise<void> },
        build: () => T,
    ): Promise<void> {
        const entityId = new EntityId(id);
        if (await repo.byId(entityId)) {
            return;
        }
        try {
            await repo.save(build());
        } catch (error) {
            console.warn(`[recipe-book-seed] no se pudo sembrar "${id}":`, error);
        }
    }

    private buildCategory(c: SeedCategory): RecipeCategory {
        const properties = c.properties.map((p) =>
            RecipeProperty.create(p.id, p.name, p.type, p.required, p.locked ?? false, undefined, p.group, p.selectable ?? false),
        );
        return RecipeCategory.create(new EntityId(c.id), c.name, c.order, properties, false);
    }

    private buildIngredient(ing: SeedIngredient): Ingredient {
        const per = Quantity.of(ing.purchasePrice.per.value, ing.purchasePrice.per.unit);
        const price = PurchasePrice.of(ing.purchasePrice.amount, per, ing.purchasePrice.currency);
        return Ingredient.create(new EntityId(ing.id), ing.name, ing.baseUnit, ing.usage, price);
    }

    /** Construye una receta, resolviendo la unidad de cada línea desde su ingrediente. Devuelve null si no puede. */
    private async buildRecipe(r: SeedRecipe): Promise<Recipe | null> {
        try {
            const lines: IngredientLine[] = [];
            for (const line of r.lines) {
                const ingredient = await this.ingredients.byId(new EntityId(line.ingredientId));
                if (!ingredient) {
                    console.warn(`[recipe-book-seed] receta "${r.id}": ingrediente "${line.ingredientId}" no encontrado, se omite la línea`);
                    continue;
                }
                lines.push(IngredientLine.of(ingredient.id, Quantity.of(line.quantity, ingredient.baseUnit)));
            }
            if (lines.length === 0) {
                console.warn(`[recipe-book-seed] receta "${r.id}" sin líneas válidas, se omite`);
                return null;
            }
            const values = (r.values ?? []).map(toRecipeValue);
            return Recipe.create(new EntityId(r.id), new EntityId(r.categoryId), r.name, values, lines);
        } catch (error) {
            console.warn(`[recipe-book-seed] no se pudo construir la receta "${r.id}":`, error);
            return null;
        }
    }
}

/** Traduce un valor del JSON a su VO, según el tipo de la propiedad. */
function toRecipeValue(v: SeedRecipeValue): RecipePropertyValue {
    if (v.type === 'weight') {
        return RecipePropertyValue.of(v.propertyId, v.type, Quantity.of(Number(v.value), 'g'));
    }
    if (v.type === 'number') {
        return RecipePropertyValue.of(v.propertyId, v.type, Number(v.value));
    }
    return RecipePropertyValue.of(v.propertyId, v.type, String(v.value));
}
