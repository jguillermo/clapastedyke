import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameState } from './state/game-state';

/**
 * You can never jump to a future step; you can always go back to a completed
 * one. A locked step redirects to the current step of the game.
 */
export const unlockGuard: CanActivateFn = route => {
  const state = inject(GameState);
  const router = inject(Router);

  const stepId = route.paramMap.get('stepId') ?? '';
  if (state.isUnlocked(stepId)) return true;

  const current = state.currentStep();
  if (!current) return router.parseUrl('/town');
  const mission = state.missionOf(current.id);
  return router.parseUrl(`/mission/${mission?.id}/${current.id}`);
};

/** `mission/:missionId` redirects to the first pending step of that mission. */
export const missionRedirectGuard: CanActivateFn = route => {
  const state = inject(GameState);
  const router = inject(Router);

  const missionId = route.paramMap.get('missionId') ?? '';
  const target = state.missionTargetStep(missionId);
  if (target && state.isUnlocked(target.id)) {
    return router.parseUrl(`/mission/${missionId}/${target.id}`);
  }
  return router.parseUrl('/town');
};
