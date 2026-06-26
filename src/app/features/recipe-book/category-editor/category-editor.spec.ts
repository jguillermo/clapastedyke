import { TestBed } from '@angular/core/testing';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { makeConvertibleCategory, makeRecipeBookFakes } from '@core/recipe-book/testing/recipe-book-test-doubles';
import { ConversionOption } from '@core/recipe-book/domain/entities/conversion-option';
import { Flavor } from '@core/recipe-book/domain/entities/flavor';
import { ConversionOptionRepository } from '@core/recipe-book/domain/repositories/conversion-option.repository';
import { FlavorRepository } from '@core/recipe-book/domain/repositories/flavor.repository';
import { RecipeCategoryRepository } from '@core/recipe-book/domain/repositories/recipe-category.repository';
import { EntityId } from '@core/_common/entity-id';
import { CategoryEditor, type CategoryEditorData } from './category-editor';

interface EditorInternals {
  properties: { at(i: number): { controls: { selectable: { setValue(v: boolean): void } } } };
  itemsAt(i: number): { at(j: number): { controls: { label: { setValue(v: string): void }; factor: { setValue(v: string): void } } } };
  addItem(i: number): void;
  save(): Promise<void>;
}

describe('CategoryEditor (catalogs + visibility)', () => {
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();
    const category = makeConvertibleCategory('cat'); // Sabor(0) / Porciones(1) / Molde(2)
    const data: CategoryEditorData = {
      category,
      flavors: [{ id: 'flv-vainilla', label: 'Vainilla' }],
      conversionOptions: [{ id: 'co-p-double', group: 'portions', label: 'Doble', factor: 2 }],
    };
    TestBed.configureTestingModule({
      imports: [CategoryEditor],
      providers: [
        ...makeRecipeBookFakes().providers,
        { provide: MIGO_DIALOG_DATA, useValue: data },
        { provide: MigoDialogRef, useValue: { close: closeSpy } },
      ],
    });
    // Los catálogos que ve el editor existen en sus repositorios (como en el hub real).
    await TestBed.inject(RecipeCategoryRepository).save(category);
    await TestBed.inject(FlavorRepository).save(Flavor.create(new EntityId('flv-vainilla'), 'Vainilla'));
    await TestBed.inject(ConversionOptionRepository).save(
      ConversionOption.create(new EntityId('co-p-double'), 'portions', 'Doble', 2),
    );
  });

  it('toggling visibility + adding a flavor → save → persists selectable and the new flavor', async () => {
    const fixture = TestBed.createComponent(CategoryEditor);
    fixture.detectChanges();
    const c = fixture.componentInstance as unknown as EditorInternals;

    // Ocultar Sabor al seleccionar y añadir un nuevo sabor al catálogo.
    c.properties.at(0).controls.selectable.setValue(false);
    c.addItem(0);
    c.itemsAt(0).at(1).controls.label.setValue('Chocolate');

    await c.save();

    const category = await TestBed.inject(RecipeCategoryRepository).byId(new EntityId('cat'));
    expect(category?.property('cat-sabor')?.selectable).toBe(false);
    expect(category?.property('cat-porciones')?.selectable).toBe(true);

    const flavors = await TestBed.inject(FlavorRepository).all();
    expect(flavors.map((f) => f.label)).toEqual(expect.arrayContaining(['Vainilla', 'Chocolate']));

    // El catálogo de porciones sigue intacto.
    expect(await TestBed.inject(ConversionOptionRepository).byGroup('portions')).toHaveLength(1);

    expect(closeSpy).toHaveBeenCalled();
  });
});
