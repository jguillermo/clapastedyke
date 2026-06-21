import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BaseUnit } from '@core/_common/quantity';
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
import type { IngredientLine } from '@core/recipe-book/domain/value-objects/ingredient-line';
import { SpongeForm, type SpongeFormData, type SpongeRecipePrefill } from './sponge-form/sponge-form';
import { LayerForm, type LayerFormData, type LayerKind, type LayerRecipePrefill } from './layer-form/layer-form';
import {
  RecipeDetail,
  type RecipeDetailData,
  type RecipeDetailKind,
  type RecipeDetailLine,
  type RecipeDetailResult,
} from './recipe-detail/recipe-detail';
import { IngredientDetail, type IngredientDetailData, type IngredientDetailResult } from './ingredient-detail/ingredient-detail';
import { IngredientForm, type IngredientFormData } from './ingredient-form/ingredient-form';
import type { IngredientOption, InitialLine } from './_shared/ingredient-grid/ingredient-grid';
import { USAGE_LABELS } from './_shared/ingredient-usage.labels';

interface RecipeView {
  id: string;
  name: string;
  lineCount: number;
  chips: string[];
}

interface IngredientView {
  id: string;
  name: string;
  usageLabel: string;
  priceChip: string;
}

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog que abre el mundo 3D al
 * tocar el atril de recetas. Lee el catálogo con `ListRecipeBook` y deja crear,
 * **ver** (ficha de lectura) y **editar** queques ({@link SpongeForm}), rellenos
 * y coberturas ({@link LayerForm}), además de gestionar los **insumos**
 * ({@link IngredientForm}). Inyecta solo use cases.
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
  protected readonly ingredients = computed<IngredientView[]>(() =>
    (this.catalog()?.ingredients ?? []).map((i) => ({
      id: i.id.value,
      name: i.name,
      usageLabel: USAGE_LABELS[i.usage],
      priceChip: `S/ ${i.purchasePrice.amount} · ${formatQuantity(i.purchasePrice.per.value, i.purchasePrice.per.unit)}`,
    })),
  );

  /** Insumos indexados por id, para resolver las líneas de una receta al verla/editarla. */
  private readonly ingredientsById = computed(
    () => new Map<string, Ingredient>((this.catalog()?.ingredients ?? []).map((i) => [i.id.value, i])),
  );

  constructor() {
    void this.reload();
  }

  // --- Crear ---

  protected createSponge(): void {
    const dialogRef = this.dialog.open<{ id: string }, SpongeFormData, SpongeForm>(SpongeForm, {
      data: { ingredients: this.recipeIngredients(), valuesByType: valuesByType(this.catalog()?.sponges ?? []) },
      ariaLabel: 'Nuevo queque',
      width: '640px',
    });
    this.reloadOnSave(dialogRef);
  }

  protected createFilling(): void {
    this.openLayerForm('filling', this.catalog()?.fillings ?? []);
  }

  protected createCovering(): void {
    this.openLayerForm('covering', this.catalog()?.coverings ?? []);
  }

  protected createIngredient(): void {
    const dialogRef = this.dialog.open<{ id: string }, IngredientFormData, IngredientForm>(IngredientForm, {
      ariaLabel: 'Nuevo insumo',
      width: '560px',
    });
    this.reloadOnSave(dialogRef);
  }

  // --- Ver (ficha de lectura) → Editar ---

  protected openSponge(id: string): void {
    const sponge = (this.catalog()?.sponges ?? []).find((s) => s.id.value === id);
    if (!sponge) return;
    const ref = this.openDetail('sponge', sponge.name, spongeChips(sponge), sponge.lines);
    ref.closed.subscribe((result) => {
      if (result?.action === 'edit') this.editSponge(sponge);
    });
  }

  protected openFilling(id: string): void {
    const filling = (this.catalog()?.fillings ?? []).find((f) => f.id.value === id);
    if (!filling) return;
    const ref = this.openDetail('filling', filling.name, layerChips(filling), filling.lines);
    ref.closed.subscribe((result) => {
      if (result?.action === 'edit') this.editLayer('filling', filling);
    });
  }

  protected openCovering(id: string): void {
    const covering = (this.catalog()?.coverings ?? []).find((c) => c.id.value === id);
    if (!covering) return;
    const ref = this.openDetail('covering', covering.name, layerChips(covering), covering.lines);
    ref.closed.subscribe((result) => {
      if (result?.action === 'edit') this.editLayer('covering', covering);
    });
  }

  protected openIngredient(id: string): void {
    const ingredient = (this.catalog()?.ingredients ?? []).find((i) => i.id.value === id);
    if (!ingredient) return;
    const data: IngredientDetailData = {
      name: ingredient.name,
      usage: ingredient.usage,
      purchase: {
        amount: ingredient.purchasePrice.amount,
        per: { value: ingredient.purchasePrice.per.value, unit: ingredient.purchasePrice.per.unit },
        currency: ingredient.purchasePrice.currency,
      },
    };
    const ref = this.dialog.open<IngredientDetailResult, IngredientDetailData, IngredientDetail>(IngredientDetail, {
      data,
      ariaLabel: ingredient.name,
      width: '560px',
    });
    ref.closed.subscribe((result) => {
      if (result?.action === 'edit') this.editIngredient(ingredient);
    });
  }

  protected close(): void {
    this.ref.close();
  }

  // --- Editar ---

  private editSponge(sponge: SpongeRecipe): void {
    const prefill: SpongeRecipePrefill = {
      name: sponge.name,
      flavor: sponge.flavor,
      weightLabel: formatWeight(sponge.referenceYield.weight.value),
      servings: sponge.referenceYield.servings ? String(sponge.referenceYield.servings) : undefined,
      size: sponge.referenceYield.size,
      lines: this.prefillLines(sponge.lines),
    };
    const dialogRef = this.dialog.open<{ id: string }, SpongeFormData, SpongeForm>(SpongeForm, {
      data: {
        ingredients: this.recipeIngredients(),
        valuesByType: valuesByType(this.catalog()?.sponges ?? []),
        recipe: prefill,
      },
      ariaLabel: 'Editar queque',
      width: '640px',
    });
    this.reloadOnSave(dialogRef);
  }

  private editLayer(kind: LayerKind, layer: FillingRecipe | CoveringRecipe): void {
    const existing = kind === 'filling' ? (this.catalog()?.fillings ?? []) : (this.catalog()?.coverings ?? []);
    const prefill: LayerRecipePrefill = {
      name: layer.name,
      weightLabel: formatWeight(layer.referenceWeight.value),
      lines: this.prefillLines(layer.lines),
    };
    this.openLayerForm(kind, existing, prefill);
  }

  private editIngredient(ingredient: Ingredient): void {
    const data: IngredientFormData = {
      ingredient: {
        name: ingredient.name,
        usage: ingredient.usage,
        purchase: {
          amount: ingredient.purchasePrice.amount,
          per: { value: ingredient.purchasePrice.per.value, unit: ingredient.purchasePrice.per.unit },
          currency: ingredient.purchasePrice.currency,
        },
      },
    };
    const dialogRef = this.dialog.open<{ id: string }, IngredientFormData, IngredientForm>(IngredientForm, {
      data,
      ariaLabel: 'Editar insumo',
      width: '560px',
    });
    this.reloadOnSave(dialogRef);
  }

  // --- Helpers ---

  private openLayerForm(
    kind: LayerKind,
    existing: readonly (FillingRecipe | CoveringRecipe)[],
    recipe?: LayerRecipePrefill,
  ): void {
    const dialogRef = this.dialog.open<{ id: string }, LayerFormData, LayerForm>(LayerForm, {
      data: { kind, ingredients: this.recipeIngredients(), usedWeights: usedWeights(existing), recipe },
      ariaLabel: recipe
        ? kind === 'filling'
          ? 'Editar relleno'
          : 'Editar cobertura'
        : kind === 'filling'
          ? 'Nuevo relleno'
          : 'Nueva cobertura',
      width: '640px',
    });
    this.reloadOnSave(dialogRef);
  }

  private openDetail(
    kind: RecipeDetailKind,
    name: string,
    chips: string[],
    lines: readonly IngredientLine[],
  ): MigoDialogRef<RecipeDetailResult, RecipeDetail> {
    const byId = this.ingredientsById();
    const data: RecipeDetailData = {
      kind,
      name,
      chips,
      lines: lines.map((line): RecipeDetailLine => {
        const ingredient = byId.get(line.ingredientId.value);
        return {
          name: ingredient?.name ?? '—',
          quantityLabel: formatQuantity(line.quantity.value, line.quantity.unit),
          purchasePrice: ingredient
            ? {
                amount: ingredient.purchasePrice.amount,
                per: { value: ingredient.purchasePrice.per.value, unit: ingredient.purchasePrice.per.unit },
              }
            : null,
          quantity: { value: line.quantity.value, unit: line.quantity.unit },
        };
      }),
    };
    return this.dialog.open<RecipeDetailResult, RecipeDetailData, RecipeDetail>(RecipeDetail, {
      data,
      ariaLabel: name,
      width: '640px',
    });
  }

  /** Líneas de una receta proyectadas para precargar la grilla del formulario al editar. */
  private prefillLines(lines: readonly IngredientLine[]): InitialLine[] {
    const byId = this.ingredientsById();
    const result: InitialLine[] = [];
    for (const line of lines) {
      const ingredient = byId.get(line.ingredientId.value);
      if (ingredient) {
        result.push({ name: ingredient.name, quantity: line.quantity.value, baseUnit: line.quantity.unit });
      }
    }
    return result;
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

/** Formatea una cantidad a una etiqueta legible (g/kg/u) — solo presentación. */
function formatQuantity(value: number, unit: BaseUnit): string {
  if (unit === 'u') return `${value} u`;
  return formatWeight(value);
}

/** Formatea gramos a una etiqueta legible (kg/g) — solo presentación. */
function formatWeight(grams: number): string {
  return grams >= 1000 ? `${+(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

/** Chips de una capa (relleno/cobertura): su peso de referencia. */
function layerChips(layer: FillingRecipe | CoveringRecipe): string[] {
  return [`Rinde ${formatWeight(layer.referenceWeight.value)}`];
}

/** Vista de listado de una capa (relleno/cobertura). */
function layerView(layer: FillingRecipe | CoveringRecipe): RecipeView {
  return {
    id: layer.id.value,
    name: layer.name,
    lineCount: layer.lines.length,
    chips: layerChips(layer),
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
