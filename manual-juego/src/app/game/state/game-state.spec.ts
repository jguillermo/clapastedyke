import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONTENT_VERSION, FLAT_STEPS } from '../model/content';
import { GameState } from './game-state';

const KEY = 'bakery.game.progress.v1';

function newService(): GameState {
  TestBed.resetTestingModule();
  return TestBed.inject(GameState);
}

describe('GameState', () => {
  beforeEach(() => localStorage.clear());

  it('starts at the first step, with only that one unlocked', () => {
    const s = newService();
    expect(s.currentStep()?.id).toBe(FLAT_STEPS[0].id);
    expect(s.isUnlocked(FLAT_STEPS[0].id)).toBe(true);
    expect(s.isUnlocked(FLAT_STEPS[1].id)).toBe(false);
    expect(s.isUnlocked(FLAT_STEPS.at(-1)!.id)).toBe(false);
  });

  it('completing advances to the next step and never allows skipping', () => {
    const s = newService();
    // Skip attempt: completing a future step does nothing.
    s.complete(FLAT_STEPS[3].id);
    expect(s.isCompleted(FLAT_STEPS[3].id)).toBe(false);

    s.complete(FLAT_STEPS[0].id);
    expect(s.currentStep()?.id).toBe(FLAT_STEPS[1].id);
    expect(s.isUnlocked(FLAT_STEPS[1].id)).toBe(true);
    expect(s.isUnlocked(FLAT_STEPS[2].id)).toBe(false);
    // The completed step stays accessible (going back is always allowed).
    expect(s.isUnlocked(FLAT_STEPS[0].id)).toBe(true);
  });

  it('persists and reloads progress from localStorage', () => {
    const s1 = newService();
    s1.complete(FLAT_STEPS[0].id);
    s1.complete(FLAT_STEPS[1].id);
    TestBed.tick(); // fires the persistence effect

    const s2 = newService();
    expect(s2.isCompleted(FLAT_STEPS[0].id)).toBe(true);
    expect(s2.isCompleted(FLAT_STEPS[1].id)).toBe(true);
    expect(s2.currentStep()?.id).toBe(FLAT_STEPS[2].id);
  });

  it('discards progress if the content version changed', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: CONTENT_VERSION - 1,
        completedSteps: [FLAT_STEPS[0].id],
        currentStep: null,
      }),
    );
    const s = newService();
    expect(s.isCompleted(FLAT_STEPS[0].id)).toBe(false);
    expect(s.currentStep()?.id).toBe(FLAT_STEPS[0].id);
  });

  it('survives corrupt JSON', () => {
    localStorage.setItem(KEY, '{this is not json');
    const s = newService();
    expect(s.currentStep()?.id).toBe(FLAT_STEPS[0].id);
  });

  it('reset clears all progress', () => {
    const s = newService();
    s.complete(FLAT_STEPS[0].id);
    s.reset();
    expect(s.completedCount()).toBe(0);
    expect(s.currentStep()?.id).toBe(FLAT_STEPS[0].id);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('computes percentages and the last step of the level', () => {
    const s = newService();
    expect(s.globalPercent()).toBe(0);
    expect(s.isLastOfLevel(FLAT_STEPS[0].id)).toBe(false);
    expect(s.isLastOfLevel(FLAT_STEPS.at(-1)!.id)).toBe(true);
    s.complete(FLAT_STEPS[0].id);
    expect(s.globalPercent()).toBeGreaterThan(0);
  });
});
