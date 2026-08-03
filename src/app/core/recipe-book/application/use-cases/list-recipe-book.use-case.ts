import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Logger } from '../../../_common/logger/logger';
import { Supply } from '../../domain/entities/supply';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';

/**
 * El catálogo del recetario que devuelve {@link ListRecipeBook}. Las recetas se agrupan por
 * `recipe.categoryId`; las categorías vienen ordenadas por nombre. Todo lo que se compra es un
 * `Supply` (separado, nunca en el índice).
 */
export interface RecipeBookCatalog {
  supplies: Supply[];
  categories: RecipeCategory[];
  recipes: Recipe[];
  flavors: RecipeFlavor[];
  recipeCapacities: RecipeCapacity[];
}

/**
 * Lee el catálogo completo del recetario, agrupado y ordenado. La invocan las pantallas del
 * recetario que listan insumos, categorías, recetas, sabores y capacidades de receta. Query pura
 * que orquesta en paralelo los cinco repositorios de catálogo (SupplyRepository,
 * RecipeCategoryRepository, RecipeRepository, RecipeFlavorRepository, RecipeCapacityRepository) y ordena
 * las categorías por nombre; no publica ningún evento.
 */
@Injectable({ providedIn: 'root' })
export class ListRecipeBook extends UseCase<void, RecipeBookCatalog> {
  private readonly supplies = inject(SupplyRepository);
  private readonly recipes = inject(RecipeRepository);
  private readonly categories = inject(RecipeCategoryRepository);
  private readonly flavors = inject(RecipeFlavorRepository);
  private readonly recipeCapacities = inject(RecipeCapacityRepository);
  private readonly log = inject(Logger).scoped('recipe-book/list');

  async execute(): Promise<RecipeBookCatalog> {
    this.log.debug('leyendo el catálogo');
    const [supplies, categories, recipes, flavors, recipeCapacities] = await Promise.all([
      this.supplies.all(),
      this.categories.all(),
      this.recipes.all(),
      this.flavors.all(),
      this.recipeCapacities.all(),
    ]);
    categories.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    // Cuentas, nunca el contenido: un catálogo entero en consola no lo lee nadie.
    this.log.debug('catálogo leído', {
      supplies: supplies.length,
      categories: categories.length,
      recipes: recipes.length,
      flavors: flavors.length,
      recipeCapacities: recipeCapacities.length,
    });
    return { supplies, categories, recipes, flavors, recipeCapacities };
  }
}
