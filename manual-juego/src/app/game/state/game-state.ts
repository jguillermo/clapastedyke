import { Injectable, computed, effect, signal } from '@angular/core';
import {
  CONTENT,
  CONTENT_VERSION,
  FLAT_STEPS,
  LEVEL_OF_MISSION,
  MISSION_OF_STEP,
} from '../model/content';
import { Difficulty, Level, Step } from '../model/tutorial-types';

interface SavedProgress {
  version: number;
  completedSteps: string[];
  currentStep: string | null;
}

const STORAGE_KEY = 'bakery.game.progress.v1';

/** Global index of each step, used to compute unlocks and percentages. */
const STEP_INDEX = new Map<string, number>(FLAT_STEPS.map((s, i) => [s.id, i]));

@Injectable({ providedIn: 'root' })
export class GameState {
  /** Ids of completed steps. The only persisted state. */
  private readonly completed = signal<ReadonlySet<string>>(this.load());

  /** First step in global order not yet completed; null if the game is 100% done. */
  readonly currentStep = computed<Step | null>(() => {
    const done = this.completed();
    return FLAT_STEPS.find(s => !done.has(s.id)) ?? null;
  });

  readonly totalSteps = FLAT_STEPS.length;

  readonly completedCount = computed(() => this.completed().size);

  readonly globalPercent = computed(() =>
    Math.round((this.completed().size / this.totalSteps) * 100),
  );

  readonly gameFinished = computed(() => this.currentStep() === null);

  constructor() {
    // Persistence: every progress change is written to localStorage.
    effect(() => {
      const data: SavedProgress = {
        version: CONTENT_VERSION,
        completedSteps: [...this.completed()],
        currentStep: this.currentStep()?.id ?? null,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Incognito mode or storage full: the game keeps going, without persisting.
      }
    });
  }

  isCompleted(stepId: string): boolean {
    return this.completed().has(stepId);
  }

  /**
   * A step is unlocked if all previous steps in global order are completed.
   * Completed steps stay unlocked forever: you can go back, never skip ahead.
   */
  isUnlocked(stepId: string): boolean {
    const index = STEP_INDEX.get(stepId);
    if (index === undefined) return false;
    const done = this.completed();
    for (let i = 0; i < index; i++) {
      if (!done.has(FLAT_STEPS[i].id)) return false;
    }
    return true;
  }

  /** Marks a step as completed. Only allowed on unlocked steps. */
  complete(stepId: string): void {
    if (!this.isUnlocked(stepId) || this.isCompleted(stepId)) return;
    const next = new Set(this.completed());
    next.add(stepId);
    this.completed.set(next);
  }

  /** Clears all progress (Reset button, with prior confirmation in the UI). */
  reset(): void {
    this.completed.set(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no storage, nothing to clear */
    }
  }

  /* ---------- Navigation between steps ---------- */

  previousStep(stepId: string): Step | null {
    const index = STEP_INDEX.get(stepId);
    return index !== undefined && index > 0 ? FLAT_STEPS[index - 1] : null;
  }

  nextStep(stepId: string): Step | null {
    const index = STEP_INDEX.get(stepId);
    return index !== undefined && index < FLAT_STEPS.length - 1 ? FLAT_STEPS[index + 1] : null;
  }

  missionOf(stepId: string) {
    return MISSION_OF_STEP.get(stepId);
  }

  levelOf(missionId: string): Level | undefined {
    return LEVEL_OF_MISSION.get(missionId);
  }

  /** Is this step the last of its level? (to celebrate the completed level) */
  isLastOfLevel(stepId: string): boolean {
    const mission = MISSION_OF_STEP.get(stepId);
    if (!mission) return false;
    const level = LEVEL_OF_MISSION.get(mission.id);
    if (!level) return false;
    const levelSteps = level.missions.flatMap(m => m.steps);
    return levelSteps[levelSteps.length - 1]?.id === stepId;
  }

  levelPercent(levelId: Difficulty): number {
    const level = CONTENT.find(n => n.id === levelId);
    if (!level) return 0;
    const steps = level.missions.flatMap(m => m.steps);
    if (!steps.length) return 0;
    const done = this.completed();
    const completed = steps.filter(s => done.has(s.id)).length;
    return Math.round((completed / steps.length) * 100);
  }

  missionPercent(missionId: string): number {
    const mission = CONTENT.flatMap(n => n.missions).find(m => m.id === missionId);
    if (!mission?.steps.length) return 0;
    const done = this.completed();
    const completed = mission.steps.filter(s => done.has(s.id)).length;
    return Math.round((completed / mission.steps.length) * 100);
  }

  missionUnlocked(missionId: string): boolean {
    const mission = CONTENT.flatMap(n => n.missions).find(m => m.id === missionId);
    return !!mission && this.isUnlocked(mission.steps[0].id);
  }

  /** First pending step of a mission; if it is complete, its first step. */
  missionTargetStep(missionId: string): Step | null {
    const mission = CONTENT.flatMap(n => n.missions).find(m => m.id === missionId);
    if (!mission) return null;
    const done = this.completed();
    return mission.steps.find(s => !done.has(s.id)) ?? mission.steps[0];
  }

  /* ---------- Initial load ---------- */

  private load(): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const data = JSON.parse(raw) as SavedProgress;
      // New content: old progress no longer means the same thing. It is discarded.
      if (data.version !== CONTENT_VERSION || !Array.isArray(data.completedSteps)) {
        return new Set();
      }
      // Only ids that still exist in the content.
      return new Set(data.completedSteps.filter(id => STEP_INDEX.has(id)));
    } catch {
      return new Set();
    }
  }
}
