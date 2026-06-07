import { Feature } from './feature';
import { GoalType } from './goal-type';
import { PlayerProgress } from './player-progress';

describe('PlayerProgress', () => {
    it('starts at level 0 with the recipe book unlocked and the kitchen locked', () => {
        const progress = PlayerProgress.start();
        expect(progress.currentLevel).toBe(0);
        expect(progress.isFeatureUnlocked(Feature.RECIPE_BOOK)).toBe(true);
        expect(progress.isFeatureUnlocked(Feature.KITCHEN)).toBe(false);
    });

    it('closes Level 0 when a cake is composed → advances to level 1 and unlocks KITCHEN', () => {
        const progress = PlayerProgress.start();
        progress.record(GoalType.CAKES_COMPOSED, 1);

        expect(progress.currentLevel).toBe(1);
        expect(progress.isFeatureUnlocked(Feature.KITCHEN)).toBe(true);

        const events = progress.pullEvents().map((e) => e.name);
        expect(events).toContain('ProgressRecorded');
        expect(events).toContain('LevelAdvanced');
        expect(events).toContain('FeatureUnlocked');
    });

    it('accumulates INCREMENT progress and survives a primitives round-trip', () => {
        const progress = PlayerProgress.start();
        progress.record(GoalType.CAKES_COMPOSED, 1);

        const restored = PlayerProgress.fromPrimitives(progress.toPrimitives());
        expect(restored.currentLevel).toBe(1);
        expect(restored.progressOf(GoalType.CAKES_COMPOSED)).toBe(1);
        expect(restored.isFeatureUnlocked(Feature.KITCHEN)).toBe(true);
    });

    it('does not advance again on further progress once Level 0 is closed', () => {
        const progress = PlayerProgress.start();
        progress.record(GoalType.CAKES_COMPOSED, 1);
        progress.pullEvents();

        progress.record(GoalType.CAKES_COMPOSED, 1);
        expect(progress.currentLevel).toBe(1);
        expect(progress.pullEvents().map((e) => e.name)).toEqual(['ProgressRecorded']);
    });
});
