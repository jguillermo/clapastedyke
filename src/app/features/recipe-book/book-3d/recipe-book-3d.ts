import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { Spacer } from '@components/spacer/spacer';
import { Badge } from '@components/badge/badge';
import { MigoDialog } from '@components/dialog/dialog.service';
import type { EntityId } from '@core/_common/entity-id';
import {
  ListRecipeBook,
  type RecipeBookCatalog,
} from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { RecipeFlavor } from '@core/recipe-book/domain/entities/recipe-flavor';
import type { RecipeCapacity } from '@core/recipe-book/domain/entities/recipe-capacity';
import { BookEngine, type BookSpread } from '@platform/three/book/book-engine';
import type { PageContent } from '@platform/three/book/page-content';
import { RecipeForm, type RecipeFormData, type RecipeFormResult } from '../recipe-form/recipe-form';
import { SuppliesDialog, type SuppliesDialogData } from '../supplies-dialog/supplies-dialog';
import type { InitialLine } from '../_shared/supply-grid/supply-grid';
import { RecipeOverlay, type OverlayRect } from './recipe-overlay/recipe-overlay';
import { INGREDIENTS_SECTION, toPages } from './recipe-page-projector';

/** Un overlay de receta a pintar: qué receta, en qué lado del libro y su caja en pantalla. */
interface RecipeOverlayView {
  side: 'left' | 'right';
  recipe: Recipe;
  rect: OverlayRect;
}

/** Una entrada del índice (salto rápido a una página). */
interface IndexEntry {
  readonly label: string;
  readonly faceIndex: number;
  readonly section: boolean;
}

/** Foco a devolver al libro tras cerrar un formulario/diálogo. */
interface BookFocus {
  categoryId?: string;
  recipeName?: string;
  supplies?: boolean;
}

/**
 * Experiencia de LECTURA a pantalla completa: el libro de recetas renderizado en
 * 3D ({@link BookEngine}) con páginas que se pasan con curvatura realista. Inyecta
 * solo el use case `ListRecipeBook` y proyecta el catálogo a páginas agnósticas.
 *
 * **Editar** vive *dentro del libro*: cada página de receta pinta un chip de lápiz (en la textura)
 * y un toque/clic sobre él (hit-test por `BookEngine.pickPageAction`) abre el formulario único
 * {@link RecipeForm} de esa receta — uno por página (2 en spread). La tecla **E** edita la receta
 * de la página actual (accesibilidad, ya que el chip 3D no es focusable). Botones flotantes:
 * **＋ Nuevo «Categoría»** (primary) en páginas de categoría y **Insumos** ({@link SuppliesDialog})
 * en la sección de Insumos. Sin WebGL cae a una lista DOM accesible con las mismas acciones.
 * Navegación por teclado y región `aria-live` para lectores.
 */
@Component({
  selector: 'app-recipe-book-3d',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Spacer, Badge, RecipeOverlay],
  host: {
    class: 'fixed inset-0 z-40 block bg-surface-page',
    '(window:resize)': 'onResize()',
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    @if (webglSupported()) {
      <canvas
        #canvas
        class="block h-full w-full touch-none"
        aria-hidden="true"
        (pointerdown)="onSwipeStart($event)"
        (pointerup)="onSwipeEnd($event)"
      ></canvas>

      <!-- Contenido de cada receta visible: overlay DOM sobre la hoja (scroll nativo, título fijo). -->
      @for (ov of overlays(); track ov.side) {
        <app-recipe-overlay
          [recipe]="ov.recipe"
          [supplies]="supplyEntities()"
          [flavors]="flavorEntities()"
          [capacities]="capacityEntities()"
          [rect]="ov.rect"
          (edit)="openEditForm(ov.recipe)"
          (swipe)="onOverlaySwipe($event)"
        />
      }

      <!-- Cerrar / volver a la cocina -->
      <button
        migo-button
        variant="secondary"
        size="md"
        class="absolute left-4 top-4 shadow-md"
        aria-label="Volver"
        (click)="close()"
      >
        <migo-icon icon-leading name="mat:arrow_back" size="sm" />
      </button>

      <!-- Anuncio para lectores de pantalla (el texto 3D no es accesible) -->
      <p
        class="absolute h-px w-px overflow-hidden whitespace-nowrap"
        role="status"
        aria-live="polite"
      >
        {{ announce() }}
      </p>

      <!-- Barra de navegación inferior. Móvil: pegada al footer, ancho completo. sm+: píldora centrada. -->
      <nav
        class="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 border-t border-border-subtle bg-surface-card px-4 py-3 shadow-lg
               sm:inset-x-auto sm:left-1/2 sm:bottom-5 sm:w-auto sm:-translate-x-1/2 sm:gap-3 sm:rounded-full sm:border sm:px-3"
        aria-label="Páginas del libro"
      >
        <button
          migo-button
          variant="secondary"
          size="md"
          class="shadow-md"
          [disabled]="!canPrev()"
          (click)="prev()"
          aria-label="Página anterior"
        >
          <migo-icon icon-leading name="mat:chevron_right" size="md" class="rotate-180" />
        </button>

        <button
          migo-button
          variant="secondary"
          size="md"
          class="shadow-md"
          aria-label="Índice"
          (click)="toggleIndex()"
        >
          <migo-icon icon-leading name="mat:layers" size="sm" />
          <migo-spacer hideOnMobile /><span class="hidden sm:inline">Índice</span>
        </button>

        <button
          migo-button
          variant="secondary"
          size="md"
          class="shadow-md"
          [disabled]="!canNext()"
          (click)="next()"
          aria-label="Página siguiente"
        >
          <migo-icon icon-leading name="mat:chevron_right" size="md" />
        </button>
      </nav>

      <!-- Nuevo/Insumos (primary): SIEMPRE flotante (no altera la barra). En móvil, a la altura del
           footer, al costado de sus botones (bottom-3); en sm+ flota más arriba (bottom-24). -->
      @if (currentSection(); as categoryId) {
        <button
          migo-button
          variant="primary"
          size="md"
          class="absolute bottom-3 right-4 z-30 shadow-lg sm:bottom-24"
          [attr.aria-label]="'Nuevo ' + categoryName()"
          (click)="openNewForm(categoryId)"
        >
          <migo-icon icon-leading name="mat:add" size="md" />
        </button>
      } @else if (onSupplies()) {
        <button
          migo-button
          variant="primary"
          size="md"
          class="absolute bottom-3 right-4 z-30 shadow-lg sm:bottom-24"
          aria-label="Gestionar insumos"
          (click)="openSupplies()"
        >
          <migo-icon icon-leading name="mat:layers" size="md" />
        </button>
      }

      <!-- Índice: panel lateral izquierdo (full-bleed en móvil, columna fija en sm+) -->
      @if (indexOpen()) {
        <nav
          class="absolute inset-y-0 left-0 z-50 flex w-full sm:w-80 flex-col bg-surface-card border-e border-border-subtle shadow-lg"
          aria-label="Índice de recetas"
        >
          <div
            class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle"
          >
            <span class="font-display text-heading text-sm">Índice</span>
            <button
              migo-button
              variant="ghost"
              size="sm"
              type="button"
              aria-label="Cerrar índice"
              (click)="toggleIndex()"
            >
              <migo-icon icon-leading name="mat:close" size="sm" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            @for (entry of indexEntries(); track entry.faceIndex) {
              @if (entry.section) {
                <p class="m-0 mt-3 mb-1 px-2 font-display text-heading text-sm first:mt-0">
                  {{ entry.label }}
                </p>
              } @else {
                <button
                  type="button"
                  class="block min-h-11 w-full rounded-xl px-4 py-2 text-left font-body text-sm text-body hover:bg-surface-sunken focus-visible:shadow-focus focus-visible:outline-none"
                  (click)="jump(entry.faceIndex)"
                >
                  {{ entry.label }}
                </button>
              }
            }
          </div>
        </nav>
      }
    } @else {
      <!-- Fallback accesible sin WebGL: lista DOM con las mismas acciones. -->
      <div class="absolute inset-0 flex flex-col overflow-y-auto p-4 gap-4">
        <div class="flex items-center justify-between gap-3">
          <span class="font-display text-heading text-lead">Mi libro de recetas</span>
          <button migo-button variant="secondary" size="md" (click)="close()">
            <migo-icon icon-leading name="mat:arrow_back" size="sm" />
            <migo-spacer />Volver
          </button>
        </div>

        @for (category of catalog()?.categories ?? []; track category.id.value) {
          <section class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-3">
              <h2 class="m-0 font-display text-heading text-base">{{ category.name }}</h2>
              <button
                migo-button
                variant="secondary"
                size="sm"
                (click)="openNewForm(category.id.value)"
              >
                <migo-icon icon-leading name="mat:add" size="sm" />
                <migo-spacer />Nuevo
              </button>
            </div>
            @for (recipe of recipesOf(category.id.value); track recipe.id.value) {
              <button
                type="button"
                class="flex min-h-11 w-full flex-col items-start gap-1 rounded-lg bg-surface-sunken px-4 py-2 text-left font-body text-body hover:bg-surface-card focus-visible:shadow-focus focus-visible:outline-none"
                (click)="openEditForm(recipe)"
              >
                <span>{{ recipe.name }}</span>
                @if (flavorLabelOf(recipe) || portionsLabelOf(recipe) || moldLabelOf(recipe)) {
                  <div class="flex flex-wrap gap-1.5">
                    @if (flavorLabelOf(recipe); as flavor) {
                      <migo-badge size="xs">Sabor: {{ flavor }}</migo-badge>
                    }
                    @if (portionsLabelOf(recipe); as portions) {
                      <migo-badge size="xs">Porciones: {{ portions }}</migo-badge>
                    }
                    @if (moldLabelOf(recipe); as mold) {
                      <migo-badge size="xs">Molde: {{ mold }}</migo-badge>
                    }
                  </div>
                }
              </button>
            } @empty {
              <p class="m-0 text-muted text-sm">Aún no hay recetas aquí.</p>
            }
          </section>
        }

        <button migo-button variant="primary" size="md" class="self-start" (click)="openSupplies()">
          <migo-icon icon-leading name="mat:layers" size="sm" />
          <migo-spacer />Insumos
        </button>
      </div>
    }
  `,
})
export class RecipeBook3d implements AfterViewInit, OnDestroy {
  /** Emitido al cerrar la experiencia (volver a la cocina). */
  readonly closed = output<void>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);

  protected readonly webglSupported = signal(detectWebgl());
  protected readonly indexOpen = signal(false);
  protected readonly announce = signal('');

  protected readonly catalog = signal<RecipeBookCatalog | null>(null);

  private readonly spread = signal<BookSpread | null>(null);
  protected readonly canPrev = computed(() => this.spread()?.canPrev ?? false);
  protected readonly canNext = computed(() => this.spread()?.canNext ?? false);

  /**
   * Id de la CATEGORÍA de la página actual (para agregar receta ahí). Es `null` en
   * la portada y en la sección de Insumos.
   */
  protected readonly currentSection = computed<string | null>(() => {
    const s = this.spread();
    const section = s?.right?.section ?? s?.left?.section ?? null;
    return section && section !== INGREDIENTS_SECTION ? section : null;
  });

  /** `true` si la página actual es la sección de Insumos. */
  protected readonly onSupplies = computed<boolean>(() => {
    const s = this.spread();
    return (s?.right?.section ?? s?.left?.section) === INGREDIENTS_SECTION;
  });

  /** Nombre de la categoría de la página actual (para el botón «Nuevo …»). */
  protected readonly categoryName = computed<string>(() => {
    const id = this.currentSection();
    return this.catalog()?.categories.find((c) => c.id.value === id)?.name ?? '';
  });

  /** Receta mostrada en la página izquierda del spread (o `null`). */
  protected readonly leftRecipe = computed<Recipe | null>(() =>
    this.recipeOfPage(this.spread()?.left),
  );
  /** Receta mostrada en la página derecha del spread / la única en single (o `null`). */
  protected readonly rightRecipe = computed<Recipe | null>(() =>
    this.recipeOfPage(this.spread()?.right),
  );

  /** La receta de la página actual: derecha con prioridad, luego izquierda (para el atajo de teclado). */
  protected readonly currentRecipe = computed<Recipe | null>(
    () => this.rightRecipe() ?? this.leftRecipe(),
  );

  /** Resuelve la receta del catálogo que corresponde a una cara de página (por categoría + título). */
  private recipeOfPage(page: PageContent | null | undefined): Recipe | null {
    const catalog = this.catalog();
    if (
      !catalog ||
      !page ||
      page.kind !== 'recipe' ||
      !page.section ||
      page.section === INGREDIENTS_SECTION ||
      !page.title
    ) {
      return null;
    }
    return (
      catalog.recipes.find((r) => r.categoryId.value === page.section && r.name === page.title) ??
      null
    );
  }

  private readonly suppliesById = computed(
    () => new Map<string, Supply>((this.catalog()?.supplies ?? []).map((s) => [s.id.value, s])),
  );
  /** Insumos del catálogo (los pasa el overlay para resolver nombres). */
  protected readonly supplyEntities = computed<readonly Supply[]>(
    () => this.catalog()?.supplies ?? [],
  );

  private readonly flavorsById = computed(
    () =>
      new Map<string, RecipeFlavor>((this.catalog()?.flavors ?? []).map((f) => [f.id.value, f])),
  );
  /** Sabores del catálogo (los pasa el overlay para resolver el label). */
  protected readonly flavorEntities = computed<readonly RecipeFlavor[]>(
    () => this.catalog()?.flavors ?? [],
  );

  /** Label del sabor de la receta, o `null` si no tiene. */
  protected flavorLabelOf(recipe: Recipe): string | null {
    return recipe.flavorId ? (this.flavorsById().get(recipe.flavorId.value)?.label ?? null) : null;
  }

  private readonly capacitiesById = computed(
    () =>
      new Map<string, RecipeCapacity>(
        (this.catalog()?.recipeCapacities ?? []).map((c) => [c.id.value, c]),
      ),
  );
  /** Capacidades del catálogo (las pasa el overlay para resolver el label). */
  protected readonly capacityEntities = computed<readonly RecipeCapacity[]>(
    () => this.catalog()?.recipeCapacities ?? [],
  );

  private capacityLabelById(id: EntityId | null): string | null {
    return id ? (this.capacitiesById().get(id.value)?.label ?? null) : null;
  }

  /** Label de la capacidad por porciones de la receta, o `null` si no tiene. */
  protected portionsLabelOf(recipe: Recipe): string | null {
    return this.capacityLabelById(recipe.portionsCapacityId);
  }

  /** Label de la capacidad por molde de la receta, o `null` si no tiene. */
  protected moldLabelOf(recipe: Recipe): string | null {
    return this.capacityLabelById(recipe.moldCapacityId);
  }

  /** Overlays DOM a pintar sobre las hojas de receta visibles (vacío durante el volteo). */
  protected readonly overlays = signal<RecipeOverlayView[]>([]);

  private readonly _indexEntries = signal<IndexEntry[]>([]);
  protected readonly indexEntries = this._indexEntries.asReadonly();

  private engine: BookEngine | null = null;
  /** `true` mientras un formulario/diálogo está abierto (bloquea el teclado del libro). */
  private dialogOpen = false;
  private readonly reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  ngAfterViewInit(): void {
    if (!this.webglSupported()) {
      void this.load(); // pobla el catálogo para el fallback DOM
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }
    try {
      this.engine = new BookEngine(canvas, this.reducedMotion);
      this.engine.onSpreadChange((s) => this.onSpread(s));
      void this.load();
    } catch {
      this.engine = null;
      this.webglSupported.set(false);
      void this.load();
    }
  }

  ngOnDestroy(): void {
    this.engine?.dispose();
  }

  // No bloquea: el motor encola los volteos y acelera el que esté en curso, así
  // pulsar rápido pasa varias hojas seguidas (como un libro real). Al voltear se ocultan los
  // overlays (para ver la hoja 3D animarse); se repueblan al asentar el spread (`onSpread`).
  protected next(): void {
    this.overlays.set([]);
    this.engine?.next();
  }

  protected prev(): void {
    this.overlays.set([]);
    this.engine?.prev();
  }

  // --- Gesto en el CANVAS (páginas sin overlay: portada, secciones, Insumos): pasar página ---
  private swipeStart: { x: number; y: number } | null = null;
  /** Distancia horizontal mínima (px) para contar como deslizamiento, no clic. */
  private static readonly SWIPE_THRESHOLD = 40;

  protected onSwipeStart(event: PointerEvent): void {
    this.swipeStart = { x: event.clientX, y: event.clientY };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  protected onSwipeEnd(event: PointerEvent): void {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Deslizamiento horizontal: izquierda → siguiente, derecha → anterior.
    if (Math.abs(dx) >= RecipeBook3d.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? this.next() : this.prev();
      return;
    }
    // Clic de ratón sin arrastrar: pasa página según la mitad pulsada.
    if (event.pointerType === 'mouse' && Math.hypot(dx, dy) < RecipeBook3d.SWIPE_THRESHOLD) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      event.clientX > rect.left + rect.width / 2 ? this.next() : this.prev();
    }
  }

  /** Deslizamiento horizontal detectado dentro de un overlay de receta → pasar página. */
  protected onOverlaySwipe(dir: 'next' | 'prev'): void {
    dir === 'next' ? this.next() : this.prev();
  }

  /** Recalcula los overlays de receta visibles (receta + su caja en pantalla). En reposo. */
  private refreshOverlays(): void {
    const engine = this.engine;
    if (!engine) {
      this.overlays.set([]);
      return;
    }
    const views: RecipeOverlayView[] = [];
    for (const side of ['left', 'right'] as const) {
      const recipe = side === 'left' ? this.leftRecipe() : this.rightRecipe();
      if (!recipe) {
        continue;
      }
      const rect = engine.getPageRect(side);
      if (rect) {
        views.push({ side, recipe, rect });
      }
    }
    this.overlays.set(views);
  }

  protected jump(faceIndex: number): void {
    this.overlays.set([]);
    this.engine?.jumpToFace(faceIndex);
    this.indexOpen.set(false);
  }

  protected toggleIndex(): void {
    this.indexOpen.update((v) => !v);
  }

  protected close(): void {
    this.closed.emit();
  }

  // --- Recetas ---

  /** Recetas de una categoría (para el fallback DOM). */
  protected recipesOf(categoryId: string): Recipe[] {
    return (this.catalog()?.recipes ?? [])
      .filter((r) => r.categoryId.value === categoryId)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /** Abre el formulario de crear una receta en la categoría dada. */
  protected openNewForm(categoryId: string): void {
    const catalog = this.catalog();
    const category = catalog?.categories.find((c) => c.id.value === categoryId);
    if (!catalog || !category) {
      return;
    }
    this.openForm({
      category: { id: category.id.value, name: category.name },
      supplies: catalog.supplies,
      flavors: catalog.flavors,
      capacities: catalog.recipeCapacities,
    });
  }

  /** Edita la receta de la página actual (el botón está deshabilitado si no hay ninguna). */
  protected editCurrent(): void {
    const recipe = this.currentRecipe();
    if (recipe) {
      this.openEditForm(recipe);
    }
  }

  /** Abre el formulario de editar la receta dada. */
  protected openEditForm(recipe: Recipe): void {
    const catalog = this.catalog();
    const category = catalog?.categories.find((c) => c.id.value === recipe.categoryId.value);
    if (!catalog || !category) {
      return;
    }
    this.openForm({
      category: { id: category.id.value, name: category.name },
      supplies: catalog.supplies,
      flavors: catalog.flavors,
      capacities: catalog.recipeCapacities,
      recipe: {
        id: recipe.id.value,
        name: recipe.name,
        lines: this.prefillLines(recipe),
        flavorLabel: this.flavorLabelOf(recipe),
        portionsLabel: this.portionsLabelOf(recipe),
        moldLabel: this.moldLabelOf(recipe),
      },
    });
  }

  private openForm(data: RecipeFormData): void {
    if (this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    const ref = this.dialog.open<RecipeFormResult, RecipeFormData, RecipeForm>(RecipeForm, {
      ariaLabel: data.recipe ? 'Editar receta' : 'Nueva receta',
      width: '640px',
      data,
    });
    ref.closed.subscribe((result) => {
      this.dialogOpen = false;
      if (result) {
        void this.load({ categoryId: result.categoryId, recipeName: result.name });
      }
    });
  }

  /** Abre el diálogo de gestión de Insumos. */
  protected openSupplies(): void {
    const catalog = this.catalog();
    if (!catalog || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    const ref = this.dialog.open<boolean, SuppliesDialogData, SuppliesDialog>(SuppliesDialog, {
      ariaLabel: 'Insumos',
      width: '640px',
      data: { supplies: catalog.supplies },
    });
    ref.closed.subscribe((changed) => {
      this.dialogOpen = false;
      if (changed) {
        void this.load({ supplies: true });
      }
    });
  }

  private prefillLines(recipe: Recipe): InitialLine[] {
    const byId = this.suppliesById();
    return recipe.ingredients.map((ingredient) => {
      const supply = byId.get(ingredient.supplyId.value);
      return {
        supplyId: ingredient.supplyId.value,
        name: supply?.name ?? '—',
        quantity: ingredient.quantity.value,
        baseUnit: ingredient.quantity.unit,
      };
    });
  }

  protected onResize(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.engine?.resize(canvas.clientWidth, canvas.clientHeight);
      this.refreshOverlays(); // la caja de la hoja cambió → recolocar los overlays
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.dialogOpen) {
      return; // el diálogo abierto gestiona su propio teclado
    }
    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        void this.next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        void this.prev();
        break;
      case 'Home':
        event.preventDefault();
        this.overlays.set([]);
        this.engine?.home();
        break;
      case 'End':
        event.preventDefault();
        this.overlays.set([]);
        this.engine?.end();
        break;
      case 'Escape':
        if (this.indexOpen()) {
          this.indexOpen.set(false);
        } else {
          this.close();
        }
        break;
      case 'e':
      case 'E':
        // Atajo de accesibilidad: editar la receta de la página actual (el chip 3D no es focusable).
        if (this.currentRecipe()) {
          event.preventDefault();
          this.editCurrent();
        }
        break;
    }
  }

  private async load(focus?: BookFocus): Promise<void> {
    const catalog = await this.listRecipeBook.execute();
    this.catalog.set(catalog);
    const pages = toPages(catalog);
    this._indexEntries.set(buildIndex(catalog, pages));
    // Tras cerrar un formulario/diálogo salta a lo último que se tocó (receta/categoría/insumos);
    // si no hay foco, conserva la cara actual (no volver al inicio).
    const target = focus ? resolveFace(pages, focus) : -1;
    const face = target >= 0 ? target : (this.engine?.currentFaceIndex ?? 0);
    this.engine?.setPages(pages);
    if (face > 0) {
      this.engine?.jumpToFace(face);
    }
  }

  private onSpread(spread: BookSpread): void {
    this.spread.set(spread);
    this.announce.set(describe(spread));
    this.refreshOverlays(); // spread asentado → (re)colocar los overlays de receta
  }
}

/**
 * Cara a la que saltar tras cerrar un formulario: la receta recién guardada (su 1ª
 * cara), o el divisor de su categoría, o la 1ª cara de Insumos. `-1` si no se resuelve.
 */
function resolveFace(pages: PageContent[], focus: BookFocus): number {
  if (focus.supplies) {
    return pages.findIndex((p) => p.section === INGREDIENTS_SECTION && p.kind === 'recipe');
  }
  if (focus.recipeName && focus.categoryId) {
    const i = pages.findIndex(
      (p) =>
        p.kind === 'recipe' &&
        !p.continued &&
        p.section === focus.categoryId &&
        p.title === focus.recipeName,
    );
    if (i >= 0) {
      return i;
    }
  }
  if (focus.categoryId) {
    return pages.findIndex((p) => p.kind === 'section' && p.section === focus.categoryId);
  }
  return -1;
}

/**
 * Construye el índice: un rótulo por **categoría** del catálogo (Queques, Rellenos, Coberturas…) y
 * un salto por cada una de sus **recetas**. Insumos **nunca** entra.
 *
 * Qué es indexable lo decide el CATÁLOGO, no la pinta de la página: el contenido de una receta lo
 * dibuja un overlay DOM, así que su `PageContent` no trae `rows` ni `chips` y no se puede inferir
 * de ahí. Se recorren las páginas una sola vez (en orden) para resolver la cara de cada entrada, y
 * solo se acepta una cara de receta cuyo título sea una receta real de esa categoría — así la hoja
 * de relleno de una categoría vacía («Aún no tienes nada aquí.») queda fuera.
 */
function buildIndex(catalog: RecipeBookCatalog, pages: PageContent[]): IndexEntry[] {
  const recipeNamesByCategory = new Map<string, Set<string>>(
    catalog.categories.map((category) => [
      category.id.value,
      new Set(
        catalog.recipes.filter((r) => r.categoryId.value === category.id.value).map((r) => r.name),
      ),
    ]),
  );

  const entries: IndexEntry[] = [];
  pages.forEach((page, faceIndex) => {
    const section = page.section;
    // Insumos (y cualquier sección que no sea una categoría del catálogo) nunca va en el índice.
    if (!section || !recipeNamesByCategory.has(section)) {
      return;
    }
    if (page.continued) {
      return; // las hojas de continuación no se listan aparte
    }
    if (page.kind === 'section') {
      entries.push({ label: page.title ?? '', faceIndex, section: true });
    } else if (
      page.kind === 'recipe' &&
      page.title &&
      recipeNamesByCategory.get(section)!.has(page.title)
    ) {
      entries.push({ label: page.title, faceIndex, section: false });
    }
  });
  return entries;
}

/** Texto accesible que describe el spread visible (para `aria-live`). */
function describe(spread: BookSpread): string {
  const parts: string[] = [];
  for (const page of [spread.left, spread.right]) {
    if (!page || page.kind === 'blank' || page.kind === 'cover') {
      continue;
    }
    const bits = [page.title, page.subtitle, page.chips?.join(', ')].filter(Boolean);
    if (page.rows?.length) {
      bits.push(page.rows.map((r) => r.cells.join(' ')).join('; '));
    }
    parts.push(bits.join('. '));
  }
  return parts.join('. ') || 'Portada';
}

/** Prueba ligera de soporte WebGL sin tocar el canvas real. */
function detectWebgl(): boolean {
  try {
    const probe = document.createElement('canvas');
    return !!(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}
