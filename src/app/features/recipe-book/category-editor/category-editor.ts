import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, type FormControl } from '@angular/forms';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { Select, type SelectOption } from '@components/select/select';
import { Checkbox } from '@components/checkbox/checkbox';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { PropertyType } from '@core/recipe-book/domain/value-objects/recipe-property';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import {
  SaveRecipeCategory,
  type RecipePropertyInput,
} from '@core/recipe-book/application/use-cases/save-recipe-category.use-case';
import { messageOf } from '../_shared/recipe-form.utils';

/** Datos del diálogo: la categoría a editar (ausente = crear una nueva). */
export interface CategoryEditorData {
  category?: RecipeCategory;
}

type PropertyGroup = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
  type: FormControl<PropertyType>;
  required: FormControl<boolean>;
  locked: FormControl<boolean>;
}>;

/**
 * Editor de una CATEGORÍA: nombre + lista de propiedades de su esquema (cada una
 * con nombre, tipo y si es obligatoria). Crear o editar. Las propiedades
 * bloqueadas (p. ej. el Peso de las categorías de sistema) se muestran pero no se
 * pueden quitar ni volver opcionales.
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
    FormField,
    InputField,
    Select,
    Checkbox,
  ],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  templateUrl: './category-editor.html',
})
export class CategoryEditor {
  private readonly fb = inject(FormBuilder);
  private readonly saveCategory = inject(SaveRecipeCategory);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<CategoryEditorData | null>(MIGO_DIALOG_DATA, { optional: true });

  private readonly category = this.data?.category ?? null;
  protected readonly editing = this.category !== null;
  protected readonly title = this.editing ? 'Editar categoría' : 'Nueva categoría';

  protected readonly typeOptions: SelectOption[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'weight', label: 'Peso' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: [this.category?.name ?? '', Validators.required],
    properties: this.fb.array<PropertyGroup>([]),
  });

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly submitted = signal(false);

  constructor() {
    for (const property of this.category?.properties ?? []) {
      this.form.controls.properties.push(
        this.propertyGroup(property.id, property.name, property.type, property.required, property.locked),
      );
    }
  }

  protected get properties(): FormArray<PropertyGroup> {
    return this.form.controls.properties;
  }

  protected get nameError(): string {
    const control = this.form.controls.name;
    return this.submitted() && control.invalid ? 'El nombre es obligatorio.' : '';
  }

  protected addProperty(): void {
    this.properties.push(this.propertyGroup('', '', 'text', false, false));
  }

  protected removeProperty(index: number): void {
    if (!this.properties.at(index).getRawValue().locked) {
      this.properties.removeAt(index);
    }
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.form.controls.name.markAsTouched();
    if (this.form.controls.name.invalid) {
      return;
    }

    const properties: RecipePropertyInput[] = this.properties.controls
      .map((group) => group.getRawValue())
      .filter((p) => p.name.trim())
      .map((p) => ({ id: p.id || undefined, name: p.name.trim(), type: p.type, required: p.required }));

    this.saving.set(true);
    try {
      const result = await this.saveCategory.execute({
        id: this.category?.id.value,
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

  private propertyGroup(
    id: string,
    name: string,
    type: PropertyType,
    required: boolean,
    locked: boolean,
  ): PropertyGroup {
    return this.fb.nonNullable.group({
      id: [id],
      name: [{ value: name, disabled: locked }],
      type: [{ value: type, disabled: locked }],
      required: [{ value: required, disabled: locked }],
      locked: [locked],
    });
  }
}
