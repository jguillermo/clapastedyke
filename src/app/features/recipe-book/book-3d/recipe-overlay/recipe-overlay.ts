import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { Badge } from '@components/badge/badge';
import {
  PreviewRecipeCost,
  type PreviewRecipeCostResult,
} from '@core/recipe-book/application/use-cases/preview-recipe-cost.use-case';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { RecipeFlavor } from '@core/recipe-book/domain/entities/recipe-flavor';
import type { RecipeCapacity } from '@core/recipe-book/domain/entities/recipe-capacity';
import { formatQuantity } from '../../_shared/recipe-format';

/** Caja en pantalla (px de viewport) donde va el overlay: la cara de la receta en el libro. */
export interface OverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LineView {
  name: string;
  quantity: string;
  price: string;
}

const EMPTY_COST: PreviewRecipeCostResult = { items: [], total: '' };

/**
 * Umbrales (px de scroll) para encoger el título, con histéresis: encoge pasados 12px y solo
 * vuelve a crecer por debajo de 4px. La franja muerta evita el parpadeo en listas que apenas
 * desbordan: al encogerse la cabecera el cuerpo crece, el navegador recorta `scrollTop` al nuevo
 * máximo y, con un único umbral, eso podría devolverlo por debajo y oscilar sin parar.
 */
const SHRINK_ON_PX = 12;
const SHRINK_OFF_PX = 4;

/**
 * Overlay DOM del contenido de una receta, colocado sobre la hoja del libro 3D. El **título** (con
 * su botón de editar) es lo **único fijo** arriba, y **se encoge al scrollear** para devolverle
 * espacio a la lista. Todo lo demás —características, ingredientes y, a futuro, preparación e
 * imágenes— **scrollea de forma nativa** (rápido, con inercia): las características describen la
 * receta, no son cabecera, así que acompañan a la lista. Un botón de editar emite `edit`. Es
 * presentacional: recibe la receta y el catálogo de insumos ya cargados; no inyecta nada de dominio.
 */
@Component({
  selector: 'app-recipe-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Badge],
  host: {
    // Caja fija sobre la hoja; por debajo de la barra inferior/flotantes (z-30) para no taparlos.
    // Fondo TRANSPARENTE: se ve la hoja real del libro 3D detrás (su degradado/sombra reales).
    class: 'fixed z-20 flex flex-col overflow-hidden text-body',
    '[style.left.px]': 'rect().x',
    '[style.top.px]': 'rect().y',
    '[style.width.px]': 'rect().width',
    '[style.height.px]': 'rect().height',
    '(pointerdown)': 'onDown($event)',
    '(pointerup)': 'onUp($event)',
  },
  template: `
    <!-- Título FIJO: el ÚNICO bloque que no scrollea (nombre + editar + su subrayado). Serif
         grande tipo recetario que se ENCOGE al empezar a scrollear, para devolverle a la lista el
         espacio que ocupa. Las características NO viven aquí: scrollean con la lista. -->
    <header [class]="headerClasses()">
      <div class="flex items-start justify-between gap-4">
        <h2 [class]="titleClasses()">{{ recipe().name }}</h2>
        <button
          migo-button
          variant="ghost"
          size="sm"
          type="button"
          aria-label="Editar receta"
          (click)="edit.emit()"
        >
          <migo-icon icon-leading name="mat:edit" size="md" />
        </button>
      </div>
    </header>

    <!-- Cuerpo SCROLLEABLE (scroll nativo, sin barra — ver hasMore): cabecera de columnas, filas
         y pie scrollean todos. 3 columnas: Insumo (flexible, NUNCA se recorta — envuelve en varias
         líneas si hace falta) + Cantidad (angosta, fija, protagonista) + Precio (angosta, fija, en
         SEGUNDO PLANO: más chico/atenuado — Insumo y Cantidad son los datos relevantes). -->
    <div class="relative min-h-0 flex-1">
      <div
        #scrollBody
        role="group"
        aria-label="Ingredientes"
        class="absolute inset-0 overflow-y-auto overscroll-contain touch-pan-y scrollbar-hidden px-6 py-4"
        (scroll)="onScroll()"
      >
        <!-- Características: son de la receta, no de la cabecera → scrollean con la lista. -->
        @if (flavorLabel() || portionsLabel() || moldLabel()) {
          <div class="flex flex-wrap gap-1.5 pb-4">
            @if (flavorLabel(); as flavor) {
              <migo-badge size="xs">Sabor: {{ flavor }}</migo-badge>
            }
            @if (portionsLabel(); as portions) {
              <migo-badge size="xs">Porciones: {{ portions }}</migo-badge>
            }
            @if (moldLabel(); as mold) {
              <migo-badge size="xs">Molde: {{ mold }}</migo-badge>
            }
          </div>
        }

        <div
          class="flex items-baseline gap-3 pb-2 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          <span class="flex-1">Insumo</span>
          <span class="w-16 shrink-0 text-right sm:w-20">Cant.</span>
          <span class="w-14 shrink-0 text-right sm:w-16">Precio</span>
        </div>
        <ul class="m-0 p-0 list-none" aria-label="Líneas de insumo">
          @for (line of lines(); track $index) {
            <li class="flex items-start gap-3 border-b border-border-line py-3">
              <span
                class="min-w-0 flex-1 wrap-break-word font-display text-heading text-base sm:text-lead"
                >{{ line.name }}</span
              >
              <span
                class="w-16 shrink-0 whitespace-nowrap text-right font-display font-bold text-heading text-base tabular-nums sm:w-20 sm:text-lead"
                >{{ line.quantity }}</span
              >
              <span
                class="w-14 shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-muted sm:w-16 sm:text-sm"
                >{{ line.price }}</span
              >
            </li>
          }
        </ul>
        <div class="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-brand pt-3">
          <span class="text-sm italic text-muted">{{ lines().length }} insumos</span>
          <span class="flex items-baseline gap-3">
            <span class="font-display text-sm uppercase tracking-wide text-muted">Total</span>
            <span class="font-display font-bold text-heading text-lead tabular-nums">{{
              total()
            }}</span>
          </span>
        </div>
        <!-- Aquí irán, a futuro, secciones de preparación e imágenes (contenido rico). -->
      </div>

      <!-- Sin barra de scroll: la afordancia de "hay más" es solo una flecha tenue, quieta
           (sin animación ni fondo — nada ajeno al recetario). -->
      @if (hasMore()) {
        <div class="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
          <migo-icon name="mat:expand_more" size="md" color="muted" />
        </div>
      }
    </div>
  `,
})
export class RecipeOverlay {
  readonly recipe = input.required<Recipe>();
  readonly supplies = input<readonly Supply[]>([]);
  readonly flavors = input<readonly RecipeFlavor[]>([]);
  readonly capacities = input<readonly RecipeCapacity[]>([]);
  readonly rect = input.required<OverlayRect>();
  readonly edit = output<void>();
  /** Deslizamiento horizontal sobre el overlay → pasar página (el vertical scrollea nativo). */
  readonly swipe = output<'next' | 'prev'>();

  private readonly previewCost = inject(PreviewRecipeCost);

  private static readonly SWIPE_THRESHOLD = 40;
  private start: { x: number; y: number } | null = null;

  private readonly scrollBody = viewChild<ElementRef<HTMLDivElement>>('scrollBody');
  /** Hay más contenido debajo (aún no se llegó al final) → se pinta la flechita, nunca la barra. */
  protected readonly hasMore = signal(false);
  /** El cuerpo ya se desplazó → el título se encoge y cede su espacio a la lista. */
  protected readonly scrolled = signal(false);

  /** Cabecera fija: al scrollear pierde parte de su aire vertical. */
  protected readonly headerClasses = computed(
    () =>
      'mx-6 flex flex-col border-b-2 border-brand transition-all duration-base ease-out motion-reduce:transition-none ' +
      (this.scrolled() ? 'pt-4 pb-2' : 'pt-8 pb-4'),
  );

  /** Título fijo: grande de entrada, compacto al scrollear. */
  protected readonly titleClasses = computed(
    () =>
      'm-0 font-display font-bold text-heading wrap-break-word transition-all duration-base ease-out motion-reduce:transition-none ' +
      (this.scrolled() ? 'text-h4 sm:text-h3' : 'text-h2 sm:text-h1'),
  );

  constructor() {
    // El costo/total se calcula en el negocio (PreviewRecipeCost), nunca aquí — ver memoria
    // `calculos-solo-en-negocio`. Se recalcula cada vez que cambia la receta o el catálogo.
    effect(() => {
      const lines = this.costRequestLines();
      void this.previewCost.execute({ lines }).then((result) => this.costResult.set(result));
    });

    // Nueva receta → arranca scrolleada arriba (nueva página, no donde quedó la anterior).
    effect(() => {
      this.recipe();
      requestAnimationFrame(() => this.resetScroll());
    });

    // El contenido cambia (p.ej. llega el precio calculado) → solo recalcula los indicadores, sin
    // mover el scroll (no interrumpir al usuario si ya está leyendo más abajo).
    effect(() => {
      this.lines();
      requestAnimationFrame(() => this.syncScrollState());
    });
  }

  protected onScroll(): void {
    this.syncScrollState();
  }

  /** Vuelve al inicio del scroll (nueva receta): título grande otra vez y recalcula la flechita. */
  private resetScroll(): void {
    const el = this.scrollBody()?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTop = 0;
    this.syncScrollState();
  }

  /**
   * Deriva del scroll los dos indicadores visuales: si queda contenido por debajo (la flechita) y
   * si ya se desplazó lo bastante como para encoger el título (con la histéresis de arriba).
   */
  private syncScrollState(): void {
    const el = this.scrollBody()?.nativeElement;
    if (!el) {
      this.hasMore.set(false);
      this.scrolled.set(false);
      return;
    }
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.hasMore.set(remaining > 4);
    this.scrolled.update((was) =>
      was ? el.scrollTop > SHRINK_OFF_PX : el.scrollTop > SHRINK_ON_PX,
    );
  }

  protected onDown(event: PointerEvent): void {
    this.start = { x: event.clientX, y: event.clientY };
  }

  protected onUp(event: PointerEvent): void {
    const start = this.start;
    this.start = null;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Solo deslizamiento horizontal claro pasa página; el vertical lo maneja el scroll nativo.
    if (Math.abs(dx) >= RecipeOverlay.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      this.swipe.emit(dx < 0 ? 'next' : 'prev');
    }
  }

  private readonly suppliesById = computed(
    () => new Map<string, Supply>(this.supplies().map((s) => [s.id.value, s])),
  );

  private readonly flavorsById = computed(
    () => new Map<string, RecipeFlavor>(this.flavors().map((f) => [f.id.value, f])),
  );
  /** Label del sabor de la receta (característica bajo el título), o `null` si no tiene. */
  protected readonly flavorLabel = computed<string | null>(() => {
    const id = this.recipe().flavorId;
    return id ? (this.flavorsById().get(id.value)?.label ?? null) : null;
  });

  private readonly capacitiesById = computed(
    () => new Map<string, RecipeCapacity>(this.capacities().map((c) => [c.id.value, c])),
  );
  /** Label de la capacidad por porciones (característica bajo el título), o `null` si no tiene. */
  protected readonly portionsLabel = computed<string | null>(() => {
    const id = this.recipe().portionsCapacityId;
    return id ? (this.capacitiesById().get(id.value)?.label ?? null) : null;
  });
  /** Label de la capacidad por molde (característica bajo el título), o `null` si no tiene. */
  protected readonly moldLabel = computed<string | null>(() => {
    const id = this.recipe().moldCapacityId;
    return id ? (this.capacitiesById().get(id.value)?.label ?? null) : null;
  });

  /** Líneas a costear, en el mismo orden que `recipe().lines` — el use case las devuelve alineadas. */
  private readonly costRequestLines = computed(() => {
    const byId = this.suppliesById();
    return this.recipe().lines.map((line) => {
      const supply = byId.get(line.supplyId.value);
      return {
        purchasePrice: supply
          ? {
              amount: supply.purchasePrice.amount,
              per: { value: supply.purchasePrice.per.value, unit: supply.purchasePrice.per.unit },
            }
          : null,
        quantity: { value: line.quantity.value, unit: line.quantity.unit },
      };
    });
  });

  private readonly costResult = signal<PreviewRecipeCostResult>(EMPTY_COST);
  /** Precio total de la receta (suma de todas las líneas), ya formateado por el negocio. */
  protected readonly total = computed(() => this.costResult().total);

  protected readonly lines = computed<LineView[]>(() => {
    const names = this.suppliesById();
    const costItems = this.costResult().items;
    return this.recipe().lines.map((line, i) => ({
      name: names.get(line.supplyId.value)?.name ?? '—',
      quantity: formatQuantity(line.quantity.value, line.quantity.unit),
      price: costItems[i]?.cost || '—',
    }));
  });
}
