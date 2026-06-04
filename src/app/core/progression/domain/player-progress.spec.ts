import { describe, expect, it } from 'vitest';
import { PlayerProgress } from './player-progress';
import { GoalType } from './goal-type';
import { Feature } from './feature';

/** Avanza la Fase 1 completa (compra + 3 almacenes + 1 producción). */
function completeLevel1(p: PlayerProgress): void {
  p.record(GoalType.PURCHASES_REGISTERED, 1);
  p.record(GoalType.WAREHOUSES_STOCKED, 3);
  p.record(GoalType.PRODUCTIONS_COOKED, 1);
}

describe('PlayerProgress (aggregate de progresión)', () => {
  it('arranca en nivel 1 con la cocina desbloqueada y sin progreso', () => {
    const p = PlayerProgress.start();
    expect(p.currentLevel).toBe(1);
    expect(p.isFeatureUnlocked(Feature.KITCHEN)).toBe(true);
    expect(p.isFeatureUnlocked(Feature.SOCIAL)).toBe(false);
    expect(p.goalsOfCurrentLevel().every(g => !g.met)).toBe(true);
  });

  it('INCREMENT acumula y SNAPSHOT guarda el máximo', () => {
    const p = PlayerProgress.start();
    p.record(GoalType.PRODUCTIONS_COOKED, 1);
    p.record(GoalType.PRODUCTIONS_COOKED, 1);
    expect(p.progressOf(GoalType.PRODUCTIONS_COOKED)).toBe(2);

    p.record(GoalType.WAREHOUSES_STOCKED, 3);
    p.record(GoalType.WAREHOUSES_STOCKED, 1); // un valor menor no baja el máximo
    expect(p.progressOf(GoalType.WAREHOUSES_STOCKED)).toBe(3);
  });

  it('al cumplir las metas de Fase 1 sube a nivel 2 y desbloquea SOCIAL', () => {
    const p = PlayerProgress.start();
    completeLevel1(p);
    expect(p.currentLevel).toBe(2);
    expect(p.isFeatureUnlocked(Feature.SOCIAL)).toBe(true);
  });

  it('emite ProgressRecorded, LevelAdvanced y FeatureUnlocked', () => {
    const p = PlayerProgress.start();
    completeLevel1(p);
    const names = p.pullEvents().map(e => e.name);
    expect(names).toContain('ProgressRecorded');
    expect(names).toContain('LevelAdvanced');
    expect(names).toContain('FeatureUnlocked');
  });

  it('el atajo ForceLevelUp salta de nivel y desbloquea funciones intermedias', () => {
    const p = PlayerProgress.start();
    p.forceLevelUp(4);
    expect(p.currentLevel).toBe(4);
    expect(p.isFeatureUnlocked(Feature.SOCIAL)).toBe(true);
    expect(p.isFeatureUnlocked(Feature.CUSTOMERS)).toBe(true);
    expect(p.isFeatureUnlocked(Feature.ORDERS)).toBe(true);
  });

  it('las features avanzadas se desbloquean por su hito (QUOTING a 10 ventas)', () => {
    const p = PlayerProgress.start();
    expect(p.isFeatureUnlocked(Feature.QUOTING)).toBe(false);
    p.record(GoalType.SALES_COMPLETED, 10);
    expect(p.isFeatureUnlocked(Feature.QUOTING)).toBe(true);
  });

  it('round-trip de primitivas conserva el estado', () => {
    const p = PlayerProgress.start();
    completeLevel1(p);
    p.pullEvents();
    const restored = PlayerProgress.fromPrimitives(p.toPrimitives());
    expect(restored.currentLevel).toBe(2);
    expect(restored.isFeatureUnlocked(Feature.SOCIAL)).toBe(true);
    expect(restored.progressOf(GoalType.PRODUCTIONS_COOKED)).toBe(1);
  });
});
