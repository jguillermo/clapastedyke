import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import type { Recipe } from '@core/recipe-book/domain/entities/recipe';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
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
}

/**
 * Overlay DOM del contenido de una receta, colocado sobre la hoja del libro 3D. El **título** queda
 * fijo arriba y el cuerpo (ingredientes; a futuro preparación e imágenes) **scrollea de forma
 * nativa** (rápido, con inercia). Un botón de editar emite `edit`. Es presentacional: recibe la
 * receta y el catálogo de insumos ya cargados; no inyecta nada de dominio.
 */
@Component({
  selector: 'app-recipe-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
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
    <!-- Título FIJO (único bloque fijo: nombre + editar + su subrayado). -->
    <header class="mx-6 flex items-start justify-between gap-3 border-b-2 border-brand pt-6 pb-3">
      <h2 class="m-0 font-display text-heading text-h3">{{ recipe().name }}</h2>
      <button migo-button variant="ghost" size="sm" type="button" aria-label="Editar receta" (click)="edit.emit()">
        <migo-icon icon-leading name="mat:edit" size="sm" />
      </button>
    </header>

    <!-- Cuerpo SCROLLEABLE (scroll nativo): cabecera de columnas, filas y pie scrollean todos. -->
    <div class="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-3">
      <div class="flex items-baseline justify-between gap-3 pb-1 text-caption font-semibold text-muted">
        <span>INSUMO</span><span>CANTIDADes</span>
      </div>
      <ul class="m-0 p-0 list-none">
        @for (line of lines(); track $index) {
          <li class="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2">
            <span class="font-body text-body">{{ line.name }}</span>
            <span class="font-body font-semibold text-heading tabular-nums whitespace-nowrap">{{ line.quantity }}</span>
          </li>
        }
      </ul>
      <p class="mt-3 mb-0 text-right text-caption italic text-muted">{{ lines().length }} insumos</p>
      <!-- Aquí irán, a futuro, secciones de preparación e imágenes (contenido rico). -->
    </div>
  `,
})
export class RecipeOverlay {
  readonly recipe = input.required<Recipe>();
  readonly supplies = input<readonly Supply[]>([]);
  readonly rect = input.required<OverlayRect>();
  readonly edit = output<void>();
  /** Deslizamiento horizontal sobre el overlay → pasar página (el vertical scrollea nativo). */
  readonly swipe = output<'next' | 'prev'>();

  private static readonly SWIPE_THRESHOLD = 40;
  private start: { x: number; y: number } | null = null;

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

  private readonly supplyNames = computed(
    () => new Map(this.supplies().map((s) => [s.id.value, s.name])),
  );

  protected readonly lines = computed<LineView[]>(() => {
    const names = this.supplyNames();
    return this.recipe().lines.map((line) => ({
      name: names.get(line.supplyId.value) ?? '—',
      quantity: formatQuantity(line.quantity.value, line.quantity.unit),
    }));
  });
}
