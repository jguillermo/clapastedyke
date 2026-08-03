import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
// DEUDA (features-conventions.md · «las features son independientes): la cocina monta el libro 3D
// importando otra feature. Se retira abriendo el libro desde la ruta/host — el libro emite
// `(closed)` y quien decide qué se muestra debería ser el contenedor, no esta vista.
// eslint-disable-next-line no-restricted-imports
import { RecipeBook3d } from '@features/recipe-book/book-3d/recipe-book-3d';
import { RouterLink } from '@angular/router';
import { Icon } from '@components/icon/icon';
import { KitchenEngine } from '@platform/three/kitchen-engine';
import { KitchenStation } from '@platform/three/kitchen-station';

/** Estilo del botón de estación del dock (ruta accesible). Solo utilidades del tema Migo. */
const STATION_BASE =
  'inline-flex items-center gap-2 min-h-11 px-4 sm:px-5 rounded-full border font-body text-sm ' +
  'font-semibold cursor-pointer transition duration-base ease-out focus-visible:outline-none ' +
  'focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-70';

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
 * Posee el canvas, instancia el {@link KitchenEngine}, reproduce el `flyIn`, y al
 * hacer clic en la estación del libro de recetas enfoca la cámara y abre el hub
 * {@link RecipeBook} como diálogo (CDK aporta foco/ESC/scroll-lock). Incluye la
 * **ruta accesible**: el dock opera el flujo sin 3D, y si no hay WebGL se muestra
 * solo el dock.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home-3d.html',
  imports: [RecipeBook3d, RouterLink, Icon],
  host: {
    class: 'block fixed inset-0 overflow-hidden',
    '(window:resize)': 'onResize()',
  },
})
export class Home3d implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly webglSupported = signal(true);
  protected readonly coachVisible = signal(false);
  protected readonly bookOpen = signal(false);

  protected readonly coachText =
    'Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas.';

  protected readonly stations: readonly StationItem[] = [
    { station: KitchenStation.RECIPE_BOARD, label: 'Libro de recetas', active: true },
    { station: KitchenStation.PANTRY, label: 'Despensa', active: false },
    { station: KitchenStation.OVEN, label: 'Horno', active: false },
  ];

  private readonly log = inject(Logger).scoped('ui/home');

  private engine: KitchenEngine | null = null;
  private readonly reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor() {
    const webgl = detectWebgl();
    this.webglSupported.set(webgl);
    this.log.debug(webgl ? 'hay WebGL: se monta el mundo 3D' : 'sin WebGL: ruta accesible DOM', {
      reducedMotion: this.reducedMotion,
    });
  }

  ngAfterViewInit(): void {
    if (!this.webglSupported()) {
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      this.log.debug('todavía no hay canvas, no se monta el motor');
      return;
    }
    try {
      this.engine = new KitchenEngine(canvas, this.reducedMotion, this.log.scoped('3d/kitchen'));
      this.engine.onStationClick((station) => this.handleStation(station));
      this.engine
        .flyIn()
        .then(() => {
          if (!this.bookOpen()) {
            this.coachVisible.set(true);
          }
        })
        .catch((error: unknown) => this.log.error('la entrada de cámara ha fallado', error));
    } catch (error) {
      // El contexto WebGL pudo fallar al crearse: caemos a la ruta accesible. Nadie más se entera
      // —la vista sigue funcionando— así que la degradación se cuenta aquí o no se cuenta.
      this.log.warn('no se pudo crear el motor 3D: se cae a la ruta accesible', error);
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
      this.log.debug('estación inerte en la Fase 0, no se hace nada', { station });
      return; // PANTRY / OVEN inertes en la Fase 0
    }
    this.openRecipeBook();
  }

  protected openRecipeBook(): void {
    if (this.bookOpen()) {
      return;
    }
    this.log.debug('abriendo el libro de recetas');
    this.coachVisible.set(false);
    this.engine
      ?.focusStation(KitchenStation.RECIPE_BOARD)
      .catch((error: unknown) => this.log.error('no se pudo enfocar la estación', error));
    this.engine?.pause(); // libera GPU mientras el libro está a pantalla completa
    this.bookOpen.set(true);
  }

  /** El libro se cerró: reanuda la cocina y vuelve a la vista general. */
  protected onRecipeBookClosed(): void {
    this.log.debug('libro cerrado, vuelve la cocina');
    this.bookOpen.set(false);
    this.engine?.resume();
    this.engine
      ?.resetView()
      .catch((error: unknown) => this.log.error('no se pudo volver a la vista general', error));
    if (this.webglSupported()) {
      this.coachVisible.set(true);
    }
  }

  protected onResize(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.engine?.resize(canvas.clientWidth, canvas.clientHeight);
    }
  }

  /** Clases del botón de estación según esté activa (desbloqueada) o no. */
  protected stationClasses(active: boolean): string {
    return active
      ? `${STATION_BASE} bg-brand border-brand text-on-brand hover:bg-brand-hover`
      : `${STATION_BASE} bg-surface-warm border-border-strong text-body`;
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
