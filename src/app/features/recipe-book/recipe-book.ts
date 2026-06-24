import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { MigoSwiper } from '@components/swiper/swiper';
import { MigoSwiperSlide } from '@components/swiper/swiper-slide';
import { MigoDialog, MigoDialogRef, MIGO_DIALOG_DATA } from '@components/dialog/dialog.service';
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
import type { IngredientOption, InitialLine } from './_shared/ingredient-grid/ingredient-grid';
import { IngredientList } from './ingredient-list/ingredient-list';
import { formatQuantity, formatWeight, layerChips, spongeChips } from './_shared/recipe-format';

interface RecipeView {
  id: string;
  name: string;
  lineCount: number;
  chips: string[];
}

/** Pestaña/sección del libro que el hub puede abrir directamente. */
export type RecipeBookTab = 'sponges' | 'fillings' | 'coverings' | 'ingredients';

/** Datos opcionales al abrir el hub: en qué pestaña entrar y si arrancar "agregar". */
export interface RecipeBookData {
  tab?: RecipeBookTab;
  add?: boolean;
}

/** Orden de las pestañas en el swiper. */
const TAB_INDEX: Record<RecipeBookTab, number> = {
  sponges: 0,
  fillings: 1,
  coverings: 2,
  ingredients: 3,
};

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog que abre el mundo 3D al
 * tocar el atril de recetas. Lee el catálogo con `ListRecipeBook` y deja crear,
 * **ver** (ficha de lectura) y **editar** queques ({@link SpongeForm}), rellenos
 * y coberturas ({@link LayerForm}), además de gestionar los **insumos** como una
 * lista editable en línea ({@link IngredientList}). Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-book',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardBody, Icon, MigoSwiper, MigoSwiperSlide, IngredientList],
  templateUrl: './recipe-book.html',
})
export class RecipeBook implements AfterViewInit {
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);
  protected readonly ref = inject<MigoDialogRef>(MigoDialogRef);
  /** Pestaña/intención con la que se abrió (p. ej. desde un botón del libro 3D). */
  private readonly data = inject<RecipeBookData | null>(MIGO_DIALOG_DATA, { optional: true });

  private readonly swiper = viewChild(MigoSwiper);
  private readonly ingredientList = viewChild(IngredientList);

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
  /** Insumos del catálogo (entidades) para la lista editable de la pestaña Insumos. */
  protected readonly ingredientEntities = computed(() => this.catalog()?.ingredients ?? []);

  /** Insumos indexados por id, para resolver las líneas de una receta al verla/editarla. */
  private readonly ingredientsById = computed(
    () => new Map<string, Ingredient>((this.catalog()?.ingredients ?? []).map((i) => [i.id.value, i])),
  );

  private readonly ready = this.reload();

  ngAfterViewInit(): void {
    const tab = this.data?.tab;
    if (!tab) {
      return;
    }
    // Abre en la pestaña que corresponde a la página del libro desde donde se llamó.
    setTimeout(() => this.swiper()?.slideTo(TAB_INDEX[tab]));
    if (this.data?.add) {
      void this.ready.then(() => this.startAdd(tab));
    }
  }

  /** Arranca "agregar" en la sección pedida: forms para recetas, foco al renglón para insumos. */
  private startAdd(tab: RecipeBookTab): void {
    switch (tab) {
      case 'sponges':
        this.createSponge();
        break;
      case 'fillings':
        this.createFilling();
        break;
      case 'coverings':
        this.createCovering();
        break;
      case 'ingredients':
        setTimeout(() => this.ingredientList()?.focusNew());
        break;
    }
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

  protected async reload(): Promise<void> {
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

/** Vista de listado de una capa (relleno/cobertura). */
function layerView(layer: FillingRecipe | CoveringRecipe): RecipeView {
  return {
    id: layer.id.value,
    name: layer.name,
    lineCount: layer.lines.length,
    chips: layerChips(layer),
  };
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
