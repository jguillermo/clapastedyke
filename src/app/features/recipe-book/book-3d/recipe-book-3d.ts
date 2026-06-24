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
import { RecipeBook, type RecipeBookData, type RecipeBookTab } from '../recipe-book';
import { toPages } from './recipe-page-projector';

/** Sustantivo por sección para el botón "Agregar …". */
const SECTION_NOUN: Record<RecipeBookTab, string> = {
  sponges: 'queque',
  fillings: 'relleno',
  coverings: 'cobertura',
  ingredients: 'insumo',
};

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
      <canvas #canvas class="block h-full w-full" aria-hidden="true"></canvas>

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
            class="shadow-md"
            [disabled]="!canPrev()"
            (click)="prev()"
            aria-label="Página anterior"
          >
            <migo-icon icon-leading name="mat:chevron_right" size="md" class="rotate-180" />
          </button>

          <span
            class="min-w-0 flex-1 truncate rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-center font-body text-sm text-body shadow-md"
          >
            {{ pageLabel() }}
          </span>

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
        </div>

        <div class="flex w-full flex-wrap items-center justify-center gap-3">
          <button migo-button variant="ghost" size="md" class="shadow-sm" (click)="toggleIndex()">
            <migo-icon icon-leading name="mat:layers" size="sm" />
            Índice
          </button>
          @if (currentSection(); as sec) {
            <button migo-button variant="secondary" size="md" class="shadow-md" (click)="editHere(sec)">
              <migo-icon icon-leading name="mat:edit" size="sm" />
              Editar
            </button>
            <button migo-button variant="primary" size="md" class="shadow-md" (click)="addHere(sec)">
              <migo-icon icon-leading name="mat:add" size="sm" />
              {{ addLabel() }}
            </button>
          } @else {
            <button migo-button variant="primary" size="md" class="shadow-md" (click)="manage()">
              <migo-icon icon-leading name="mat:edit" size="sm" />
              Gestionar
            </button>
          }
        </div>
      </nav>

      <!-- Índice (salto rápido) -->
      @if (indexOpen()) {
        <div
          class="absolute inset-x-4 bottom-32 mx-auto max-h-96 max-w-md overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-3 shadow-lg"
          role="menu"
          aria-label="Índice de recetas"
        >
          @for (entry of indexEntries(); track entry.faceIndex) {
            <button
              type="button"
              role="menuitem"
              class="block min-h-11 w-full rounded-xl px-4 py-2 text-left font-body text-sm hover:bg-surface-sunken focus-visible:shadow-focus focus-visible:outline-none"
              [class.font-bold]="entry.section"
              [class.text-heading]="entry.section"
              [class.text-body]="!entry.section"
              (click)="jump(entry.faceIndex)"
            >
              {{ entry.label }}
            </button>
          }
        </div>
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
  protected readonly pageLabel = computed(() => {
    const s = this.spread();
    return s?.right?.title ?? s?.left?.title ?? 'Recetario';
  });

  /** Sección visible en el spread actual (para abrir el editor donde corresponde). */
  protected readonly currentSection = computed<RecipeBookTab | null>(() => {
    const s = this.spread();
    return ((s?.right?.section ?? s?.left?.section) as RecipeBookTab | undefined) ?? null;
  });

  protected readonly addLabel = computed(() => {
    const sec = this.currentSection();
    return sec ? `Agregar ${SECTION_NOUN[sec]}` : '';
  });

  private readonly _indexEntries = signal<IndexEntry[]>([]);
  protected readonly indexEntries = this._indexEntries.asReadonly();

  private engine: BookEngine | null = null;
  private dialogRef: MigoDialogRef<unknown, RecipeBook> | null = null;
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

  protected jump(faceIndex: number): void {
    this.engine?.goToLeaf(Math.ceil(faceIndex / 2));
    this.indexOpen.set(false);
  }

  protected toggleIndex(): void {
    this.indexOpen.update((v) => !v);
  }

  protected manage(): void {
    this.openManage(false);
  }

  /** Editar la sección de la página actual (abre el modal en su pestaña). */
  protected editHere(section: RecipeBookTab): void {
    this.openManage(false, { tab: section });
  }

  /** Agregar en la sección de la página actual (abre el modal listo para crear). */
  protected addHere(section: RecipeBookTab): void {
    this.openManage(false, { tab: section, add: true });
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
        this.engine?.goToLeaf(0);
        break;
      case 'End':
        event.preventDefault();
        this.engine?.goToLeaf(Number.MAX_SAFE_INTEGER);
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

  private async load(): Promise<void> {
    const catalog = await this.listRecipeBook.execute();
    const pages = toPages(catalog);
    this._indexEntries.set(buildIndex(pages));
    // Conserva la hoja actual al recargar (p. ej. tras cerrar el editor): no volver al inicio.
    const keepLeaf = this.engine?.spread.leafIndex ?? 0;
    this.engine?.setPages(pages);
    if (keepLeaf > 0) {
      this.engine?.goToLeaf(keepLeaf);
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
    this.dialogRef = this.dialog.open<unknown, RecipeBookData, RecipeBook>(RecipeBook, {
      ariaLabel: 'Mi libro de recetas',
      width: '560px',
      data,
    });
    this.dialogRef.closed.subscribe(() => {
      this.dialogRef = null;
      if (asFallback) {
        this.closed.emit();
      } else {
        void this.load(); // reflejar cambios hechos en el hub
      }
    });
  }
}

/** Construye el índice (secciones + recetas) a partir de las páginas. */
function buildIndex(pages: PageContent[]): IndexEntry[] {
  const entries: IndexEntry[] = [];
  pages.forEach((page, faceIndex) => {
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
