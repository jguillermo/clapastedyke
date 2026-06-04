import { Component, computed, inject, input } from '@angular/core';
import { SafeSvgPipe } from '../../../_common/pipes/safe-svg.pipe';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { GameState } from '../../state/game-state';
import { CONTENT } from '../../model/content';
import { LEVEL_ICONS } from '../../model/icons';
import { Difficulty } from '../../model/tutorial-types';

/** Level-completed milestone, with a celebration. */
@Component({
  selector: 'app-level-completed',
  imports: [SafeSvgPipe, RouterLink, TranslocoPipe],
  providers: [provideTranslocoScope('game', 'tutorial')],
  templateUrl: './level-completed.html',
  styleUrl: './level-completed.scss',
})
export class LevelCompleted {
  protected readonly state = inject(GameState);
  private readonly router = inject(Router);

  readonly levelId = input.required<string>();

  protected readonly level = computed(() =>
    CONTENT.find(n => n.id === (this.levelId() as Difficulty)),
  );
  protected readonly icon = computed(() => LEVEL_ICONS[this.levelId()] ?? '');

  protected readonly nextLevel = computed(() => {
    const current = this.level();
    return current ? CONTENT.find(n => n.order === current.order + 1) ?? null : null;
  });

  /** 18 confetti pieces with deterministic positions/delays. */
  protected readonly confetti = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 137) % 100,
    delay: (i % 6) * 120,
    spin: i % 2 ? 1 : -1,
    color: ['#bb5530', '#e08a52', '#4f8a5b', '#cf9a32'][i % 4],
  }));

  protected continue(): void {
    const next = this.nextLevel();
    if (!next) {
      this.router.navigateByUrl('/map');
      return;
    }
    const mission = next.missions[0];
    this.router.navigateByUrl(`/mission/${mission.id}/${mission.steps[0].id}`);
  }
}
