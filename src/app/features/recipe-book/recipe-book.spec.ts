import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EntityId } from '@core/_common/entity-id';
import { Quantity } from '@core/_common/quantity';
import { SupplyLine } from '@core/recipe-book/domain/value-objects/supply-line';
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { makeRecipeBookFakes, makeCategory, makeRecipe } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { RecipeBook } from './recipe-book';

const emptyCatalog: RecipeBookCatalog = {
  supplies: [],
  categories: [],
  recipes: [],
  flavors: [],
  recipeCapacities: [],
};

class ListRecipeBookStub {
  catalog: RecipeBookCatalog = emptyCatalog;
  async execute(): Promise<RecipeBookCatalog> {
    return this.catalog;
  }
}

describe('RecipeBook (hub)', () => {
  function setup(catalog: RecipeBookCatalog = emptyCatalog) {
    const dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
    const stub = new ListRecipeBookStub();
    stub.catalog = catalog;
    TestBed.configureTestingModule({
      imports: [RecipeBook],
      providers: [
        ...makeRecipeBookFakes().providers, // repos + EventBus para la lista de insumos embebida
        { provide: ListRecipeBook, useValue: stub },
        { provide: MigoDialog, useValue: dialog },
        { provide: MigoDialogRef, useValue: { close: () => {} } },
      ],
    });
    const fixture = TestBed.createComponent(RecipeBook);
    fixture.detectChanges();
    return { fixture, dialog };
  }

  function findButton(fixture: { nativeElement: HTMLElement }, text: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes(text),
    ) as HTMLButtonElement;
  }

  const categoryWithRecipe = (): RecipeBookCatalog => ({
    ...emptyCatalog,
    categories: [makeCategory('cat-q', 'Queques')],
    recipes: [makeRecipe('re-1', 'cat-q', 'Vainilla', [SupplyLine.of(new EntityId('ing-1'), Quantity.of(100, 'g'))])],
  });

  it('shows the supplies section and no create/edit actions', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Insumos');
    expect(fixture.nativeElement.textContent).not.toContain('Crear categoría');
    expect(fixture.nativeElement.textContent).not.toContain('Editar categoría');
    expect(fixture.nativeElement.textContent).not.toContain('Agregar receta');
  });

  it('renders a section per category with its recipes', async () => {
    const { fixture } = setup(categoryWithRecipe());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Queques');
    expect(fixture.nativeElement.textContent).toContain('Vainilla');
  });

  it('opens the read-only recipe detail when a recipe row is clicked', async () => {
    const { fixture, dialog } = setup(categoryWithRecipe());
    await fixture.whenStable();
    fixture.detectChanges();
    findButton(fixture, 'Vainilla').click();
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });
});
