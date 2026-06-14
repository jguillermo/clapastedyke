import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import { RecipeBook } from './recipe-book';

const emptyCatalog: RecipeBookCatalog = {
  ingredients: [],
  sponges: [],
  fillings: [],
  coverings: [],
  packagingRules: [],
};

class ListRecipeBookStub {
  catalog: RecipeBookCatalog = emptyCatalog;
  async execute(): Promise<RecipeBookCatalog> {
    return this.catalog;
  }
}

describe('RecipeBook (hub)', () => {
  function setup() {
    const dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
    TestBed.configureTestingModule({
      imports: [RecipeBook],
      providers: [
        { provide: ListRecipeBook, useClass: ListRecipeBookStub },
        { provide: MigoDialog, useValue: dialog },
        { provide: MigoDialogRef, useValue: { close: () => {} } },
      ],
    });
    const fixture = TestBed.createComponent(RecipeBook);
    fixture.detectChanges();
    return { fixture, dialog };
  }

  it('shows the empty state when there are no sponges', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu libro está en blanco');
  });

  it('opens the sponge form when the CTA is clicked', async () => {
    const { fixture, dialog } = setup();
    await fixture.whenStable();
    fixture.detectChanges();

    const cta = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Crea tu primer queque'),
    ) as HTMLButtonElement;
    cta.click();

    expect(dialog.open).toHaveBeenCalledTimes(1);
  });
});
