import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { KitchenEngine } from '../../../platform/three/kitchen-engine';
import { KitchenStation } from '../../../platform/three/kitchen-station';

/** Estación tal como la presenta el dock / la ruta accesible. */
interface StationItem {
  readonly station: KitchenStation;
  readonly label: string;
  /** Si está activa en la Fase 0. PANTRY/OVEN quedan inertes hasta el Cap. 1. */
  readonly active: boolean;
}

/**
 * Página del mundo 3D — escena `KITCHEN` de la Fase 0.
 *
 * Posee el canvas, instancia el {@link KitchenEngine}, reproduce el `flyIn`,
 * y al hacer clic en la estación del libro de recetas abre su overlay (stub,
 * gancho del siguiente paso). Incluye la **ruta accesible**: el dock opera el
 * flujo sin 3D, y si no hay WebGL se muestra solo el dock.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home-3d.html',
  styleUrl: './home-3d.css',
  host: {
    '(window:resize)': 'onResize()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Home3d implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  protected readonly webglSupported = signal(true);
  protected readonly overlayOpen = signal(false);
  protected readonly coachVisible = signal(false);

  protected readonly coachText =
    'Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas.';

  protected readonly stations: readonly StationItem[] = [
    { station: KitchenStation.RECIPE_BOARD, label: 'Libro de recetas', active: true },
    { station: KitchenStation.PANTRY, label: 'Despensa', active: false },
    { station: KitchenStation.OVEN, label: 'Horno', active: false },
  ];

  private engine: KitchenEngine | null = null;
  private triggerEl: HTMLElement | null = null;
  private readonly reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor() {
    this.webglSupported.set(detectWebgl());
    // Al abrir el overlay, lleva el foco al botón de cerrar (gestión de foco WCAG).
    effect(() => {
      const btn = this.closeButton();
      if (this.overlayOpen() && btn) {
        btn.nativeElement.focus();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.webglSupported()) {
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }
    try {
      this.engine = new KitchenEngine(canvas, this.reducedMotion);
      this.engine.onStationClick((station) => this.handleStation(station));
      void this.engine.flyIn().then(() => this.coachVisible.set(true));
    } catch {
      // El contexto WebGL pudo fallar al crearse: caemos a la ruta accesible.
      this.engine = null;
      this.webglSupported.set(false);
    }
  }

  ngOnDestroy(): void {
    this.engine?.dispose();
  }

  /** Punto único: clic de estación (desde el 3D o desde el dock accesible). */
  protected handleStation(station: KitchenStation): void {
    if (station !== KitchenStation.RECIPE_BOARD) {
      return; // PANTRY / OVEN inertes en la Fase 0
    }
    this.openRecipeBook();
  }

  protected openRecipeBook(): void {
    this.coachVisible.set(false);
    this.triggerEl = (document.activeElement as HTMLElement) ?? null;
    this.overlayOpen.set(true);
    void this.engine?.focusStation(KitchenStation.RECIPE_BOARD);
  }

  protected closeOverlay(): void {
    if (!this.overlayOpen()) {
      return;
    }
    this.overlayOpen.set(false);
    void this.engine?.resetView();
    // Restaura el foco al control que abrió el overlay.
    this.triggerEl?.focus();
    this.triggerEl = null;
  }

  protected onEscape(): void {
    this.closeOverlay();
  }

  protected onResize(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.engine?.resize(canvas.clientWidth, canvas.clientHeight);
    }
  }
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
