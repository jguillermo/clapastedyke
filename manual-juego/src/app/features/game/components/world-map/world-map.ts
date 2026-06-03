import { Component, computed, inject } from '@angular/core';
import { SafeSvgPipe } from '../../../_common/pipes/safe-svg.pipe';
import { Router } from '@angular/router';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { GameState } from '../../state/game-state';
import { CONTENT } from '../../model/content';
import { ICONS, LEVEL_ICONS } from '../../model/icons';
import { IslandState } from '../../../../platform/three/world-engine';
import { Map3d } from './world-map-3d';

/**
 * World map: the 3D canvas (Three.js) on top and, below, the levels as cards
 * with their missions — the accessible path and the fallback without WebGL.
 * You can only enter what is unlocked.
 */
@Component({
  selector: 'app-world-map',
  imports: [SafeSvgPipe, Map3d, TranslocoPipe],
  providers: [provideTranslocoScope('game', 'tutorial')],
  templateUrl: './world-map.html',
  styleUrl: './world-map.scss',
})
export class WorldMap {
  protected readonly state = inject(GameState);
  private readonly router = inject(Router);

  protected readonly levels = CONTENT;
  protected readonly ICONS = ICONS;
  protected readonly LEVEL_ICONS = LEVEL_ICONS;
  protected iconOf(missionId: string): string {
    return ICONS[missionId] || ICONS['_def'];
  }

  protected readonly LOCK =
    '<svg viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7"/><circle cx="12" cy="15.2" r="1.4"/></svg>';

  /** Mission the current step belongs to (for the Continue button). */
  protected readonly currentMission = computed(() => {
    const step = this.state.currentStep();
    return step ? this.state.missionOf(step.id) : null;
  });

  /** Snapshot of progress that draws the 3D world. */
  protected readonly islands3d = computed<IslandState[]>(() => {
    const current = this.currentMission();
    return this.levels.map(level => ({
      id: level.id,
      missions: level.missions.map(mission => ({
        id: mission.id,
        state:
          this.state.missionPercent(mission.id) === 100
            ? ('complete' as const)
            : this.state.missionUnlocked(mission.id)
              ? ('unlocked' as const)
              : ('locked' as const),
        current: current?.id === mission.id,
      })),
    }));
  });

  protected continue(): void {
    const step = this.state.currentStep();
    if (!step) return;
    const mission = this.state.missionOf(step.id);
    this.router.navigateByUrl(`/mission/${mission?.id}/${step.id}`);
  }

  protected goToMission(missionId: string): void {
    if (!this.state.missionUnlocked(missionId)) return;
    this.router.navigateByUrl(`/mission/${missionId}`);
  }
}
