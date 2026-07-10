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
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import { RecipeDetail, type RecipeDetailData, type RecipeDetailLine } from './recipe-detail/recipe-detail';
import { SupplyList } from './supply-list/supply-list';
import { formatQuantity } from './_shared/recipe-format';

interface RecipeView {
  id: string;
  name: string;
  lineCount: number;
}

interface CategoryView {
  id: string;
  name: string;
  recipes: RecipeView[];
}

/** Datos opcionales al abrir el hub: en qué categoría entrar. */
export interface RecipeBookData {
  categoryId?: string;
}

/**
 * Resultado al cerrar el hub: a dónde debe saltar el libro 3D para reflejar lo
 * último que se tocó (la categoría, o los insumos).
 */
export interface RecipeBookResult {
  categoryId?: string;
  supplies?: boolean;
}

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog. Lee el catálogo con
 * `ListRecipeBook` y muestra, por categoría, sus recetas en modo lectura
 * (ficha de detalle). Los **insumos** se gestionan aparte. Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-book',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, CardHeader, CardTitle, CardBody, Icon, Button, SupplyList, MigoSwiper, MigoSwiperSlide],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  templateUrl: './recipe-book.html',
})
export class RecipeBook implements AfterViewInit {
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);
  protected readonly ref = inject<MigoDialogRef<RecipeBookResult>>(MigoDialogRef);
  private readonly data = inject<RecipeBookData | null>(MIGO_DIALOG_DATA, { optional: true });

  /** Foco a devolver al libro 3D: última categoría/insumos que se tocó. */
  private focusCategoryId: string | null = this.data?.categoryId ?? null;
  private focusSupplies = false;

  private readonly swiper = viewChild(MigoSwiper);

  private readonly catalog = signal<RecipeBookCatalog | null>(null);

  protected readonly loaded = computed(() => this.catalog() !== null);
  protected readonly supplyEntities = computed(() => this.catalog()?.supplies ?? []);

  private readonly recipesById = computed(
    () => new Map((this.catalog()?.recipes ?? []).map((r) => [r.id.value, r])),
  );
  private readonly categoriesById = computed(
    () => new Map((this.catalog()?.categories ?? []).map((c) => [c.id.value, c])),
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
        .map((recipe) => this.toView(recipe))
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
    });
  }

  // --- Pestañas ---

  /** Cambia la pestaña visible (categorías + Insumos). El foco sigue a la pestaña. */
  protected onTabChange(index: number): void {
    const categories = this.categoryViews();
    const insumosTab = categories.length;
    if (index === insumosTab) {
      this.focusSupplies = true;
      this.focusCategoryId = null;
    } else if (index >= 0 && index < categories.length) {
      this.focusSupplies = false;
      this.focusCategoryId = categories[index].id;
    }
  }

  // --- Recetas ---

  protected openRecipe(recipeId: string): void {
    const recipe = this.recipesById().get(recipeId);
    const category = recipe ? this.categoriesById().get(recipe.categoryId.value) : undefined;
    if (!recipe || !category) return;
    this.openDetail(recipe, category);
  }

  protected close(): void {
    this.ref.close(this.buildResult());
  }

  protected onSuppliesChanged(): void {
    this.focusSupplies = true;
    this.focusCategoryId = null;
    void this.reload();
  }

  /** Foco a devolver al libro: insumos > categoría visible. */
  private buildResult(): RecipeBookResult {
    if (this.focusSupplies) {
      return { supplies: true };
    }
    return this.focusCategoryId ? { categoryId: this.focusCategoryId } : {};
  }

  // --- Helpers de diálogos ---

  private openDetail(recipe: Recipe, category: RecipeCategory): MigoDialogRef<void, RecipeDetail> {
    const byId = this.suppliesById();
    const data: RecipeDetailData = {
      subtitle: category.name,
      name: recipe.name,
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
    return this.dialog.open<void, RecipeDetailData, RecipeDetail>(RecipeDetail, {
      data,
      ariaLabel: recipe.name,
      width: '640px',
    });
  }

  // --- Proyecciones ---

  private recipesOf(category: RecipeCategory): Recipe[] {
    return (this.catalog()?.recipes ?? []).filter((r) => r.categoryId.value === category.id.value);
  }

  private toView(recipe: Recipe): RecipeView {
    return {
      id: recipe.id.value,
      name: recipe.name,
      lineCount: recipe.lines.length,
    };
  }

  protected async reload(): Promise<void> {
    this.catalog.set(await this.listRecipeBook.execute());
  }
}
