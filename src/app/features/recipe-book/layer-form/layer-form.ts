import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { SelectTag, type SelectTagType } from '@components/select-tag/select-tag';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { MeasureInput } from '@core/recipe-book/domain/value-objects/measure-input';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { SaveFillingRecipe } from '@core/recipe-book/application/use-cases/save-filling-recipe.use-case';
import { SaveCoveringRecipe } from '@core/recipe-book/application/use-cases/save-covering-recipe.use-case';
import { IngredientGrid, type IngredientOption, type InitialLine } from '../_shared/ingredient-grid/ingredient-grid';
import { messageOf, union, validateMass } from '../_shared/recipe-form.utils';

/** Una capa escalada por el peso del queque: relleno o cobertura (isomorfas). */
export type LayerKind = 'filling' | 'covering';

/** Capa existente proyectada para precargar el formulario al editar. */
export interface LayerRecipePrefill {
  name: string;
  weightLabel: string;
  lines: InitialLine[];
}

/** Datos del diálogo: tipo de capa, insumos existentes y pesos ya usados (sugerencias). */
export interface LayerFormData {
  kind: LayerKind;
  ingredients: IngredientOption[];
  usedWeights: string[];
  /** Si viene, el formulario abre en modo edición precargado (nombre bloqueado). */
  recipe?: LayerRecipePrefill;
}

const DEFAULT_WEIGHTS = ['1 kg', '2 kg', '5 kg'];

interface LayerCopy {
  title: string;
  saveLabel: string;
  ariaChars: string;
}

const COPY: Record<LayerKind, LayerCopy> = {
  filling: { title: 'Nuevo relleno', saveLabel: 'Guardar relleno', ariaChars: 'Para cuánto rinde el relleno' },
  covering: { title: 'Nueva cobertura', saveLabel: 'Guardar cobertura', ariaChars: 'Para cuánto rinde la cobertura' },
};

/**
 * Formulario de capa (relleno / cobertura). Misma forma para ambas (isomorfas):
 * nombre + un peso de referencia ("¿para cuánto rinde?") sobre la grilla de
 * ingredientes compartida ({@link IngredientGrid}). El `kind` decide los textos y
 * el caso de uso al que se guarda.
 */
@Component({
  selector: 'app-layer-form',
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
    SelectTag,
    IngredientGrid,
  ],
  host: { '(focusout)': 'bumpInteraction()' },
  templateUrl: './layer-form.html',
})
export class LayerForm {
  private readonly fb = inject(FormBuilder);
  private readonly saveIngredient = inject(SaveIngredient);
  private readonly saveFilling = inject(SaveFillingRecipe);
  private readonly saveCovering = inject(SaveCoveringRecipe);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<LayerFormData | null>(MIGO_DIALOG_DATA, { optional: true });

  protected readonly kind: LayerKind = this.data?.kind ?? 'filling';
  protected readonly ingredientOptions = this.data?.ingredients ?? [];
  private readonly prefill = this.data?.recipe ?? null;
  protected readonly editing = this.prefill !== null;
  protected readonly copy = COPY[this.kind];
  protected readonly title = this.editing ? (this.kind === 'filling' ? 'Editar relleno' : 'Editar cobertura') : this.copy.title;
  protected readonly saveLabel = this.editing ? 'Guardar cambios' : this.copy.saveLabel;
  protected readonly initialLines = this.prefill?.lines ?? [];
  protected readonly initialChars: Record<string, string> = this.prefill ? { peso: this.prefill.weightLabel } : {};

  protected readonly form = this.fb.nonNullable.group({
    name: [{ value: this.prefill?.name ?? '', disabled: this.editing }, Validators.required],
  });

  protected readonly chars = signal<Record<string, string>>(this.prefill ? { peso: this.prefill.weightLabel } : {});
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  private readonly grid = viewChild(IngredientGrid);
  private readonly valueTick = toSignal(this.form.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  protected readonly weightTypes = computed<SelectTagType[]>(() => [
    {
      key: 'peso',
      label: '¿Para cuánto rinde?',
      values: union(DEFAULT_WEIGHTS, this.data?.usedWeights),
      allowCreate: true,
      validate: validateMass,
    },
  ]);

  protected readonly nameError = computed(() => this.errorFor(this.form.controls.name, 'El nombre es obligatorio.'));

  protected readonly weightError = computed(() => {
    if (!this.submitted()) return '';
    return MeasureInput.parse(this.chars()['peso'] ?? '', 'mass').isValid ? '' : 'Elige para cuánto rinde.';
  });

  // --- Acciones ---

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

    if (this.form.controls.name.invalid) {
      return;
    }

    const parsed = grid?.collect() ?? null;
    if (!parsed) {
      return;
    }

    const weight = MeasureInput.parse(this.chars()['peso'] ?? '', 'mass');
    if (!weight.quantity) {
      return; // weightError avisa del peso
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
      const request = {
        name: this.form.getRawValue().name,
        referenceWeightGrams: weight.quantity.value,
        lines,
      };
      const result =
        this.kind === 'filling'
          ? await this.saveFilling.execute(request)
          : await this.saveCovering.execute(request);
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
