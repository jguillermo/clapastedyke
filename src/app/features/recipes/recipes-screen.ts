import { Component, inject, signal } from '@angular/core';
import { FormField, applyEach, form, maxLength, min, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { DomainError } from '../../core/_common/domain/errors';
import { BaseType, RecipePrimitives } from '../../core/catalog/domain/recipe/recipe';
import { SupplyListItem } from '../../core/catalog/application/list-supplies/list-supplies';
import { UI_FORMS } from '../_common/ui/ui';

interface RecipeModel {
  name: string;
  category: string;
  baseType: BaseType;
  baseServings: number;
  laborHours: number;
  ingredients: { supplyId: string; baseQuantity: number }[];
}

/**
 * Recipes screen: the ONLY one with DYNAMIC ROWS (ingredients). Uses the model
 * array with Signal Forms' `applyEach` to validate each line per field;
 * BUSINESS rules (unique name, ≥1 ingredient, ingredient-type supply…) stay in
 * the domain and arrive as a notice if the use case rejects.
 */
@Component({
  selector: 'app-recipes-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  providers: [provideTranslocoScope('catalog')],
  templateUrl: './recipes-screen.html',
})
export class RecipesScreen {
  private readonly catalog = inject(CatalogService);
  private readonly transloco = inject(TranslocoService);

  protected readonly recipes = signal<RecipePrimitives[]>([]);
  protected readonly supplies = signal<SupplyListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // Model + per-field validation form. The ingredients array is the dynamic
  // part: applyEach validates each row.
  protected readonly model = signal<RecipeModel>({
    name: '',
    category: '',
    baseType: 'people',
    baseServings: 0,
    laborHours: 0,
    ingredients: [],
  });
  protected readonly form = form(this.model, field => {
    required(field.name, { message: 'catalog.recipes.nameRequired' });
    maxLength(field.name, 80, { message: 'catalog.recipes.nameMax' });
    min(field.baseServings, 0.0001, { message: 'catalog.recipes.baseMin' });
    min(field.laborHours, 0, { message: 'catalog.recipes.laborMin' });
    applyEach(field.ingredients, ing => {
      required(ing.supplyId, { message: 'catalog.recipes.ingredientSupplyRequired' });
      min(ing.baseQuantity, 0.0001, { message: 'catalog.recipes.ingredientQuantityMin' });
    });
  });

  constructor() {
    void this.reload();
    void this.loadSupplies();
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.recipes.set(await this.catalog.listRecipes.execute());
    this.loading.set(false);
  }

  private async loadSupplies(): Promise<void> {
    this.supplies.set(await this.catalog.listSupplies.execute({ type: 'ingredient' }));
  }

  protected addIngredient(): void {
    this.model.update(m => ({
      ...m,
      ingredients: [...m.ingredients, { supplyId: '', baseQuantity: 0 }],
    }));
  }

  protected removeIngredient(index: number): void {
    this.model.update(m => ({
      ...m,
      ingredients: m.ingredients.filter((_, i) => i !== index),
    }));
  }

  protected edit(recipe: RecipePrimitives): void {
    this.editingId.set(recipe.id);
    this.model.set({
      name: recipe.name,
      category: recipe.category,
      baseType: recipe.baseType,
      baseServings: recipe.baseServings,
      laborHours: recipe.laborHours,
      ingredients: recipe.ingredients.map(i => ({ supplyId: i.supplyId, baseQuantity: i.baseQuantity })),
    });
    this.form().reset();
    this.notice.set(null);
  }

  protected clearForm(): void {
    this.editingId.set(null);
    this.model.set({
      name: '',
      category: '',
      baseType: 'people',
      baseServings: 0,
      laborHours: 0,
      ingredients: [],
    });
    this.form().reset();
    this.notice.set(null);
  }

  /** submit() marks every field as touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const r = await this.catalog.saveRecipe.execute({
          id: this.editingId() ?? undefined,
          ...this.model(),
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('catalog.recipes.saved', { id: r.id }),
        });
        this.clearForm();
        await this.reload();
      } catch (error) {
        const text =
          error instanceof DomainError
            ? error.message
            : this.transloco.translate('common.couldNotSave');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }
}
