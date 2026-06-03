import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { FLAT_STEPS } from './model/content';
import { GameState } from './state/game-state';
import { unlockGuard } from './unlock.guard';

function snapshotWith(stepId: string): ActivatedRouteSnapshot {
  return { paramMap: new Map([['stepId', stepId]]) } as unknown as ActivatedRouteSnapshot;
}

function runGuard(stepId: string): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    unlockGuard(snapshotWith(stepId), {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('unlockGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('lets the first step through and blocks the future ones', () => {
    expect(runGuard(FLAT_STEPS[0].id)).toBe(true);

    const redirected = runGuard(FLAT_STEPS[5].id);
    expect(redirected).toBeInstanceOf(UrlTree);
    // Redirects to the current step of the game (the first, still uncompleted).
    expect(redirected.toString()).toContain(FLAT_STEPS[0].id);
  });

  it('after completing, unlocks the next and keeps the previous accessible', () => {
    const state = TestBed.inject(GameState);
    state.complete(FLAT_STEPS[0].id);

    expect(runGuard(FLAT_STEPS[1].id)).toBe(true);
    expect(runGuard(FLAT_STEPS[0].id)).toBe(true); // go back, always
    expect(runGuard(FLAT_STEPS[2].id)).toBeInstanceOf(UrlTree); // skip, never
  });

  it('a non-existent step redirects', () => {
    expect(runGuard('does-not-exist')).toBeInstanceOf(UrlTree);
  });
});
