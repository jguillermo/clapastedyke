import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { ProgressionFacade } from '../../../_common/progression/progression-facade';
import { ADVANCED_FEATURES, BUILDINGS, Building, BuildingAction, FEATURE_HINT, findBuilding, isBuildingOperational } from '../../model/buildings';
import { BuildingState } from '../../../../platform/three/town-engine';
import { GetDashboard, DashboardData } from '../../../../core/dashboard/application/get-dashboard/get-dashboard';
import { Feature } from '../../../../core/progression/domain/feature';
import { Town3d } from './town-3d';

/**
 * The unified home AND layout: the pastry shop as a living town. The 3D town is
 * the hub; entering an operational building dollies the camera in and shows its
 * room-menu, whose actions route to the real operational screens (children of
 * `/town`) rendered in the overlay outlet. Locked buildings route to the guided
 * mission that opens them.
 *
 * The dashboard (the old «Resumen») is the town's ambience: its KPIs head the
 * page and its alerts become pins floating over the matching building.
 */
@Component({
  selector: 'app-town-shell',
  imports: [Town3d, RouterOutlet, RouterLink, TranslocoPipe],
  providers: [provideTranslocoScope('game')],
  templateUrl: './town-shell.html',
  styleUrl: './town-shell.scss',
})
export class TownShell {
  private readonly progression = inject(ProgressionFacade);
  private readonly getDashboard = inject(GetDashboard);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly buildings = BUILDINGS;
  protected readonly dashboard = signal<DashboardData | null>(null);

  /** Building whose room-menu/screen is open (drives the camera zoom). */
  protected readonly selected = signal<Building | null>(null);
  /** True when a child route (an operational screen) is rendered in the outlet. */
  protected readonly overlayActive = signal(false);

  protected readonly focusId = computed(() => this.selected()?.id ?? null);

  /** Panel "Para crecer": funciones avanzadas y su hito de desbloqueo. */
  protected readonly goalsPanelOpen = signal(true);
  protected readonly advancedItems = computed(() =>
    ADVANCED_FEATURES.map(f => ({
      feature: f,
      unlocked: this.progression.isFeatureUnlocked(f),
      hint: FEATURE_HINT[f] ?? '',
    })),
  );

  protected toggleGoals(): void {
    this.goalsPanelOpen.update(v => !v);
  }

  /** Snapshot the 3D engine draws: operational state + alert pins per building. */
  protected readonly buildingStates = computed<BuildingState[]>(() => {
    const dash = this.dashboard();
    return this.buildings.map(b => {
      const alerts = (dash?.alerts ?? []).filter(a => b.alertTypes.includes(a.type));
      const red = alerts.some(a => a.type === 'outOfStock' || a.type === 'expiredQuote');
      return {
        id: b.id,
        color: b.color,
        model: b.model,
        operational: this.operational(b),
        alerts: alerts.length,
        alertColor: alerts.length === 0 ? null : red ? 'red' : 'amber',
      };
    });
  });

  constructor() {
    afterNextRender(() => {
      void this.progression.refresh();
      this.reloadDashboard();
    });

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncOverlay());
    this.syncOverlay();
  }

  /** Tracks whether an operational screen is mounted; refreshes KPIs/progreso on close. */
  private syncOverlay(): void {
    const open = !!this.route.firstChild;
    if (this.overlayActive() && !open) {
      this.reloadDashboard();
      void this.progression.refresh(); // refleja funciones recién desbloqueadas
    }
    this.overlayActive.set(open);
  }

  protected operational(b: Building): boolean {
    return isBuildingOperational(b, (f: Feature) => this.progression.isFeatureUnlocked(f));
  }

  /** ¿La acción está disponible? (las avanzadas dependen de su Feature). */
  protected actionUnlocked(a: BuildingAction): boolean {
    return !a.requires || this.progression.isFeatureUnlocked(a.requires);
  }

  /** Meta que abre una acción avanzada bloqueada. */
  protected actionHint(a: BuildingAction): string {
    return a.requires ? (FEATURE_HINT[a.requires] ?? '') : '';
  }

  protected alertCount(b: Building): number {
    const dash = this.dashboard();
    return (dash?.alerts ?? []).filter(a => b.alertTypes.includes(a.type)).length;
  }

  /** Absolute router link for an action path relative to /town. */
  protected townLink(path: string): string[] {
    return ['/town', ...path.split('/')];
  }

  /** A building was clicked (3D or accessible list). */
  protected onChosen(id: string): void {
    const building = findBuilding(id);
    if (!building) return;
    if (!this.operational(building)) {
      // Aún en obra: vuelve a la cocina (la meta que lo abre vive en la progresión).
      void this.router.navigate(['/home']);
      return;
    }
    this.selected.set(building);
  }

  /** Back from a screen to the building's room-menu (keeps the camera zoomed). */
  protected backToRoom(): void {
    void this.router.navigate(['/town']);
  }

  /** Leave the building entirely: close the overlay and pull the camera back. */
  protected closeBuilding(): void {
    this.selected.set(null);
    void this.router.navigate(['/town']);
  }

  private reloadDashboard(): void {
    void this.getDashboard.execute().then(d => this.dashboard.set(d));
  }
}
