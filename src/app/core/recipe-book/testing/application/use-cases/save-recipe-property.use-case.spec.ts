import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/eventbus/event-bus';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { RecipeFlavorRepository } from '../../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../../domain/repositories/recipe-capacity.repository';
import { SaveRecipeProperty } from '../../../application/use-cases/save-recipe-property.use-case';

describe('SaveRecipeProperty', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  describe('kind: flavor', () => {
    it('creates a flavor and publishes FlavorSaved (new)', async () => {
      const { id } = await TestBed.inject(SaveRecipeProperty).execute({
        kind: 'flavor',
        label: 'Vainilla',
      });

      const saved = await TestBed.inject(RecipeFlavorRepository).byId(new EntityId(id));
      expect(saved?.label).toBe('Vainilla');

      const bus = TestBed.inject(EventBus) as RecordingEventBus;
      expect(bus.names()).toContain('FlavorSaved');
    });

    it('dedups by label: creating the same flavor twice reuses it (no duplicate)', async () => {
      const uc = TestBed.inject(SaveRecipeProperty);
      const a = await uc.execute({ kind: 'flavor', label: 'Vainilla' });
      const b = await uc.execute({ kind: 'flavor', label: 'vainilla' });
      expect(b.id).toBe(a.id);
      expect(await TestBed.inject(RecipeFlavorRepository).all()).toHaveLength(1);
    });

    it('renames an existing flavor by id', async () => {
      const repo = TestBed.inject(RecipeFlavorRepository);
      const uc = TestBed.inject(SaveRecipeProperty);
      const { id } = await uc.execute({ kind: 'flavor', label: 'Vainilla' });

      await uc.execute({ kind: 'flavor', id, label: 'Vainilla francesa' });

      const renamed = await repo.byId(new EntityId(id));
      expect(renamed?.label).toBe('Vainilla francesa');
    });
  });

  describe('kind: portions / mold', () => {
    it('creates a capacity in its group and publishes RecipeCapacitySaved', async () => {
      const { id } = await TestBed.inject(SaveRecipeProperty).execute({
        kind: 'mold',
        label: 'Doble',
        factor: 2,
      });

      const repo = TestBed.inject(RecipeCapacityRepository);
      const inGroup = await repo.byGroup('mold');
      expect(inGroup.map((o) => o.id.value)).toContain(id);
      expect((await repo.byId(new EntityId(id)))?.factor).toBe(2);

      const bus = TestBed.inject(EventBus) as RecordingEventBus;
      expect(bus.names()).toContain('RecipeCapacitySaved');
    });

    it('edits an existing capacity by id', async () => {
      const repo = TestBed.inject(RecipeCapacityRepository);
      const uc = TestBed.inject(SaveRecipeProperty);
      const { id } = await uc.execute({ kind: 'mold', label: 'Doble', factor: 2 });

      await uc.execute({ kind: 'mold', id, label: 'Doble', factor: 2.5 });

      expect((await repo.byId(new EntityId(id)))?.factor).toBe(2.5);
    });

    it('dedups by group+label: creating the same capacity twice reuses it', async () => {
      const uc = TestBed.inject(SaveRecipeProperty);
      const a = await uc.execute({ kind: 'mold', label: 'Molde grande', factor: 2 });
      const b = await uc.execute({ kind: 'mold', label: 'molde grande', factor: 2 });
      expect(b.id).toBe(a.id);
      expect(await TestBed.inject(RecipeCapacityRepository).byGroup('mold')).toHaveLength(1);
    });

    it('the same label in the other group is a different capacity', async () => {
      const uc = TestBed.inject(SaveRecipeProperty);
      const mold = await uc.execute({ kind: 'mold', label: 'Doble', factor: 2 });
      const portions = await uc.execute({ kind: 'portions', label: 'Doble', factor: 2 });

      expect(portions.id).not.toBe(mold.id);
      expect(await TestBed.inject(RecipeCapacityRepository).byGroup('portions')).toHaveLength(1);
    });

    it('defaults the factor to 1 when omitted', async () => {
      const { id } = await TestBed.inject(SaveRecipeProperty).execute({
        kind: 'portions',
        label: '12',
      });

      const saved = await TestBed.inject(RecipeCapacityRepository).byId(new EntityId(id));
      expect(saved?.factor).toBe(1);
    });

    it('rejects a non-positive factor (domain invariant)', async () => {
      await expect(
        TestBed.inject(SaveRecipeProperty).execute({ kind: 'mold', label: 'Cero', factor: 0 }),
      ).rejects.toThrow();
    });
  });
});
