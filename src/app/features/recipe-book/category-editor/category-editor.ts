import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, type FormControl } from '@angular/forms';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { Spacer } from '@components/spacer/spacer';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { Checkbox } from '@components/checkbox/checkbox';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { PropertyType } from '@core/recipe-book/domain/value-objects/recipe-property';
import type { ConversionGroup } from '@core/recipe-book/domain/entities/conversion-option';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import {
  SaveRecipeCategory,
  type RecipePropertyInput,
} from '@core/recipe-book/application/use-cases/save-recipe-category.use-case';
import { SaveFlavor } from '@core/recipe-book/application/use-cases/save-flavor.use-case';
import { DeleteFlavor } from '@core/recipe-book/application/use-cases/delete-flavor.use-case';
import { SaveConversionOption } from '@core/recipe-book/application/use-cases/save-conversion-option.use-case';
import { DeleteConversionOption } from '@core/recipe-book/application/use-cases/delete-conversion-option.use-case';
import { messageOf } from '../_shared/recipe-form.utils';

/** Entrada de catálogo (sabor u opción de conversión) editada dentro de una propiedad. */
export interface CatalogItemSeed {
  id: string;
  group: ConversionGroup;
  label: string;
  factor: number;
}

/** Datos del diálogo: la categoría a editar + los catálogos a gestionar. */
export interface CategoryEditorData {
  category: RecipeCategory;
  flavors?: { id: string; label: string }[];
  conversionOptions?: CatalogItemSeed[];
}

type CatalogItemGroup = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
  factor: FormControl<string>;
}>;

type PropertyGroup = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
  type: FormControl<PropertyType>;
  group: FormControl<string>;
  required: FormControl<boolean>;
  selectable: FormControl<boolean>;
  items: FormArray<CatalogItemGroup>;
}>;

/**
 * Editor de una CATEGORÍA. Las propiedades son fijas (generadas en código): aquí NO
 * se crean, borran ni se cambia su tipo. Para cada propiedad se gestiona:
 * - el check **"visible al seleccionar"** (`selectable`), y
 * - su catálogo: sabores (label) para `flavor`; opciones (label + factor) para `options`.
 */
@Component({
  selector: 'app-category-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    CardFooter,
    Icon,
    Spacer,
    FormField,
    InputField,
    Checkbox,
  ],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  templateUrl: './category-editor.html',
})
export class CategoryEditor {
  private readonly fb = inject(FormBuilder);
  private readonly saveCategory = inject(SaveRecipeCategory);
  private readonly saveFlavor = inject(SaveFlavor);
  private readonly deleteFlavor = inject(DeleteFlavor);
  private readonly saveOption = inject(SaveConversionOption);
  private readonly deleteOption = inject(DeleteConversionOption);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<CategoryEditorData>(MIGO_DIALOG_DATA);

  private readonly category = this.data.category;
  protected readonly title = `Editar ${this.category.name}`;

  private readonly seedFlavors = this.data.flavors ?? [];
  private readonly seedOptions = this.data.conversionOptions ?? [];
  /** Ids de catálogo presentes al abrir, para detectar los borrados al guardar. */
  private readonly originalFlavorIds = new Set(this.seedFlavors.map((f) => f.id));
  private readonly originalOptionIds = new Set(this.seedOptions.map((o) => o.id));

  protected readonly form = this.fb.nonNullable.group({
    name: [this.category.name, Validators.required],
    properties: this.fb.array<PropertyGroup>([]),
  });

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    for (const property of this.category.properties) {
      this.properties.push(
        this.propertyGroup(
          property.id,
          property.name,
          property.type,
          property.group ?? '',
          property.required,
          property.selectable,
        ),
      );
    }
  }

  protected get properties(): FormArray<PropertyGroup> {
    return this.form.controls.properties;
  }

  protected get nameError(): string {
    const control = this.form.controls.name;
    return control.touched && control.invalid ? 'El nombre es obligatorio.' : '';
  }

  protected itemsAt(index: number): FormArray<CatalogItemGroup> {
    return this.properties.at(index).controls.items;
  }

  protected isCatalog(index: number): boolean {
    const type = this.properties.at(index).getRawValue().type;
    return type === 'flavor' || type === 'options';
  }

  protected hasFactor(index: number): boolean {
    return this.properties.at(index).getRawValue().type === 'options';
  }

  /** Grupo numérico: la opción ES un número (porciones), donde label == factor. */
  protected isNumericGroup(index: number): boolean {
    return this.properties.at(index).getRawValue().group === 'portions';
  }

  protected propertyName(index: number): string {
    return this.properties.at(index).getRawValue().name;
  }

  protected addItem(index: number): void {
    this.itemsAt(index).push(this.itemGroup('', '', '1'));
  }

  protected removeItem(index: number, itemIndex: number): void {
    this.itemsAt(index).removeAt(itemIndex);
  }

  protected async save(): Promise<void> {
    this.errorMessage.set('');
    this.form.controls.name.markAsTouched();
    if (this.form.controls.name.invalid) {
      return;
    }

    const rows = this.properties.controls.map((g) => g.getRawValue());

    // Las porciones son números enteros positivos.
    const badPortions = rows.some(
      (r) =>
        r.type === 'options' &&
        r.group === 'portions' &&
        r.items.some((i) => {
          const raw = i.factor.trim();
          return raw !== '' && (!Number.isInteger(Number(raw)) || Number(raw) <= 0);
        }),
    );
    if (badPortions) {
      this.errorMessage.set('Las porciones deben ser números enteros positivos.');
      return;
    }

    const properties: RecipePropertyInput[] = rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      required: p.required,
      group: p.type === 'options' ? (p.group as ConversionGroup) : undefined,
      selectable: p.selectable,
    }));

    this.saving.set(true);
    try {
      await this.syncCatalogs(rows);
      const result = await this.saveCategory.execute({
        id: this.category.id.value,
        name: this.form.getRawValue().name,
        properties,
      });
      this.ref.close(result);
    } catch (error) {
      this.errorMessage.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    this.ref.close();
  }

  /** Sincroniza los catálogos (sabores + opciones) con lo editado: upsert + borrado de los quitados. */
  private async syncCatalogs(rows: ReturnType<PropertyGroup['getRawValue']>[]): Promise<void> {
    const keptFlavorIds = new Set<string>();
    const keptOptionIds = new Set<string>();

    for (const row of rows) {
      if (row.type === 'flavor') {
        for (const item of row.items) {
          const label = item.label.trim();
          if (!label) continue;
          const { id } = await this.saveFlavor.execute({ id: item.id || undefined, label });
          keptFlavorIds.add(id);
        }
      } else if (row.type === 'options') {
        const group = row.group as ConversionGroup;
        // Porciones es numérico: el número ES el label y el factor a la vez.
        const numeric = group === 'portions';
        for (const item of row.items) {
          const factorRaw = item.factor.trim();
          const label = (numeric ? factorRaw : item.label.trim());
          if (!label || !factorRaw) continue;
          const factor = Number(factorRaw);
          const { id } = await this.saveOption.execute({ id: item.id || undefined, group, label, factor });
          keptOptionIds.add(id);
        }
      }
    }

    for (const id of this.originalFlavorIds) {
      if (!keptFlavorIds.has(id)) {
        await this.deleteFlavor.execute({ id });
      }
    }
    for (const id of this.originalOptionIds) {
      if (!keptOptionIds.has(id)) {
        await this.deleteOption.execute({ id });
      }
    }
  }

  private propertyGroup(
    id: string,
    name: string,
    type: PropertyType,
    group: string,
    required: boolean,
    selectable: boolean,
  ): PropertyGroup {
    return this.fb.nonNullable.group({
      id: [id],
      name: [name],
      type: [type],
      group: [group],
      required: [required],
      selectable: [selectable],
      items: this.fb.array<CatalogItemGroup>(this.seedItemsFor(type, group)),
    });
  }

  /** Precarga las entradas de catálogo de una propiedad de tipo `flavor`/`options`. */
  private seedItemsFor(type: PropertyType, group: string): CatalogItemGroup[] {
    if (type === 'flavor') {
      return this.seedFlavors.map((f) => this.itemGroup(f.id, f.label, '1'));
    }
    if (type === 'options' && group) {
      return this.seedOptions
        .filter((o) => o.group === group)
        .map((o) => this.itemGroup(o.id, o.label, String(o.factor)));
    }
    return [];
  }

  private itemGroup(id: string, label: string, factor: string): CatalogItemGroup {
    return this.fb.nonNullable.group({
      id: [id],
      label: [label],
      factor: [factor],
    });
  }
}
