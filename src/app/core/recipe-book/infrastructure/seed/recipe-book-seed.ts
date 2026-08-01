import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { Logger } from '../../../_common/logger/logger';
import { Quantity } from '../../../_common/quantity';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { Supply } from '../../domain/entities/supply';
import { Recipe } from '../../domain/entities/recipe';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { RecipeIngredient } from '../../domain/value-objects/recipe-ingredient';
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
 *
 * Construye los agregados con **`restore`**, no con `create`: sembrar es rehidratar datos que vienen
 * con la app, no un guardado del usuario, así que no debe grabar ni publicar ningún `*Saved` (si no,
 * cada arranque nuevo encolaría una sincronización del catálogo entero). El precio de esto es que no
 * se revalidan las invariantes de entidad del JSON — los VO (`Quantity`, `PurchasePrice`) sí siguen
 * validando, y las recetas sin líneas resolubles se siguen descartando.
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
  private readonly log = inject(Logger).scoped('recipe-book-seed');

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
        RecipeFlavor.restore({ id: new EntityId(f.id), label: f.label }),
      );
    }
    for (const c of doc.recipeCapacities ?? []) {
      await this.createIfAbsent(c.id, this.capacities, () =>
        RecipeCapacity.restore({
          id: new EntityId(c.id),
          group: c.group,
          label: c.label,
          factor: c.factor,
        }),
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
      this.log.warn(`no se pudo sembrar "${id}"`, error);
    }
  }

  private buildCategory(c: SeedCategory): RecipeCategory {
    return RecipeCategory.restore({ id: new EntityId(c.id), name: c.name });
  }

  private buildSupply(s: SeedSupply): Supply {
    const per = Quantity.of(s.purchasePrice.per.value, s.purchasePrice.per.unit);
    const price = PurchasePrice.of(s.purchasePrice.amount, per, s.purchasePrice.currency);
    return Supply.restore({
      id: new EntityId(s.id),
      name: s.name,
      baseUnit: s.baseUnit,
      usage: s.usage,
      purchasePrice: price,
    });
  }

  /** Construye una receta, resolviendo la unidad de cada ingrediente desde su insumo. Devuelve null si no puede. */
  private async buildRecipe(r: SeedRecipe): Promise<Recipe | null> {
    try {
      const ingredients: RecipeIngredient[] = [];
      for (const line of r.lines) {
        const supply = await this.supplies.byId(new EntityId(line.supplyId));
        if (!supply) {
          this.log.warn(
            `receta "${r.id}": insumo "${line.supplyId}" no encontrado, se omite el ingrediente`,
          );
          continue;
        }
        ingredients.push(
          RecipeIngredient.of(supply.id, Quantity.of(line.quantity, supply.baseUnit)),
        );
      }
      if (ingredients.length === 0) {
        this.log.warn(`receta "${r.id}" sin ingredientes válidos, se omite`);
        return null;
      }
      return Recipe.restore({
        id: new EntityId(r.id),
        categoryId: new EntityId(r.categoryId),
        name: r.name,
        ingredients,
        flavorId: null,
        portionsCapacityId: null,
        moldCapacityId: null,
      });
    } catch (error) {
      this.log.warn(`no se pudo construir la receta "${r.id}"`, error);
      return null;
    }
  }
}
