import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { MigoSwiper } from '@components/swiper/swiper';
import { MigoSwiperSlide } from '@components/swiper/swiper-slide';
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import type { FillingRecipe } from '@core/recipe-book/domain/entities/filling-recipe';
import type { CoveringRecipe } from '@core/recipe-book/domain/entities/covering-recipe';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';
import { SpongeForm, type SpongeFormData } from './sponge-form/sponge-form';
import { LayerForm, type LayerFormData, type LayerKind } from './layer-form/layer-form';
import type { IngredientOption } from './_shared/ingredient-grid/ingredient-grid';

interface RecipeView {
  id: string;
  name: string;
  lineCount: number;
  chips: string[];
}

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog que abre el mundo 3D al
 * tocar el atril de recetas. Lee el catálogo con `ListRecipeBook` y deja crear y
 * listar **queques** ({@link SpongeForm}), **rellenos** y **coberturas**
 * ({@link LayerForm}). Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-book',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardBody, Icon, MigoSwiper, MigoSwiperSlide],
  templateUrl: './recipe-book.html',
})
export class RecipeBook {
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);
  protected readonly ref = inject<MigoDialogRef>(MigoDialogRef);

  private readonly catalog = signal<RecipeBookCatalog | null>(null);

  protected readonly loaded = computed(() => this.catalog() !== null);
  protected readonly sponges = computed<RecipeView[]>(() =>
    (this.catalog()?.sponges ?? []).map((s) => ({
      id: s.id.value,
      name: s.name,
      lineCount: s.lines.length,
      chips: spongeChips(s),
    })),
  );
  protected readonly fillings = computed<RecipeView[]>(() =>
    (this.catalog()?.fillings ?? []).map((f) => layerView(f)),
  );
  protected readonly coverings = computed<RecipeView[]>(() =>
    (this.catalog()?.coverings ?? []).map((c) => layerView(c)),
  );

  constructor() {
    void this.reload();
  }

  protected createSponge(): void {
    const sponges = this.catalog()?.sponges ?? [];
    const dialogRef = this.dialog.open<{ id: string }, SpongeFormData, SpongeForm>(SpongeForm, {
      data: { ingredients: this.recipeIngredients(), valuesByType: valuesByType(sponges) },
      ariaLabel: 'Nuevo queque',
      width: '640px',
    });
    this.reloadOnSave(dialogRef);
  }

  protected createFilling(): void {
    this.openLayer('filling', this.catalog()?.fillings ?? []);
  }

  protected createCovering(): void {
    this.openLayer('covering', this.catalog()?.coverings ?? []);
  }

  protected close(): void {
    this.ref.close();
  }

  private openLayer(kind: LayerKind, existing: readonly (FillingRecipe | CoveringRecipe)[]): void {
    const dialogRef = this.dialog.open<{ id: string }, LayerFormData, LayerForm>(LayerForm, {
      data: {
        kind,
        ingredients: this.recipeIngredients(),
        usedWeights: usedWeights(existing),
      },
      ariaLabel: kind === 'filling' ? 'Nuevo relleno' : 'Nueva cobertura',
      width: '640px',
    });
    this.reloadOnSave(dialogRef);
  }

  /** Insumos del catálogo usables en una receta (con su precio), para autocompletar. */
  private recipeIngredients(): IngredientOption[] {
    return (this.catalog()?.ingredients ?? []).filter((i) => i.usage === 'recipe').map(toIngredientOption);
  }

  private reloadOnSave(dialogRef: { closed: { subscribe(fn: (result: { id: string } | undefined) => void): unknown } }): void {
    dialogRef.closed.subscribe((result) => {
      if (result) {
        void this.reload();
      }
    });
  }

  private async reload(): Promise<void> {
    this.catalog.set(await this.listRecipeBook.execute());
  }
}

/** Proyecta un Ingredient del catálogo a una opción con precio para el formulario. */
function toIngredientOption(ingredient: Ingredient): IngredientOption {
  return {
    name: ingredient.name,
    baseUnit: ingredient.baseUnit,
    purchase: {
      amount: ingredient.purchasePrice.amount,
      per: { value: ingredient.purchasePrice.per.value, unit: ingredient.purchasePrice.per.unit },
      currency: ingredient.purchasePrice.currency,
    },
  };
}

/** Formatea gramos a una etiqueta legible (kg/g) — solo presentación. */
function formatWeight(grams: number): string {
  return grams >= 1000 ? `${+(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

/** Vista de listado de una capa (relleno/cobertura): chip con su peso de referencia. */
function layerView(layer: FillingRecipe | CoveringRecipe): RecipeView {
  return {
    id: layer.id.value,
    name: layer.name,
    lineCount: layer.lines.length,
    chips: [`Rinde ${formatWeight(layer.referenceWeight.value)}`],
  };
}

/** Chips de características de un queque para el listado. */
function spongeChips(s: SpongeRecipe): string[] {
  const chips: string[] = [];
  if (s.flavor) chips.push(s.flavor);
  chips.push(formatWeight(s.referenceYield.weight.value));
  if (s.referenceYield.size) chips.push(s.referenceYield.size);
  if (s.referenceYield.servings) chips.push(`${s.referenceYield.servings} porciones`);
  return chips;
}

/** Pesos de referencia ya usados por las capas, para sugerirlos en el SelectTag. */
function usedWeights(layers: readonly (FillingRecipe | CoveringRecipe)[]): string[] {
  return [...new Set(layers.map((l) => formatWeight(l.referenceWeight.value)))];
}

/** Valores ya usados por tipo, para alimentar las sugerencias del campo único. */
function valuesByType(sponges: readonly SpongeRecipe[]): Record<string, string[]> {
  const buckets: Record<string, Set<string>> = {
    sabor: new Set(),
    peso: new Set(),
    porciones: new Set(),
    'tamaño': new Set(),
  };
  for (const s of sponges) {
    if (s.flavor) buckets['sabor'].add(s.flavor);
    buckets['peso'].add(formatWeight(s.referenceYield.weight.value));
    if (s.referenceYield.size) buckets['tamaño'].add(s.referenceYield.size);
    if (s.referenceYield.servings) buckets['porciones'].add(String(s.referenceYield.servings));
  }
  return {
    sabor: [...buckets['sabor']],
    peso: [...buckets['peso']],
    porciones: [...buckets['porciones']],
    'tamaño': [...buckets['tamaño']],
  };
}
