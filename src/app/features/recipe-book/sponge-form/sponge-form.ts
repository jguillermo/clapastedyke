import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type FormControl,
} from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { UnitInput, type UnitToken } from '@components/unit-input/unit-input';
import { Autocomplete } from '@components/autocomplete/autocomplete';
import { Grid, type GridColumn } from '@components/grid/grid';
import { SelectTag, type SelectTagType } from '@components/select-tag/select-tag';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { MeasureInput } from '@core/recipe-book/domain/value-objects/measure-input';
import { SaveSpongeRecipe } from '@core/recipe-book/application/use-cases/save-sponge-recipe.use-case';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';

/** Datos del diálogo: ingredientes existentes + valores ya usados por tipo de característica. */
export interface SpongeFormData {
  ingredients: string[];
  valuesByType: Record<string, string[]>;
}

type LineGroup = FormGroup<{
  name: FormControl<string>;
  quantity: FormControl<string>;
  unit: FormControl<string>;
}>;

/** Valores por defecto de cada tipo (sugerencias; los añadidos se reutilizan vía `valuesByType`). */
const DEFAULT_VALUES: Record<string, readonly string[]> = {
  sabor: ['Vainilla', 'Chocolate'],
  peso: ['1 kg', '2 kg', '5 kg'],
  porciones: ['2', '4', '8', '10', '40'],
  'tamaño': ['Grande', 'Mediano', 'Pequeño'],
};

/**
 * Formulario "Nuevo queque". Ingredientes en grilla y un **único campo** ({@link
 * SelectTag}) que recoge sabor + peso + porciones + tamaño como chips. Al guardar,
 * la vista reparte: `sabor → flavor` (propiedad) y `peso/porciones/tamaño →
 * referenceYield` (peso normalizado con {@link MeasureInput}, manda el escalado).
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
    UnitInput,
    Autocomplete,
    Grid,
    SelectTag,
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

  protected readonly columns: readonly GridColumn[] = [
    { label: 'Ingrediente' },
    { label: 'Cantidad', width: 'w-40' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lines: this.fb.array<LineGroup>([this.newLine()]),
  });

  protected readonly chars = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  private readonly valueTick = toSignal(this.form.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  constructor() {
    this.form.controls.lines.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.ensureTrailingRow());
  }

  protected get lines(): FormArray<LineGroup> {
    return this.form.controls.lines;
  }

  protected readonly lineControls = computed(() => {
    this.valueTick();
    return [...this.lines.controls];
  });

  /** Tipos del campo único: defaults ∪ valores ya usados, con validación de dominio por tipo. */
  protected readonly charTypes = computed<SelectTagType[]>(() => {
    const used = this.data?.valuesByType ?? {};
    return [
      { key: 'sabor', label: 'Sabor', values: union(DEFAULT_VALUES['sabor'], used['sabor']), allowCreate: true, validate: validateLabel },
      { key: 'peso', label: 'Peso', values: union(DEFAULT_VALUES['peso'], used['peso']), allowCreate: true, validate: validateMass },
      { key: 'porciones', label: 'Porciones', values: union(DEFAULT_VALUES['porciones'], used['porciones']), allowCreate: true, validate: validateServings },
      { key: 'tamaño', label: 'Tamaño', values: union(DEFAULT_VALUES['tamaño'], used['tamaño']), allowCreate: true, validate: validateLabel },
    ];
  });

  protected readonly ingredientNames = computed(() => {
    this.valueTick();
    const names = new Map<string, string>();
    for (const raw of this.data?.ingredients ?? []) {
      const name = raw.trim();
      if (name) names.set(name.toLowerCase(), name);
    }
    for (const line of this.lines.controls) {
      const name = line.controls.name.value.trim();
      if (name) names.set(name.toLowerCase(), name);
    }
    return [...names.values()];
  });

  protected readonly lineUnits = computed(() => {
    this.valueTick();
    return this.lines.controls.map((line) => MeasureInput.parse(rawLine(line), 'any').unit);
  });

  protected readonly lineInvalids = computed(() => {
    this.valueTick();
    this.submitted();
    this.interaction();
    return this.lines.controls.map((line) => {
      const name = line.controls.name.value.trim();
      const quantity = line.controls.quantity.value.trim();
      const filled = !!name || !!quantity;
      const show = this.submitted() || line.controls.name.touched || line.controls.quantity.touched;
      if (!filled || !show) {
        return { name: false, quantity: false };
      }
      return { name: !name, quantity: !MeasureInput.parse(rawLine(line), 'any').isValid };
    });
  });

  protected readonly nameError = computed(() => this.errorFor(this.form.controls.name, 'El nombre es obligatorio.'));

  /** Error del campo único: hace falta un peso válido. */
  protected readonly charsError = computed(() => {
    if (!this.submitted()) return '';
    return MeasureInput.parse(this.chars()['peso'] ?? '', 'mass').isValid ? '' : 'Elige el peso del queque.';
  });

  // --- Acciones ---

  protected onChars(selection: Record<string, string>): void {
    this.chars.set(selection);
  }

  protected setLineUnit(index: number, token: UnitToken): void {
    this.lines.at(index)?.controls.unit.setValue(token);
  }

  protected removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
    this.ensureTrailingRow();
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    this.interaction.update((n) => n + 1);

    if (this.form.controls.name.invalid) {
      return;
    }

    const filled = this.lines.controls.filter(
      (line) => line.controls.name.value.trim() || line.controls.quantity.value.trim(),
    );
    if (filled.length === 0) {
      this.errorMessage.set('Agrega al menos un ingrediente.');
      return;
    }

    const parsed: { name: string; baseUnit: 'g' | 'u'; quantity: number }[] = [];
    for (const line of filled) {
      const name = line.controls.name.value.trim();
      const measure = MeasureInput.parse(rawLine(line), 'any');
      if (!name || !measure.quantity) {
        this.errorMessage.set('Revisa los ingredientes marcados.');
        return;
      }
      parsed.push({ name, baseUnit: measure.baseUnit, quantity: measure.quantity.value });
    }

    const weight = MeasureInput.parse(this.chars()['peso'] ?? '', 'mass');
    if (!weight.quantity) {
      return; // charsError avisa del peso
    }

    this.saving.set(true);
    try {
      const lines: { ingredientId: string; quantity: number }[] = [];
      for (const item of parsed) {
        const { id } = await this.saveIngredient.execute({ name: item.name, baseUnit: item.baseUnit });
        lines.push({ ingredientId: id, quantity: item.quantity });
      }
      const result = await this.saveSponge.execute({
        name: this.form.controls.name.value,
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

  private ensureTrailingRow(): void {
    const last = this.lines.at(this.lines.length - 1);
    if (last && (last.controls.name.value.trim() || last.controls.quantity.value.trim())) {
      this.lines.push(this.newLine());
    }
  }

  private newLine(): LineGroup {
    return this.fb.nonNullable.group({
      name: [''],
      quantity: [''],
      unit: [''],
    });
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

function rawLine(line: LineGroup): string {
  return line.controls.quantity.value + line.controls.unit.value;
}

/** Une defaults + usados, deduplicando sin distinguir mayúsculas (gana el primero). */
function union(defaults: readonly string[], used?: readonly string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of [...defaults, ...(used ?? [])]) {
    const normalized = value.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.set(normalized, value);
    }
  }
  return [...seen.values()];
}


function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.';
}

// Validaciones por tipo (reglas del dominio), pasadas al campo de características.
function validateMass(value: string): string | null {
  return MeasureInput.parse(value, 'mass').isValid ? null : 'Escribe un peso válido (ej. 1 kg o 400 g).';
}

function validateServings(value: string): string | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? null : 'Las porciones deben ser un número entero positivo.';
}

function validateLabel(value: string): string | null {
  return value.trim() ? null : 'Escribe un valor.';
}
