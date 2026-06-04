import { describe, expect, it } from 'vitest';
import { BUILDINGS, findBuilding, isBuildingOperational } from './buildings';
import { findMission } from './content';
import { Difficulty } from './tutorial-types';

describe('BUILDINGS map', () => {
  it('every building points to a real opening mission', () => {
    for (const b of BUILDINGS) {
      expect(findMission(b.unlockMissionId), `mission ${b.unlockMissionId} of ${b.id}`).toBeDefined();
    }
  });

  it('every action routes to a non-empty path under /town', () => {
    for (const b of BUILDINGS) {
      expect(b.actions.length, `${b.id} has actions`).toBeGreaterThan(0);
      for (const a of b.actions) {
        expect(a.path, `${b.id}/${a.labelKey} path`).toBeTruthy();
        expect(a.path.startsWith('/'), `${b.id}/${a.labelKey} path is relative`).toBe(false);
      }
    }
  });

  it('building ids are unique', () => {
    const ids = BUILDINGS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('isBuildingOperational', () => {
  const all = (): Record<Difficulty, number> => ({ basic: 0, intermediate: 0, advanced: 0 });
  const pct = (m: Record<Difficulty, number>) => (l: Difficulty) => m[l];

  it('opens basic buildings from the start (no prior level)', () => {
    const oficina = findBuilding('oficina')!;
    expect(isBuildingOperational(oficina, pct(all()))).toBe(true);
  });

  it('keeps an intermediate building locked until basic is 100%', () => {
    const tienda = findBuilding('tienda')!;
    const m = all();
    m.basic = 80;
    expect(isBuildingOperational(tienda, pct(m))).toBe(false);
    m.basic = 100;
    expect(isBuildingOperational(tienda, pct(m))).toBe(true);
  });

  it('keeps an advanced building locked until basic AND intermediate are 100%', () => {
    const mercado = findBuilding('mercado')!;
    const m = all();
    m.basic = 100;
    expect(isBuildingOperational(mercado, pct(m))).toBe(false);
    m.intermediate = 100;
    expect(isBuildingOperational(mercado, pct(m))).toBe(true);
  });
});
