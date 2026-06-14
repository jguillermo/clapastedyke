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
import { OverlayModule } from '@angular/cdk/overlay';
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
import { BaseUnit } from '@core/_common/quantity';
import { MeasureInput, type MeasureKind } from '@core/recipe-book/domain/value-objects/measure-input';
import { SaveSpongeRecipe } from '@core/recipe-book/application/use-cases/save-sponge-recipe.use-case';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { PreviewRecipeCost } from '@core/recipe-book/application/use-cases/preview-recipe-cost.use-case';
import { PriceCapture, type PurchaseValue } from '../price-capture/price-capture';

/** Un insumo del catálogo con su precio, para autocompletar y jalar el precio. */
export interface IngredientOption {
  name: string;
  baseUnit: BaseUnit;
  purchase: PurchaseValue;
}

/** Datos del diálogo: insumos existentes (con precio) + valores por característica. */
export interface SpongeFormData {
  ingredients: IngredientOption[];
  valuesByType: Record<string, string[]>;
}

type LineGroup = FormGroup<{
  name: FormControl<string>;
  quantity: FormControl<string>;
  unit: FormControl<string>;
  purchase: FormControl<PurchaseValue | null>;
}>;

interface CostView {
  hasPrice: boolean;
  cost: string;
}

/** Valores por defecto de cada tipo (sugerencias; los añadidos se reutilizan vía `valuesByType`). */
const DEFAULT_VALUES: Record<string, readonly string[]> = {
  sabor: ['Vainilla', 'Chocolate'],
  peso: ['1 kg', '2 kg', '5 kg'],
  porciones: ['2', '4', '8', '10', '40'],
  'tamaño': ['Grande', 'Mediano', 'Pequeño'],
};

/**
 * Formulario "Nuevo queque". Ingredientes en grilla con **nombre → cantidad →
 * costo**: el costo de la cantidad de la receta (regla de tres) y el ghost de la
 * compra se muestran en la 3ª columna. Si el insumo ya existe se jala su precio;
 * si es nuevo, un popover en línea ({@link PriceCapture}) pide cómo se compra.
 */
@Component({
  selector: 'app-sponge-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OverlayModule,
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
    PriceCapture,
  ],
  host: { '(focusout)': 'bumpInteraction()' },
  templateUrl: './sponge-form.html',
})
export class SpongeForm {
  private readonly fb = inject(FormBuilder);
  private readonly saveSponge = inject(SaveSpongeRecipe);
  private readonly saveIngredient = inject(SaveIngredient);
  private readonly previewCost = inject(PreviewRecipeCost);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<SpongeFormData | null>(MIGO_DIALOG_DATA, { optional: true });

  protected readonly columns: readonly GridColumn[] = [
    { label: 'Ingrediente' },
    { label: 'Cantidad', width: 'w-32' },
    { label: 'Costo', width: 'w-44' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lines: this.fb.array<LineGroup>([this.newLine()]),
  });

  protected readonly chars = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly costViews = signal<CostView[]>([]);
  protected readonly materialTotal = signal('');

  // Popover de precio anclado a la fila activa.
  protected readonly activeRow = signal<number | null>(null);
  protected readonly activeOrigin = signal<HTMLElement | null>(null);

  private readonly valueTick = toSignal(this.form.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  /** Opciones del catálogo indexadas por nombre (para jalar el precio). */
  private readonly optionsByName = new Map<string, IngredientOption>(
    (this.data?.ingredients ?? []).map((opt) => [opt.name.trim().toLowerCase(), opt]),
  );

  constructor() {
    this.form.controls.lines.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.ensureTrailingRow();
      void this.recomputeCosts();
    });
    void this.recomputeCosts();
  }

  protected get lines(): FormArray<LineGroup> {
    return this.form.controls.lines;
  }

  protected readonly lineControls = computed(() => {
    this.valueTick();
    return [...this.lines.controls];
  });

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
    for (const opt of this.data?.ingredients ?? []) {
      names.set(opt.name.toLowerCase(), opt.name);
    }
    for (const line of this.lines.controls) {
      const name = line.controls.name.value.trim();
      if (name) names.set(name.toLowerCase(), name);
    }
    return [...names.values()];
  });

  protected readonly lineUnits = computed(() => {
    this.valueTick();
    return this.lines.controls.map((line) => this.measureOf(line).unit);
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
      return { name: !name, quantity: !this.measureOf(line).isValid };
    });
  });

  protected readonly nameError = computed(() => this.errorFor(this.form.controls.name, 'El nombre es obligatorio.'));

  protected readonly charsError = computed(() => {
    if (!this.submitted()) return '';
    return MeasureInput.parse(this.chars()['peso'] ?? '', 'mass').isValid ? '' : 'Elige el peso del queque.';
  });

  /** Nombre / compra de la fila activa (para el popover). */
  protected readonly activeName = computed(() => {
    this.valueTick();
    const r = this.activeRow();
    return r === null ? '' : (this.lines.at(r)?.controls.name.value.trim() ?? '');
  });

  protected readonly activePurchase = computed(() => {
    this.valueTick();
    const r = this.activeRow();
    if (r === null) return null;
    const line = this.lines.at(r);
    return line ? this.purchaseFor(line) : null;
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

  protected openPrice(index: number, origin: HTMLElement): void {
    this.activeOrigin.set(origin);
    this.activeRow.set(index);
  }

  protected closePrice(): void {
    this.activeRow.set(null);
    this.activeOrigin.set(null);
  }

  protected onPriceConfirmed(purchase: PurchaseValue): void {
    const r = this.activeRow();
    if (r !== null) {
      this.lines.at(r)?.controls.purchase.setValue(purchase);
    }
    this.closePrice();
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

    const parsed: { name: string; baseUnit: BaseUnit; quantity: number; purchase: PurchaseValue }[] = [];
    for (const line of filled) {
      const name = line.controls.name.value.trim();
      const measure = this.measureOf(line);
      const purchase = this.purchaseFor(line);
      if (!name || !measure.quantity) {
        this.errorMessage.set('Revisa los ingredientes marcados.');
        return;
      }
      if (!purchase) {
        this.errorMessage.set(`Falta el precio de "${name}". Tócalo en la columna Costo.`);
        return;
      }
      if (measure.baseUnit !== purchase.per.unit) {
        this.errorMessage.set(`La unidad de "${name}" no coincide con cómo lo compras.`);
        return;
      }
      parsed.push({ name, baseUnit: purchase.per.unit, quantity: measure.quantity.value, purchase });
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

  /** Precio de la fila: el fijado en el popover o el jalado del catálogo por nombre. */
  private purchaseFor(line: LineGroup): PurchaseValue | null {
    const explicit = line.controls.purchase.value;
    if (explicit) return explicit;
    const option = this.optionsByName.get(line.controls.name.value.trim().toLowerCase());
    return option ? option.purchase : null;
  }

  /**
   * Cómo interpretar la cantidad de la fila: la **unidad la dicta el precio** del
   * insumo (compras en `u` → conteo; en `g` → masa). Sin precio aún, se infiere
   * por lo que el usuario teclee (`any`).
   */
  private kindFor(line: LineGroup): MeasureKind {
    const purchase = this.purchaseFor(line);
    if (!purchase) return 'any';
    return purchase.per.unit === 'u' ? 'count' : 'mass';
  }

  /** Parsea la cantidad de la fila con la unidad correcta (regida por el precio). */
  private measureOf(line: LineGroup): MeasureInput {
    const kind = this.kindFor(line);
    const quantity = line.controls.quantity.value;
    // En conteo no hay sub-unidad; en masa el token k/g distingue kg de g.
    const raw = kind === 'count' ? quantity : quantity + line.controls.unit.value;
    return MeasureInput.parse(raw, kind);
  }

  private async recomputeCosts(): Promise<void> {
    const purchases = this.lines.controls.map((line) => (line.controls.name.value.trim() ? this.purchaseFor(line) : null));
    const result = await this.previewCost.execute({
      lines: this.lines.controls.map((line, i) => {
        const measure = this.measureOf(line);
        return {
          purchasePrice: purchases[i],
          quantity: measure.quantity ? { value: measure.quantity.value, unit: measure.baseUnit } : undefined,
        };
      }),
    });
    this.costViews.set(result.items.map((item, i) => ({ hasPrice: purchases[i] !== null, cost: item.cost })));
    this.materialTotal.set(purchases.some((p) => p !== null) ? result.total : '');
  }

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
      purchase: this.fb.nonNullable.control<PurchaseValue | null>(null),
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
