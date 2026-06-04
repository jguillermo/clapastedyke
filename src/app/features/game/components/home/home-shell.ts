import { Component, computed, inject, signal } from '@angular/core';
import { Home3d } from './home-3d';
import { StatusBadge } from '../../../_common/ui/status-badge';
import { GoalTracker } from '../../../_common/ui/goal-tracker';
import { ProgressionFacade } from '../../../_common/progression/progression-facade';
import { ListRecipes } from '../../../../core/catalog/application/list-recipes/list-recipes';
import { SaveRecipe } from '../../../../core/catalog/application/save-recipe/save-recipe';
import { SaveSupply } from '../../../../core/catalog/application/save-supply/save-supply';
import { RecipePrimitives } from '../../../../core/catalog/domain/recipe/recipe';
import { CheckIngredients } from '../../../../core/kitchen/application/check-ingredients/check-ingredients';
import { CookRecipe } from '../../../../core/kitchen/application/cook-recipe/cook-recipe';
import { BuyIngredient } from '../../../../core/kitchen/application/buy-ingredient/buy-ingredient';
import { RecipeCheck, IngredientCheck } from '../../../../core/kitchen/domain/ingredient-check';

type Overlay = 'none' | 'goals' | 'recipes' | 'check' | 'cooked' | 'levelup';

/**
 * Hub de la Fase 1 (cocina en casa). Mundo 3D de fondo + overlays de vidrio
 * que conducen el flujo: elegir receta → revisar ingredientes → comprar lo que
 * falta → cocinar. Las metas y desbloqueos vienen de `progression`.
 */
@Component({
  selector: 'app-home-shell',
  imports: [Home3d, StatusBadge, GoalTracker],
  templateUrl: './home-shell.html',
  styleUrl: './home-shell.scss',
})
export class HomeShell {
  private readonly facade = inject(ProgressionFacade);
  private readonly listRecipes = inject(ListRecipes);
  private readonly saveRecipe = inject(SaveRecipe);
  private readonly saveSupply = inject(SaveSupply);
  private readonly check = inject(CheckIngredients);
  private readonly cook = inject(CookRecipe);
  private readonly buy = inject(BuyIngredient);

  protected readonly overlay = signal<Overlay>('none');
  protected readonly recipes = signal<RecipePrimitives[]>([]);
  protected readonly review = signal<RecipeCheck | null>(null);
  protected readonly busy = signal(false);
  protected readonly cookedName = signal('');
  protected readonly unlockedLabel = signal('');

  protected readonly level = this.facade.currentLevel;
  protected readonly goals = this.facade.goals;
  protected readonly anyGoal = computed(() => this.goals().length > 0);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    await this.ensureSeed();
    this.recipes.set(await this.listRecipes.execute());
    await this.facade.refresh();
  }

  /* ---------- flujo ---------- */

  protected onStation(id: string): void {
    // recipe/oven → elegir y cocinar; pantry → revisión de la última receta.
    if (id === 'pantry' && this.review()) this.overlay.set('check');
    else this.openRecipes();
  }

  protected openRecipes(): void {
    this.overlay.set('recipes');
  }

  protected openGoals(): void {
    this.overlay.set('goals');
  }

  protected close(): void {
    this.overlay.set('none');
  }

  protected async choose(recipe: RecipePrimitives): Promise<void> {
    this.busy.set(true);
    this.review.set(await this.check.execute({ recipeId: recipe.id }));
    this.busy.set(false);
    this.overlay.set('check');
  }

  protected async buyMissing(item: IngredientCheck): Promise<void> {
    this.busy.set(true);
    const amount = Math.max(1, Math.ceil(item.needed - item.have));
    await this.buy.execute({ supplyId: item.supplyId, quantity: amount });
    const current = this.review();
    if (current) this.review.set(await this.check.execute({ recipeId: current.recipeId, servings: current.servings }));
    await this.facade.refresh();
    this.busy.set(false);
  }

  protected async cookNow(): Promise<void> {
    const current = this.review();
    if (!current?.canCook) return;
    this.busy.set(true);
    const before = this.facade.currentLevel();
    await this.cook.execute({ recipeId: current.recipeId, servings: current.servings });
    await this.facade.refresh();
    this.busy.set(false);
    this.cookedName.set(current.recipeName);

    if (this.facade.currentLevel() > before) {
      this.unlockedLabel.set('¡Desbloqueaste la siguiente etapa!');
      this.overlay.set('levelup');
    } else {
      this.overlay.set('cooked');
    }
  }

  /* ---------- seed (solo si la cocina está vacía) ---------- */

  private async ensureSeed(): Promise<void> {
    if ((await this.listRecipes.execute()).length > 0) return;

    const supply = (name: string, baseUnit: 'g' | 'u') =>
      this.saveSupply.execute({
        name,
        type: 'ingredient',
        baseUnit,
        presentationSize: 1,
        presentationPriceSoles: 0,
        initialStock: 0,
        minStock: 0,
      });

    const flour = (await supply('Harina', 'g')).id;
    const egg = (await supply('Huevos', 'u')).id;
    const sugar = (await supply('Azúcar', 'g')).id;

    await this.saveRecipe.execute({
      name: 'Galletas',
      baseType: 'people',
      baseServings: 1,
      ingredients: [
        { supplyId: flour, baseQuantity: 200 },
        { supplyId: egg, baseQuantity: 2 },
        { supplyId: sugar, baseQuantity: 100 },
      ],
    });
    await this.saveRecipe.execute({
      name: 'Bizcocho',
      baseType: 'people',
      baseServings: 1,
      ingredients: [
        { supplyId: flour, baseQuantity: 300 },
        { supplyId: egg, baseQuantity: 3 },
        { supplyId: sugar, baseQuantity: 150 },
      ],
    });
  }
}
