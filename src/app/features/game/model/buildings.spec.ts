import { describe, expect, it } from 'vitest';
import { BUILDINGS, findBuilding, isBuildingOperational } from './buildings';
import { Feature } from '../../../core/progression/domain/feature';

describe('BUILDINGS map', () => {
  it('every action routes to a non-empty path relative to /town', () => {
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

  it('every building requires a known Feature', () => {
    const features = new Set(Object.values(Feature));
    for (const b of BUILDINGS) {
      expect(features.has(b.requires), `${b.id} requires a real Feature`).toBe(true);
    }
  });
});

describe('isBuildingOperational', () => {
  it('is operational only when its required Feature is unlocked', () => {
    const tienda = findBuilding('tienda')!;
    expect(isBuildingOperational(tienda, () => false)).toBe(false);
    expect(isBuildingOperational(tienda, f => f === tienda.requires)).toBe(true);
  });
});
