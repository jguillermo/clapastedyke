import { TestBed } from '@angular/core/testing';
import { EntityId } from '../../../../_common/entity-id';
import { makeRecipeBookFakes } from '../../recipe-book-test-doubles';
import { RecipeFlavorRepository } from '../../../domain/repositories/recipe-flavor.repository';
import { SaveRecipeFlavor } from '../../../application/use-cases/save-recipe-flavor.use-case';
import { RecordingEventBus } from '../../recipe-book-test-doubles';
import { EventBus } from '../../../../_common/event-bus';

describe('SaveRecipeFlavor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeRecipeBookFakes().providers });
  });

  it('creates a flavor and publishes FlavorSaved (new)', async () => {
    const { id } = await TestBed.inject(SaveRecipeFlavor).execute({ label: 'Vainilla' });

    const saved = await TestBed.inject(RecipeFlavorRepository).byId(new EntityId(id));
    expect(saved?.label).toBe('Vainilla');

    const bus = TestBed.inject(EventBus) as RecordingEventBus;
    expect(bus.names()).toContain('FlavorSaved');
  });

  it('dedups by label: creating the same flavor twice reuses it (no duplicate)', async () => {
    const a = await TestBed.inject(SaveRecipeFlavor).execute({ label: 'Vainilla' });
    const b = await TestBed.inject(SaveRecipeFlavor).execute({ label: 'vainilla' });
    expect(b.id).toBe(a.id);
    expect(await TestBed.inject(RecipeFlavorRepository).all()).toHaveLength(1);
  });

  it('renames an existing flavor by id', async () => {
    const repo = TestBed.inject(RecipeFlavorRepository);
    const { id } = await TestBed.inject(SaveRecipeFlavor).execute({ label: 'Vainilla' });

    await TestBed.inject(SaveRecipeFlavor).execute({ id, label: 'Vainilla francesa' });

    const renamed = await repo.byId(new EntityId(id));
    expect(renamed?.label).toBe('Vainilla francesa');
  });
});
