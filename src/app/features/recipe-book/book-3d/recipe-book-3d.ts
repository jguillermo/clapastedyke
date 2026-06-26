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
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { BookEngine, type BookSpread } from '@platform/three/book/book-engine';
import type { PageContent } from '@platform/three/book/page-content';
import { RecipeBook, type RecipeBookData, type RecipeBookResult } from '../recipe-book';
import { INGREDIENTS_SECTION, toPages } from './recipe-page-projector';

/** Una entrada del índice (salto rápido a una página). */
interface IndexEntry {
  readonly label: string;
  readonly faceIndex: number;
  readonly section: boolean;
}

/**
 * Experiencia de LECTURA a pantalla completa: el libro de recetas renderizado en
 * 3D ({@link BookEngine}) con páginas que se pasan con curvatura realista. Inyecta
 * solo el use case `ListRecipeBook` y proyecta el catálogo a páginas agnósticas.
 *
 * Crear/editar **no** ocurre aquí: el botón «Gestionar» abre el hub DOM
 * {@link RecipeBook} (toda la lógica de CRUD ya vive ahí); al cerrarlo se recarga
 * el libro. Sin WebGL, este componente abre directamente ese hub como ruta
 * accesible. Navegación por teclado y región `aria-live` para lectores.
 */
@Component({
  selector: 'app-recipe-book-3d',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
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
        (pointercancel)="onSwipeCancel()"
      ></canvas>

      <!-- Cerrar / volver a la cocina -->
      <button
        migo-button
        variant="secondary"
        size="md"
        class="absolute left-4 top-4 shadow-md"
        (click)="close()"
      >
        <migo-icon icon-leading name="mat:arrow_back" size="sm" />
        Volver
      </button>

      <!-- Título del libro -->
      <header
        class="absolute right-4 top-4 rounded-full border border-border-subtle bg-surface-card px-4 py-2 shadow-md"
      >
        <span class="font-display text-heading text-sm">Mi libro de recetas</span>
      </header>

      <!-- Anuncio para lectores de pantalla (el texto 3D no es accesible) -->
      <p class="absolute h-px w-px overflow-hidden whitespace-nowrap" role="status" aria-live="polite">
        {{ announce() }}
      </p>

      <!-- Controles inferiores -->
      <nav
        class="absolute bottom-5 left-1/2 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-4"
        aria-label="Páginas del libro"
      >
        <div class="flex w-full items-center justify-center gap-3">
          <button
            migo-button
            variant="secondary"
            size="md"
            class="flex-1 justify-center shadow-md"
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
            class="min-w-0 flex-auto justify-center shadow-md"
            aria-label="Índice"
            (click)="toggleIndex()"
          >
            <migo-icon icon-leading name="mat:layers" size="sm" />
            Índice
          </button>

          <button
            migo-button
            variant="secondary"
            size="md"
            class="flex-1 justify-center shadow-md"
            [disabled]="!canNext()"
            (click)="next()"
            aria-label="Página siguiente"
          >
            <migo-icon icon-leading name="mat:chevron_right" size="md" />
          </button>
        </div>

        <div class="flex w-full items-center justify-center gap-3">
          @if (currentSection(); as sec) {
            <button
              migo-button
              variant="secondary"
              size="md"
              class="shadow-md"
              aria-label="Editar"
              (click)="editHere(sec)"
            >
              <migo-icon icon-leading name="mat:edit" size="sm" />
              <span class="hidden sm:inline">Editar</span>
            </button>
            <button
              migo-button
              variant="primary"
              size="md"
              class="shadow-md"
              [attr.aria-label]="addLabel"
              (click)="addHere(sec)"
            >
              <migo-icon icon-leading name="mat:add" size="sm" />
              <span class="hidden sm:inline">{{ addLabel }}</span>
            </button>
          } @else {
            <button
              migo-button
              variant="primary"
              size="md"
              class="shadow-md"
              aria-label="Gestionar"
              (click)="manage()"
            >
              <migo-icon icon-leading name="mat:edit" size="sm" />
              <span class="hidden sm:inline">Gestionar</span>
            </button>
          }
        </div>
      </nav>

      <!-- Índice: panel lateral izquierdo (full-bleed en móvil, columna fija en sm+) -->
      @if (indexOpen()) {
        <nav
          class="absolute inset-y-0 left-0 z-50 flex w-full sm:w-80 flex-col bg-surface-card border-e border-border-subtle shadow-lg"
          aria-label="Índice de recetas"
        >
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle">
            <span class="font-display text-heading text-sm">Índice</span>
            <button migo-button variant="ghost" size="sm" type="button" aria-label="Cerrar índice" (click)="toggleIndex()">
              <migo-icon icon-leading name="mat:close" size="sm" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            @for (entry of indexEntries(); track entry.faceIndex) {
              @if (entry.section) {
                <p class="m-0 mt-3 mb-1 px-2 font-display text-heading text-sm first:mt-0">{{ entry.label }}</p>
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

  private readonly spread = signal<BookSpread | null>(null);
  protected readonly canPrev = computed(() => this.spread()?.canPrev ?? false);
  protected readonly canNext = computed(() => this.spread()?.canNext ?? false);

  /**
   * Id de la CATEGORÍA de la página actual (para editar/agregar receta ahí). Es
   * `null` en la portada y en la sección de Insumos (entonces se ofrece "Gestionar").
   */
  protected readonly currentSection = computed<string | null>(() => {
    const s = this.spread();
    const section = s?.right?.section ?? s?.left?.section ?? null;
    return section && section !== INGREDIENTS_SECTION ? section : null;
  });

  protected readonly addLabel = 'Agregar receta';

  private readonly _indexEntries = signal<IndexEntry[]>([]);
  protected readonly indexEntries = this._indexEntries.asReadonly();

  private engine: BookEngine | null = null;
  private dialogRef: MigoDialogRef<RecipeBookResult, RecipeBook> | null = null;
  private readonly reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  ngAfterViewInit(): void {
    if (!this.webglSupported()) {
      this.openManage(true);
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
      this.openManage(true);
    }
  }

  ngOnDestroy(): void {
    this.engine?.dispose();
  }

  // No bloquea: el motor encola los volteos y acelera el que esté en curso, así
  // pulsar rápido pasa varias hojas seguidas (como un libro real).
  protected next(): void {
    this.engine?.next();
  }

  protected prev(): void {
    this.engine?.prev();
  }

  // --- Navegación sobre la hoja: deslizar (touch/ratón) o clic (ratón) ---
  private swipeStart: { x: number; y: number } | null = null;
  /** Distancia mínima horizontal (px) para contar como deslizamiento, no toque/clic. */
  private static readonly SWIPE_THRESHOLD = 40;

  protected onSwipeStart(event: PointerEvent): void {
    this.swipeStart = { x: event.clientX, y: event.clientY };
    // Captura el puntero para recibir el `up` aunque el dedo/cursor salga del canvas.
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
    const horizontalSwipe =
      Math.abs(dx) >= RecipeBook3d.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy);

    if (horizontalSwipe) {
      // Deslizamiento (touch o arrastre de ratón): izquierda → siguiente, derecha → anterior.
      dx < 0 ? this.next() : this.prev();
      return;
    }

    // Sin deslizamiento: con RATÓN, un clic pasa página según la mitad pulsada
    // (derecha → siguiente, izquierda → anterior). En touch un toque no hace nada.
    if (event.pointerType === 'mouse') {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      event.clientX > rect.left + rect.width / 2 ? this.next() : this.prev();
    }
  }

  protected onSwipeCancel(): void {
    this.swipeStart = null;
  }

  protected jump(faceIndex: number): void {
    this.engine?.jumpToFace(faceIndex);
    this.indexOpen.set(false);
  }

  protected toggleIndex(): void {
    this.indexOpen.update((v) => !v);
  }

  protected manage(): void {
    this.openManage(false);
  }

  /** Editar la categoría de la página actual (abre el hub en esa categoría). */
  protected editHere(categoryId: string): void {
    this.openManage(false, { categoryId });
  }

  /** Agregar receta en la categoría de la página actual (abre el hub listo para crear). */
  protected addHere(categoryId: string): void {
    this.openManage(false, { categoryId, add: true });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onResize(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.engine?.resize(canvas.clientWidth, canvas.clientHeight);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.dialogRef) {
      return; // el hub DOM gestiona su propio teclado
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
        this.engine?.home();
        break;
      case 'End':
        event.preventDefault();
        this.engine?.end();
        break;
      case 'Escape':
        if (this.indexOpen()) {
          this.indexOpen.set(false);
        } else {
          this.close();
        }
        break;
    }
  }

  private async load(focus?: RecipeBookResult): Promise<void> {
    const catalog = await this.listRecipeBook.execute();
    const pages = toPages(catalog);
    this._indexEntries.set(buildIndex(pages));
    // Tras cerrar el hub salta a lo último que se tocó (receta/categoría/insumos);
    // si no hay foco, conserva la cara actual (no volver al inicio). El ancla por
    // cara funciona en ambos modos (spread y single).
    const target = focus ? resolveFace(pages, focus) : -1;
    const face = target >= 0 ? target : this.engine?.currentFaceIndex ?? 0;
    this.engine?.setPages(pages);
    if (face > 0) {
      this.engine?.jumpToFace(face);
    }
  }

  private onSpread(spread: BookSpread): void {
    this.spread.set(spread);
    this.announce.set(describe(spread));
  }

  /** Abre el hub DOM (CRUD). Si `asFallback`, al cerrarlo se sale de la experiencia. */
  private openManage(asFallback: boolean, data?: RecipeBookData): void {
    if (this.dialogRef) {
      return;
    }
    // Modal responsivo normal: tarjeta centrada en desktop, pantalla completa en móvil.
    this.dialogRef = this.dialog.open<RecipeBookResult, RecipeBookData, RecipeBook>(RecipeBook, {
      ariaLabel: 'Mi libro de recetas',
      width: '560px',
      data,
    });
    this.dialogRef.closed.subscribe((result) => {
      this.dialogRef = null;
      if (asFallback) {
        this.closed.emit();
      } else {
        void this.load(result ?? undefined); // reflejar y saltar a lo tocado
      }
    });
  }
}

/**
 * Cara a la que saltar tras cerrar el hub: la receta recién guardada (su 1ª cara),
 * o el divisor de su categoría, o la 1ª cara de Insumos. `-1` si no se resuelve.
 */
function resolveFace(pages: PageContent[], focus: RecipeBookResult): number {
  if (focus.ingredients) {
    return pages.findIndex((p) => p.section === INGREDIENTS_SECTION && p.kind === 'recipe');
  }
  if (focus.recipeName && focus.categoryId) {
    const i = pages.findIndex(
      (p) => p.kind === 'recipe' && !p.continued && p.section === focus.categoryId && p.title === focus.recipeName,
    );
    if (i >= 0) return i;
  }
  if (focus.categoryId) {
    return pages.findIndex((p) => p.kind === 'section' && p.section === focus.categoryId);
  }
  return -1;
}

/** Construye el índice (categorías + recetas) a partir de las páginas. Excluye Insumos. */
function buildIndex(pages: PageContent[]): IndexEntry[] {
  const entries: IndexEntry[] = [];
  pages.forEach((page, faceIndex) => {
    if (page.section === INGREDIENTS_SECTION) {
      return; // Insumos nunca va en el índice
    }
    if (page.continued) {
      return; // las hojas de continuación no se listan aparte
    }
    if (page.kind === 'section') {
      entries.push({ label: page.title ?? '', faceIndex, section: true });
    } else if (page.kind === 'recipe' && page.title && (page.rows?.length || page.chips?.length)) {
      // Las hojas vacías de sección (solo título) no entran al índice: ya está su divisor.
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
