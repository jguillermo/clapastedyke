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
import { Spacer } from '@components/spacer/spacer';
import { MigoSwiper } from '@components/swiper/swiper';
import { MigoSwiperSlide } from '@components/swiper/swiper-slide';
import { MigoDialog, MigoDialogRef, MIGO_DIALOG_DATA } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { SupplyLine } from '@core/recipe-book/domain/value-objects/supply-line';
import { RecipeForm, type RecipeFormData, type RecipeFormPrefill } from './recipe-form/recipe-form';
import { CategoryEditor, type CategoryEditorData } from './category-editor/category-editor';
import {
  RecipeDetail,
  type RecipeDetailData,
  type RecipeDetailLine,
  type RecipeDetailResult,
} from './recipe-detail/recipe-detail';
import type { SupplyOption, InitialLine } from './_shared/supply-grid/supply-grid';
import { SupplyList } from './supply-list/supply-list';
import { formatQuantity, formatWeight, recipeChips } from './_shared/recipe-format';

interface RecipeView {
  id: string;
  name: string;
  lineCount: number;
  chips: string[];
}

interface CategoryView {
  id: string;
  name: string;
  recipes: RecipeView[];
}

/** Datos opcionales al abrir el hub: en qué categoría entrar y si arrancar "agregar". */
export interface RecipeBookData {
  categoryId?: string;
  add?: boolean;
}

/**
 * Resultado al cerrar el hub: a dónde debe saltar el libro 3D para reflejar lo
 * último que se tocó (la receta recién guardada, su categoría, o los insumos).
 */
export interface RecipeBookResult {
  categoryId?: string;
  recipeName?: string;
  supplies?: boolean;
}

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog. Lee el catálogo con
 * `ListRecipeBook` y deja crear/editar **categorías** y, dentro de cada una,
 * crear, **ver** y **editar** recetas con un formulario dinámico según el esquema
 * de la categoría. Los **insumos** se gestionan aparte. Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-book',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardBody, Icon, Spacer, SupplyList, MigoSwiper, MigoSwiperSlide],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  templateUrl: './recipe-book.html',
})
export class RecipeBook implements AfterViewInit {
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);
  protected readonly ref = inject<MigoDialogRef<RecipeBookResult>>(MigoDialogRef);
  private readonly data = inject<RecipeBookData | null>(MIGO_DIALOG_DATA, { optional: true });

  /** Foco a devolver al libro 3D: última receta/categoría/insumos que se tocó. */
  private focusRecipeId: string | null = null;
  private focusCategoryId: string | null = this.data?.categoryId ?? null;
  private focusSupplies = false;

  private readonly swiper = viewChild(MigoSwiper);

  private readonly catalog = signal<RecipeBookCatalog | null>(null);

  protected readonly loaded = computed(() => this.catalog() !== null);
  protected readonly supplyEntities = computed(() => this.catalog()?.supplies ?? []);

  private readonly categoriesById = computed(
    () => new Map((this.catalog()?.categories ?? []).map((c) => [c.id.value, c])),
  );
  private readonly recipesById = computed(
    () => new Map((this.catalog()?.recipes ?? []).map((r) => [r.id.value, r])),
  );
  private readonly suppliesById = computed(
    () => new Map<string, Supply>((this.catalog()?.supplies ?? []).map((s) => [s.id.value, s])),
  );

  /** Categorías (ordenadas) con sus recetas alfabéticas, listas para pintar. */
  protected readonly categoryViews = computed<CategoryView[]>(() => {
    const catalog = this.catalog();
    if (!catalog) {
      return [];
    }
    return catalog.categories.map((category) => ({
      id: category.id.value,
      name: category.name,
      recipes: this.recipesOf(category)
        .map((recipe) => this.toView(recipe, category))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }));
  });

  private readonly ready = this.reload();

  ngAfterViewInit(): void {
    const categoryId = this.data?.categoryId;
    if (!categoryId) {
      return;
    }
    void this.ready.then(() => {
      // Abre la pestaña de la categoría desde la que se llamó (página del libro).
      const index = this.categoryViews().findIndex((c) => c.id === categoryId);
      if (index >= 0) {
        setTimeout(() => this.swiper()?.slideTo(index));
      }
      if (this.data?.add) {
        const category = this.categoriesById().get(categoryId);
        if (category) {
          this.createRecipe(category);
        }
      }
    });
  }

  // --- Pestañas ---

  /** Última pestaña "real" (categoría o Insumos) para volver tras la acción "Crear categoría". */
  private lastRealTab = 0;

  /** Cambia la pestaña visible (categorías + Insumos). El foco sigue a la pestaña. */
  protected onTabChange(index: number): void {
    const categories = this.categoryViews();
    const insumosTab = categories.length;
    this.lastRealTab = index;
    this.focusRecipeId = null;
    if (index === insumosTab) {
      this.focusSupplies = true;
      this.focusCategoryId = null;
    } else if (index >= 0 && index < categories.length) {
      this.focusSupplies = false;
      this.focusCategoryId = categories[index].id;
    }
  }

  // --- Categorías ---

  protected editCategoryById(id: string): void {
    const category = this.categoriesById().get(id);
    if (!category) return;
    const ref = this.dialog.open<{ id: string }, CategoryEditorData, CategoryEditor>(CategoryEditor, {
      data: { category, ...this.categoryEditorCatalog() },
      ariaLabel: 'Editar categoría',
      width: '640px',
    });
    this.onCategorySaved(ref);
  }

  /** Catálogos (sabores + capacidades de receta) en forma plana para el editor de categoría. */
  private categoryEditorCatalog(): Omit<CategoryEditorData, 'category'> {
    const catalog = this.catalog();
    return {
      flavors: (catalog?.flavors ?? []).map((f) => ({ id: f.id.value, label: f.label })),
      recipeCapacities: (catalog?.recipeCapacities ?? []).map((c) => ({
        id: c.id.value,
        group: c.group,
        label: c.label,
        factor: c.factor,
      })),
    };
  }

  // --- Recetas ---

  protected addRecipe(categoryId: string): void {
    const category = this.categoriesById().get(categoryId);
    if (category) this.createRecipe(category);
  }

  protected openRecipe(recipeId: string): void {
    const recipe = this.recipesById().get(recipeId);
    const category = recipe ? this.categoriesById().get(recipe.categoryId.value) : undefined;
    if (!recipe || !category) return;
    const ref = this.openDetail(recipe, category);
    ref.closed.subscribe((result) => {
      if (result?.action === 'edit') this.editRecipe(recipe, category);
    });
  }

  protected close(): void {
    this.ref.close(this.buildResult());
  }

  protected onSuppliesChanged(): void {
    this.focusSupplies = true;
    this.focusCategoryId = null;
    this.focusRecipeId = null;
    void this.reload();
  }

  /** Foco a devolver al libro: insumos > receta recién tocada > categoría visible. */
  private buildResult(): RecipeBookResult {
    if (this.focusSupplies) {
      return { supplies: true };
    }
    const recipe = this.focusRecipeId ? this.recipesById().get(this.focusRecipeId) : null;
    if (recipe) {
      return { categoryId: recipe.categoryId.value, recipeName: recipe.name };
    }
    return this.focusCategoryId ? { categoryId: this.focusCategoryId } : {};
  }

  private onCategorySaved(dialogRef: {
    closed: { subscribe(fn: (result: { id: string } | undefined) => void): unknown };
  }): void {
    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.focusCategoryId = result.id;
        this.focusRecipeId = null;
        this.focusSupplies = false;
        void this.reload();
      }
    });
  }

  private onRecipeSaved(dialogRef: {
    closed: { subscribe(fn: (result: { id: string } | undefined) => void): unknown };
  }): void {
    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.focusRecipeId = result.id;
        this.focusSupplies = false;
        void this.reload();
      }
    });
  }

  // --- Helpers de diálogos ---

  private createRecipe(category: RecipeCategory): void {
    const ref = this.dialog.open<{ id: string }, RecipeFormData, RecipeForm>(RecipeForm, {
      data: {
        category,
        supplies: this.recipeSupplies(),
        valuesByProp: this.valuesByProp(category),
      },
      ariaLabel: `Nueva receta en ${category.name}`,
      width: '640px',
    });
    this.onRecipeSaved(ref);
  }

  private editRecipe(recipe: Recipe, category: RecipeCategory): void {
    const prefill: RecipeFormPrefill = {
      name: recipe.name,
      values: this.rawValues(recipe),
      lines: this.prefillLines(recipe.lines),
    };
    const ref = this.dialog.open<{ id: string }, RecipeFormData, RecipeForm>(RecipeForm, {
      data: {
        category,
        supplies: this.recipeSupplies(),
        valuesByProp: this.valuesByProp(category),
        recipe: prefill,
      },
      ariaLabel: `Editar ${recipe.name}`,
      width: '640px',
    });
    this.onRecipeSaved(ref);
  }

  private openDetail(
    recipe: Recipe,
    category: RecipeCategory,
  ): MigoDialogRef<RecipeDetailResult, RecipeDetail> {
    const byId = this.suppliesById();
    const data: RecipeDetailData = {
      subtitle: category.name,
      name: recipe.name,
      chips: recipeChips(recipe, category),
      lines: recipe.lines.map((line): RecipeDetailLine => {
        const supply = byId.get(line.supplyId.value);
        return {
          name: supply?.name ?? '—',
          quantityLabel: formatQuantity(line.quantity.value, line.quantity.unit),
          purchasePrice: supply
            ? {
                amount: supply.purchasePrice.amount,
                per: { value: supply.purchasePrice.per.value, unit: supply.purchasePrice.per.unit },
              }
            : null,
          quantity: { value: line.quantity.value, unit: line.quantity.unit },
        };
      }),
    };
    return this.dialog.open<RecipeDetailResult, RecipeDetailData, RecipeDetail>(RecipeDetail, {
      data,
      ariaLabel: recipe.name,
      width: '640px',
    });
  }

  // --- Proyecciones ---

  private recipesOf(category: RecipeCategory): Recipe[] {
    return (this.catalog()?.recipes ?? []).filter((r) => r.categoryId.value === category.id.value);
  }

  private toView(recipe: Recipe, category: RecipeCategory): RecipeView {
    return {
      id: recipe.id.value,
      name: recipe.name,
      lineCount: recipe.lines.length,
      chips: recipeChips(recipe, category),
    };
  }

  /** Valores (texto visible) por id de propiedad para precargar el formulario. */
  private rawValues(recipe: Recipe): Record<string, string> {
    const values: Record<string, string> = {};
    for (const value of recipe.values) {
      values[value.propertyId] = value.type === 'weight' ? formatWeight(value.asWeight().value) : String(value.value);
    }
    return values;
  }

  /**
   * Opciones/sugerencias por propiedad para el formulario. Para propiedades de
   * catálogo (`flavor` → sabores; `options` → capacidades de receta del grupo) se
   * siembran los labels del catálogo (esto restaura los sabores/tamaños/moldes
   * predefinidos al crear una receta); se añaden además los valores ya usados.
   */
  private valuesByProp(category: RecipeCategory): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const recipes = this.recipesOf(category);
    const catalog = this.catalog();
    for (const property of category.properties) {
      const set = new Set<string>();
      if (property.type === 'flavor') {
        for (const flavor of catalog?.flavors ?? []) {
          set.add(flavor.label);
        }
      } else if (property.type === 'options' && property.group) {
        for (const capacity of catalog?.recipeCapacities ?? []) {
          if (capacity.group === property.group) {
            set.add(capacity.label);
          }
        }
      }
      for (const recipe of recipes) {
        const value = recipe.valueOf(property.id);
        if (value) {
          set.add(value.type === 'weight' ? formatWeight(value.asWeight().value) : String(value.value));
        }
      }
      result[property.id] = [...set];
    }
    return result;
  }

  private prefillLines(lines: readonly SupplyLine[]): InitialLine[] {
    const byId = this.suppliesById();
    const result: InitialLine[] = [];
    for (const line of lines) {
      const supply = byId.get(line.supplyId.value);
      if (supply) {
        result.push({ name: supply.name, quantity: line.quantity.value, baseUnit: line.quantity.unit });
      }
    }
    return result;
  }

  private recipeSupplies(): SupplyOption[] {
    return (this.catalog()?.supplies ?? []).filter((s) => s.usage === 'recipe').map(toSupplyOption);
  }

  protected async reload(): Promise<void> {
    this.catalog.set(await this.listRecipeBook.execute());
  }
}

/** Proyecta un Supply del catálogo a una opción con precio para el formulario. */
function toSupplyOption(supply: Supply): SupplyOption {
  return {
    name: supply.name,
    baseUnit: supply.baseUnit,
    purchase: {
      amount: supply.purchasePrice.amount,
      per: { value: supply.purchasePrice.per.value, unit: supply.purchasePrice.per.unit },
      currency: supply.purchasePrice.currency,
    },
  };
}
