import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { makeRecipeBookFakes, makeWeightCategory } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { RecipeBook } from './recipe-book';

const emptyCatalog: RecipeBookCatalog = {
  ingredients: [],
  categories: [],
  recipes: [],
  packagingRules: [],
  flavors: [],
  conversionOptions: [],
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

  it('shows the ingredients section and no "create category" action', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Insumos');
    expect(fixture.nativeElement.textContent).not.toContain('Crear categoría');
  });

  it('opens the category editor when "Editar categoría" is clicked', async () => {
    const category = makeWeightCategory('cat-q', 'Queques');
    const { fixture, dialog } = setup({ ...emptyCatalog, categories: [category] });
    await fixture.whenStable();
    fixture.detectChanges();
    findButton(fixture, 'Editar categoría').click();
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('renders a section per category with its "Agregar receta" action', async () => {
    const category = makeWeightCategory('cat-q', 'Queques');
    const { fixture } = setup({ ...emptyCatalog, categories: [category] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Queques');
    expect(fixture.nativeElement.textContent).toContain('Agregar receta');
  });
});
