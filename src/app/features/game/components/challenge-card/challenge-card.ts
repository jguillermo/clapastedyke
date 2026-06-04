import { NgComponentOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { SafeSvgPipe } from '../../../_common/pipes/safe-svg.pipe';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { GameState } from '../../state/game-state';
import { findForm } from '../../forms/form-registry';
import { findMission } from '../../model/content';
import { ICONS } from '../../model/icons';
import { Assistant } from '../assistant/assistant';
import { GuideCursor } from '../guide-cursor/guide-cursor';
import { Scene } from '../scene/scene';

/**
 * The current challenge. Two modes:
 * - FORM: the REAL form full-screen; the user types following the example, the
 *   3D chef guides her, and the button lights up when she gets it right.
 * - SCENE: animated mockup (menus, sheet) in a card, as before.
 */
@Component({
  selector: 'app-challenge-card',
  imports: [SafeSvgPipe, Scene, Assistant, GuideCursor, NgComponentOutlet, TranslocoPipe],
  providers: [provideTranslocoScope('game', 'tutorial')],
  templateUrl: './challenge-card.html',
  styleUrl: './challenge-card.scss',
  host: { '[class.full]': 'isForm()' },
})
export class ChallengeCard {
  protected readonly state = inject(GameState);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  // Route params (withComponentInputBinding).
  readonly missionId = input.required<string>();
  readonly stepId = input.required<string>();

  protected readonly mission = computed(() => findMission(this.missionId()));
  protected readonly step = computed(
    () => this.mission()?.steps.find(s => s.id === this.stepId()) ?? null,
  );
  protected readonly stepIndex = computed(() =>
    Math.max(0, (this.mission()?.steps ?? []).findIndex(s => s.id === this.stepId())),
  );
  protected readonly level = computed(() => this.state.levelOf(this.missionId()));
  protected readonly icon = computed(() => ICONS[this.missionId()] ?? ICONS['_def']);

  protected readonly alreadyDone = computed(() => this.state.isCompleted(this.stepId()));

  protected readonly showingHint = signal(false);
  /** After completing, if the step has "what happens", it is shown before advancing. */
  protected readonly showingWhatHappens = signal(false);

  /* ---------- Real full-screen form mode ---------- */

  protected readonly formComponent = computed(() => {
    const id = this.step()?.scene.form;
    return id ? (findForm(id)?.component ?? null) : null;
  });

  protected readonly isForm = computed(() => this.formComponent() !== null);

  /** The user types it herself: the form starts empty. Input names kept
   *  (resaltar/valores) for the legacy forms until they are ported. */
  protected readonly formInputs = computed(() => ({
    highlight: this.step()?.scene.highlightIds ?? [],
    values: {} as Record<string, string>,
  }));

  /** Fields to type in this challenge: id → sample value. */
  protected readonly targets = computed(() => {
    const scene = this.step()?.scene;
    if (!scene?.form) return [];
    const samples = scene.sampleValues ?? {};
    return (scene.highlightIds ?? [])
      .filter(id => samples[id] !== undefined)
      .map(id => ({ id, expected: samples[id] }));
  });

  /** Ids already typed correctly in this step. */
  protected readonly correct = signal<ReadonlySet<string>>(new Set());

  /** All challenge fields are right (or the challenge requires no typing). */
  protected readonly allCorrect = computed(() =>
    this.targets().every(t => this.correct().has(t.id)),
  );

  /** Value still to be typed (for the chef's bubble). */
  protected readonly pendingExpected = computed(() => {
    const pending = this.targets().find(t => !this.correct().has(t.id));
    return pending && !this.alreadyDone() ? pending.expected : null;
  });

  /** Which element the guide cursor travels to: the pending field or the first highlight. */
  protected readonly cursorTarget = computed(() => {
    const pending = this.targets().find(t => !this.correct().has(t.id));
    if (pending) return pending.id;
    return this.step()?.scene.highlightIds?.[0] ?? null;
  });

  constructor() {
    // Step change: typing and the hint are reset.
    effect(() => {
      this.stepId();
      this.correct.set(new Set());
      this.showingHint.set(false);
      this.showingWhatHappens.set(false);
    });
  }

  /** Delegated listener for the real form inputs. */
  protected onType(event: Event): void {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!field?.id) return;
    const target = this.targets().find(t => t.id === field.id);
    if (!target) return;

    const ok = this.normalize(field.value) === this.normalize(target.expected);
    const current = new Set(this.correct());
    const changes = ok !== current.has(target.id);
    if (!changes) return;
    if (ok) current.add(target.id);
    else current.delete(target.id);
    this.correct.set(current);
  }

  private normalize(s: string): string {
    return s.trim().toLowerCase();
  }

  /* ---------- Advance ---------- */

  protected complete(): void {
    const step = this.step();
    if (!step || !this.allCorrect()) return;
    this.state.complete(step.id);
    if (step.whatHappensKey) {
      this.showingWhatHappens.set(true);
      return;
    }
    this.advance();
  }

  protected advance(): void {
    const step = this.step();
    if (!step) return;
    this.showingWhatHappens.set(false);

    if (this.state.isLastOfLevel(step.id)) {
      const level = this.level();
      this.router.navigateByUrl(`/level/${level?.id}/completed`);
      return;
    }
    const next = this.state.nextStep(step.id);
    if (!next) {
      this.router.navigateByUrl('/map');
      return;
    }
    const mission = this.state.missionOf(next.id);
    this.router.navigateByUrl(`/mission/${mission?.id}/${next.id}`);
  }

  protected back(): void {
    const previous = this.state.previousStep(this.stepId());
    if (!previous) {
      this.router.navigateByUrl('/map');
      return;
    }
    const mission = this.state.missionOf(previous.id);
    this.router.navigateByUrl(`/mission/${mission?.id}/${previous.id}`);
  }

  /** Resolves a content translation key to its raw (HTML) string. */
  protected t(key: string): string {
    return this.transloco.translate(key);
  }
}
