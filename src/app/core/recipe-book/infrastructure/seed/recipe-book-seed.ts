import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { Supply } from '../../domain/entities/supply';
import { Recipe } from '../../domain/entities/recipe';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyLine } from '../../domain/value-objects/supply-line';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SeedDataSource } from './seed-data-source';
import { SeedState } from './seed-state';
import { SeedCategory, SeedSupply, SeedRecipe } from './recipe-book-seed-document';

/** Identifica este seed en el marcador persistido ({@link SeedState}). */
const SEED_KEY = 'recipe-book';

/**
 * Siembra el libro de recetas al arrancar.
 *
 * Sabores, capacidades de receta, insumos, categorías y recetas se cargan desde
 * `public/seed/recipe-book.seed.json` (vía {@link SeedDataSource}) y se guardan en los
 * **repositorios IndexedDB** (el flujo normal). Se aplica **una sola vez**: un marcador persistido
 * ({@link SeedState}) registra la versión sembrada; si ya se aplicó, no se vuelve a ejecutar, de
 * modo que el usuario puede editar o **borrar** libremente los datos sin que el seed los vuelva a
 * insertar. Subir `version` en el JSON lo re-aplica a propósito.
 *
 * Desactivación: `"enabled": false` en el JSON (o fichero ausente) → se omite. Nunca rompe el
 * arranque: los fallos se registran y se continúa.
 */
@Injectable({ providedIn: 'root' })
export class RecipeBookSeed {
  private readonly categories = inject(RecipeCategoryRepository);
  private readonly flavors = inject(RecipeFlavorRepository);
  private readonly capacities = inject(RecipeCapacityRepository);
  private readonly supplies = inject(SupplyRepository);
  private readonly recipes = inject(RecipeRepository);
  private readonly source = inject(SeedDataSource);
  private readonly seedState = inject(SeedState);

  /** ¿Ya se insertó la data seed alguna vez? (marcador persistido en IndexedDB). */
  async hasSeeded(): Promise<boolean> {
    return (await this.seedState.appliedVersion(SEED_KEY)) !== null;
  }

  async run(): Promise<void> {
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

    // Orden: primero lo que las recetas referencian (sabores/capacidades/categorías/insumos).
    for (const f of doc.flavors ?? []) {
      await this.createIfAbsent(f.id, this.flavors, () =>
        RecipeFlavor.create(new EntityId(f.id), f.label),
      );
    }
    for (const c of doc.recipeCapacities ?? []) {
      await this.createIfAbsent(c.id, this.capacities, () =>
        RecipeCapacity.create(new EntityId(c.id), c.group, c.label, c.factor),
      );
    }
    for (const c of doc.categories ?? []) {
      await this.createIfAbsent(c.id, this.categories, () => this.buildCategory(c));
    }
    for (const s of doc.supplies ?? []) {
      await this.createIfAbsent(s.id, this.supplies, () => this.buildSupply(s));
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
    return RecipeCategory.create(new EntityId(c.id), c.name);
  }

  private buildSupply(s: SeedSupply): Supply {
    const per = Quantity.of(s.purchasePrice.per.value, s.purchasePrice.per.unit);
    const price = PurchasePrice.of(s.purchasePrice.amount, per, s.purchasePrice.currency);
    return Supply.create(new EntityId(s.id), s.name, s.baseUnit, s.usage, price);
  }

  /** Construye una receta, resolviendo la unidad de cada línea desde su insumo. Devuelve null si no puede. */
  private async buildRecipe(r: SeedRecipe): Promise<Recipe | null> {
    try {
      const lines: SupplyLine[] = [];
      for (const line of r.lines) {
        const supply = await this.supplies.byId(new EntityId(line.supplyId));
        if (!supply) {
          console.warn(
            `[recipe-book-seed] receta "${r.id}": insumo "${line.supplyId}" no encontrado, se omite la línea`,
          );
          continue;
        }
        lines.push(SupplyLine.of(supply.id, Quantity.of(line.quantity, supply.baseUnit)));
      }
      if (lines.length === 0) {
        console.warn(`[recipe-book-seed] receta "${r.id}" sin líneas válidas, se omite`);
        return null;
      }
      return Recipe.create(new EntityId(r.id), new EntityId(r.categoryId), r.name, lines);
    } catch (error) {
      console.warn(`[recipe-book-seed] no se pudo construir la receta "${r.id}":`, error);
      return null;
    }
  }
}
