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
import { SaveSpongeRecipe } from '@core/recipe-book/application/use-cases/save-sponge-recipe.use-case';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { IngredientGrid, type IngredientOption } from '../_shared/ingredient-grid/ingredient-grid';
import { messageOf, union, validateLabel, validateMass, validateServings } from '../_shared/recipe-form.utils';

import type { InitialLine } from '../_shared/ingredient-grid/ingredient-grid';

export type { IngredientOption };

/** Receta existente proyectada para precargar el formulario al editar. */
export interface SpongeRecipePrefill {
  name: string;
  flavor?: string;
  weightLabel: string;
  servings?: string;
  size?: string;
  lines: InitialLine[];
}

/** Datos del diálogo: insumos existentes (con precio) + valores por característica. */
export interface SpongeFormData {
  ingredients: IngredientOption[];
  valuesByType: Record<string, string[]>;
  /** Si viene, el formulario abre en modo edición precargado (nombre bloqueado). */
  recipe?: SpongeRecipePrefill;
}

/** Valores por defecto de cada tipo (sugerencias; los añadidos se reutilizan vía `valuesByType`). */
const DEFAULT_VALUES: Record<string, readonly string[]> = {
  sabor: ['Vainilla', 'Chocolate'],
  peso: ['1 kg', '2 kg', '5 kg'],
  porciones: ['2', '4', '8', '10', '40'],
  'tamaño': ['Grande', 'Mediano', 'Pequeño'],
};

/**
 * Formulario "Nuevo queque": cabecera (nombre + características) sobre la grilla de
 * ingredientes compartida ({@link IngredientGrid}). El peso de las características
 * gobierna el escalado de toda la torta.
 */
@Component({
  selector: 'app-sponge-form',
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
  templateUrl: './sponge-form.html',
})
export class SpongeForm {
  private readonly fb = inject(FormBuilder);
  private readonly saveSponge = inject(SaveSpongeRecipe);
  private readonly saveIngredient = inject(SaveIngredient);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<SpongeFormData | null>(MIGO_DIALOG_DATA, { optional: true });

  protected readonly ingredientOptions = this.data?.ingredients ?? [];
  private readonly prefill = this.data?.recipe ?? null;
  protected readonly editing = this.prefill !== null;
  protected readonly title = this.editing ? 'Editar queque' : 'Nuevo queque';
  protected readonly saveLabel = this.editing ? 'Guardar cambios' : 'Guardar queque';
  protected readonly initialLines = this.prefill?.lines ?? [];
  protected readonly initialChars: Record<string, string> = this.prefill ? spongeCharsOf(this.prefill) : {};

  protected readonly form = this.fb.nonNullable.group({
    name: [{ value: this.prefill?.name ?? '', disabled: this.editing }, Validators.required],
  });

  protected readonly chars = signal<Record<string, string>>(this.prefill ? spongeCharsOf(this.prefill) : {});
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  private readonly grid = viewChild(IngredientGrid);
  private readonly valueTick = toSignal(this.form.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  protected readonly charTypes = computed<SelectTagType[]>(() => {
    const used = this.data?.valuesByType ?? {};
    return [
      { key: 'sabor', label: 'Sabor', values: union(DEFAULT_VALUES['sabor'], used['sabor']), allowCreate: true, validate: validateLabel },
      { key: 'peso', label: 'Peso', values: union(DEFAULT_VALUES['peso'], used['peso']), allowCreate: true, validate: validateMass },
      { key: 'porciones', label: 'Porciones', values: union(DEFAULT_VALUES['porciones'], used['porciones']), allowCreate: true, validate: validateServings },
      { key: 'tamaño', label: 'Tamaño', values: union(DEFAULT_VALUES['tamaño'], used['tamaño']), allowCreate: true, validate: validateLabel },
    ];
  });

  protected readonly nameError = computed(() => this.errorFor(this.form.controls.name, 'El nombre es obligatorio.'));

  protected readonly charsError = computed(() => {
    if (!this.submitted()) return '';
    return MeasureInput.parse(this.chars()['peso'] ?? '', 'mass').isValid ? '' : 'Elige el peso del queque.';
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
      return; // charsError avisa del peso
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
      const result = await this.saveSponge.execute({
        name: this.form.getRawValue().name,
        flavor: this.chars()['sabor'] || undefined,
        referenceYield: {
          weightGrams: weight.quantity.value,
          servings: this.servingsFromChars(),
          size: this.chars()['tamaño'] || undefined,
        },
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

  private servingsFromChars(): number | undefined {
    const raw = this.chars()['porciones'];
    const n = raw ? Number(raw) : NaN;
    return Number.isInteger(n) && n > 0 ? n : undefined;
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

/** Características de un queque existente en el formato del `migo-select-tag`. */
function spongeCharsOf(prefill: SpongeRecipePrefill): Record<string, string> {
  const chars: Record<string, string> = { peso: prefill.weightLabel };
  if (prefill.flavor) chars['sabor'] = prefill.flavor;
  if (prefill.servings) chars['porciones'] = prefill.servings;
  if (prefill.size) chars['tamaño'] = prefill.size;
  return chars;
}
