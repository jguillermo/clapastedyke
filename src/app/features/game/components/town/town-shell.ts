import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { GameState } from '../../state/game-state';
import { BUILDINGS, Building, findBuilding, isBuildingOperational } from '../../model/buildings';
import { BuildingState } from '../../../../platform/three/town-engine';
import { GetDashboard, DashboardData } from '../../../../core/dashboard/application/get-dashboard/get-dashboard';
import { Difficulty } from '../../model/tutorial-types';
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
  providers: [provideTranslocoScope('game', 'tutorial')],
  templateUrl: './town-shell.html',
  styleUrl: './town-shell.scss',
})
export class TownShell {
  protected readonly state = inject(GameState);
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
    afterNextRender(() => this.reloadDashboard());

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncOverlay());
    this.syncOverlay();
  }

  /** Tracks whether an operational screen is mounted; refreshes KPIs on close. */
  private syncOverlay(): void {
    const open = !!this.route.firstChild;
    if (this.overlayActive() && !open) this.reloadDashboard();
    this.overlayActive.set(open);
  }

  protected operational(b: Building): boolean {
    return isBuildingOperational(b, (l: Difficulty) => this.state.levelPercent(l));
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
      void this.router.navigate(['/mission', building.unlockMissionId]);
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
