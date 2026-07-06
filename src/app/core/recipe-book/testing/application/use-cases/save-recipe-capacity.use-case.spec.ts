import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { EventBus } from '../../../../_common/event-bus';
import { makeRecipeBookFakes, RecordingEventBus } from '../../recipe-book-test-doubles';
import { RecipeCapacityRepository } from '../../../domain/repositories/recipe-capacity.repository';
import { SaveRecipeCapacity } from '../../../application/use-cases/save-recipe-capacity.use-case';

describe('SaveRecipeCapacity', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('creates an option in its group and publishes RecipeCapacitySaved', async () => {
    const { id } = await TestBed.inject(SaveRecipeCapacity).execute({
      group: 'mold',
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

  it('edits an existing option by id', async () => {
    const repo = TestBed.inject(RecipeCapacityRepository);
    const { id } = await TestBed.inject(SaveRecipeCapacity).execute({ group: 'mold', label: 'Doble', factor: 2 });

    await TestBed.inject(SaveRecipeCapacity).execute({ id, group: 'mold', label: 'Doble', factor: 2.5 });

    expect((await repo.byId(new EntityId(id)))?.factor).toBe(2.5);
  });

  it('dedups by group+label: creating the same option twice reuses it', async () => {
    const uc = TestBed.inject(SaveRecipeCapacity);
    const a = await uc.execute({ group: 'mold', label: 'Molde grande', factor: 2 });
    const b = await uc.execute({ group: 'mold', label: 'molde grande', factor: 2 });
    expect(b.id).toBe(a.id);
    expect(await TestBed.inject(RecipeCapacityRepository).byGroup('mold')).toHaveLength(1);
  });

  it('rejects a non-positive factor (domain invariant)', async () => {
    await expect(
      TestBed.inject(SaveRecipeCapacity).execute({ group: 'mold', label: 'Cero', factor: 0 }),
    ).rejects.toThrow();
  });
});
