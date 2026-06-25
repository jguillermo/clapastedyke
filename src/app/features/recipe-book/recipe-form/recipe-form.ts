import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { CardSubtitle } from '@components/card/card-subtitle';
import { Icon } from '@components/icon/icon';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { SelectTag, type SelectTagType } from '@components/select-tag/select-tag';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { MeasureInput } from '@core/recipe-book/domain/value-objects/measure-input';
import type { RecipeCategory } from '@core/recipe-book/domain/entities/recipe-category';
import { SaveRecipe } from '@core/recipe-book/application/use-cases/save-recipe.use-case';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { IngredientGrid, type IngredientOption, type InitialLine } from '../_shared/ingredient-grid/ingredient-grid';
import { messageOf, union, validateForType } from '../_shared/recipe-form.utils';

export type { IngredientOption };

/** Receta existente proyectada para precargar el formulario al editar. */
export interface RecipeFormPrefill {
  name: string;
  /** Valor (texto visible) por id de propiedad. */
  values: Record<string, string>;
  lines: InitialLine[];
}

/** Datos del diálogo: la categoría (esquema), insumos, sugerencias y receta a editar. */
export interface RecipeFormData {
  category: RecipeCategory;
  ingredients: IngredientOption[];
  /** Sugerencias por id de propiedad (valores ya usados por otras recetas). */
  valuesByProp: Record<string, string[]>;
  recipe?: RecipeFormPrefill;
}

/**
 * Formulario de receta **dinámico**: el título y la grilla de insumos van siempre;
 * los demás campos se generan según el esquema de propiedades de la categoría
 * (texto/número/peso, obligatorias u opcionales). Reutiliza la grilla de
 * ingredientes y el `migo-select-tag` para capturar los valores de propiedad.
 */
@Component({
  selector: 'app-recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Icon,
    FormField,
    InputField,
    SelectTag,
    IngredientGrid,
  ],
  host: { '(focusout)': 'bumpInteraction()' },
  templateUrl: './recipe-form.html',
})
export class RecipeForm {
  private readonly fb = inject(FormBuilder);
  private readonly saveRecipe = inject(SaveRecipe);
  private readonly saveIngredient = inject(SaveIngredient);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<RecipeFormData>(MIGO_DIALOG_DATA);

  protected readonly category = this.data.category;
  protected readonly ingredientOptions = this.data.ingredients;
  private readonly prefill = this.data.recipe ?? null;
  protected readonly editing = this.prefill !== null;
  protected readonly title = this.editing ? 'Editar receta' : 'Nueva receta';
  protected readonly saveLabel = this.editing ? 'Guardar cambios' : 'Guardar receta';
  protected readonly initialLines = this.prefill?.lines ?? [];
  protected readonly initialChars: Record<string, string> = this.prefill?.values ?? {};
  protected readonly hasProperties = this.category.properties.length > 0;

  protected readonly form = this.fb.nonNullable.group({
    name: [{ value: this.prefill?.name ?? '', disabled: this.editing }, Validators.required],
  });

  protected readonly chars = signal<Record<string, string>>({ ...this.initialChars });
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  private readonly grid = viewChild(IngredientGrid);
  private readonly valueTick = toSignal(this.form.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  protected readonly charTypes = computed<SelectTagType[]>(() =>
    this.category.properties.map((property) => ({
      key: property.id,
      label: property.required ? property.name : `${property.name} (opcional)`,
      values: union([], this.data.valuesByProp[property.id]),
      allowCreate: true,
      validate: validateForType(property.type),
    })),
  );

  protected readonly nameError = computed(() => this.errorFor(this.form.controls.name, 'El nombre es obligatorio.'));

  protected readonly charsError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    const missing = this.firstMissingRequired();
    return missing ? `Completa "${missing}".` : '';
  });

  protected onChars(selection: Record<string, string>): void {
    this.chars.set(selection);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    this.interaction.update((n) => n + 1);

    const grid = this.grid();
    grid?.markSubmitted();

    if (this.form.controls.name.invalid || this.firstMissingRequired()) {
      return;
    }

    const parsed = grid?.collect() ?? null;
    if (!parsed) {
      return;
    }

    const values = this.buildValues();
    if (!values) {
      return;
    }

    this.saving.set(true);
    try {
      const lines: { ingredientId: string; quantity: number }[] = [];
      for (const item of parsed) {
        const { id } = await this.saveIngredient.execute({
          name: item.name,
          baseUnit: item.baseUnit,
          usage: 'recipe',
          purchasePrice: item.purchase,
        });
        lines.push({ ingredientId: id, quantity: item.quantity });
      }
      const result = await this.saveRecipe.execute({
        categoryId: this.category.id.value,
        name: this.form.getRawValue().name,
        values,
        lines,
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

  protected bumpInteraction(): void {
    this.interaction.update((n) => n + 1);
  }

  // --- Helpers ---

  /** Convierte los valores del select-tag a la entrada de SaveRecipe (peso → gramos). */
  private buildValues(): { propertyId: string; value: string | number }[] | null {
    const out: { propertyId: string; value: string | number }[] = [];
    for (const property of this.category.properties) {
      const raw = this.chars()[property.id]?.trim();
      if (!raw) {
        continue;
      }
      if (property.type === 'weight') {
        const measure = MeasureInput.parse(raw, 'mass');
        if (!measure.quantity) {
          this.errorMessage.set(`El valor de "${property.name}" no es un peso válido.`);
          return null;
        }
        out.push({ propertyId: property.id, value: measure.quantity.value });
      } else if (property.type === 'number') {
        out.push({ propertyId: property.id, value: Number(raw) });
      } else {
        out.push({ propertyId: property.id, value: raw });
      }
    }
    return out;
  }

  /** Nombre de la primera propiedad obligatoria sin valor válido (o null si todas ok). */
  private firstMissingRequired(): string | null {
    for (const property of this.category.properties) {
      if (!property.required) {
        continue;
      }
      const raw = this.chars()[property.id]?.trim();
      const ok = property.type === 'weight' ? !!raw && MeasureInput.parse(raw, 'mass').isValid : !!raw;
      if (!ok) {
        return property.name;
      }
    }
    return null;
  }

  private shows(control: AbstractControl): boolean {
    this.valueTick();
    this.interaction();
    this.submitted();
    return control.invalid && (control.touched || this.submitted());
  }

  private errorFor(control: AbstractControl, message: string): string {
    return this.shows(control) ? message : '';
  }
}
