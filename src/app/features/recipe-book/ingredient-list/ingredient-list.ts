import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, type FormControl } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Grid, type GridColumn } from '@components/grid/grid';
import { Autocomplete } from '@components/autocomplete/autocomplete';
import { UnitInput, type UnitToken } from '@components/unit-input/unit-input';
import { CurrencyInput } from '@components/currency-input/currency-input';
import { Icon } from '@components/icon/icon';
import { BaseUnit } from '@core/_common/quantity';
import { MeasureInput, type MeasureKind } from '@core/recipe-book/domain/value-objects/measure-input';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { UpdateIngredient } from '@core/recipe-book/application/use-cases/update-ingredient.use-case';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';

type LineGroup = FormGroup<{
  /** Identity once persisted; `null` for the trailing "write a new insumo" row. */
  id: FormControl<string | null>;
  /** Fixed once created (`g`/`u`); empty until the new row's unit is inferred. */
  baseUnit: FormControl<string>;
  name: FormControl<string>;
  /** Numeric presentation value the user typed (the unit is in `unit`). */
  packaging: FormControl<string>;
  /** Unit token shown next to the packaging number (`k`/`g`/`u`). */
  unit: FormControl<string>;
  price: FormControl<string>;
}>;

/** What a row resolves to once it can be persisted. */
interface RowPurchase {
  amount: number;
  per: { value: number; unit: BaseUnit };
}

/**
 * Lista editable de insumos como una **hoja del libro**: cada renglón es un
 * insumo (nombre → empaque → precio) que se edita en línea y se guarda solo. Los
 * insumos existentes se editan/renombran/reprecian por id ({@link UpdateIngredient});
 * el renglón vacío del final crea uno nuevo al escribirlo ({@link SaveIngredient}).
 * Reusa la grilla y los controles del design system con el skin `paper` para
 * fundirse con la página y no parecer un formulario.
 */
@Component({
  selector: 'app-ingredient-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Grid, Autocomplete, UnitInput, CurrencyInput, Icon],
  host: { '(focusout)': 'onFocusOut($event)' },
  templateUrl: './ingredient-list.html',
})
export class IngredientList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly saveIngredient = inject(SaveIngredient);
  private readonly updateIngredient = inject(UpdateIngredient);

  /** Catálogo de insumos a mostrar/editar (lo pasa el hub ya cargado). */
  readonly ingredients = input<readonly Ingredient[]>([]);

  /** Se emite tras guardar para que el hub recargue el catálogo (libro 3D, etc.). */
  readonly changed = output<void>();

  // Insumo crece (flex-1); empaque y precio se ajustan a su contenido (anchos compactos).
  protected readonly columns: readonly GridColumn[] = [
    { label: 'Insumo' },
    { label: 'Empaque', width: 'w-28' },
    { label: 'Precio', width: 'w-28' },
  ];

  protected readonly lines = this.fb.array<LineGroup>([this.newLine()]);
  protected readonly errorMessage = signal('');
  /** Id del insumo recién creado: muestra una marca breve en su fila (sin notificación). */
  protected readonly recentlyAddedId = signal<string | null>(null);

  private readonly valueTick = toSignal(this.lines.valueChanges, { initialValue: null });
  /** Última versión guardada de cada fila, para no reescribir lo que no cambió. */
  private readonly savedSnapshots = new Map<string, string>();

  ngOnInit(): void {
    const seeds = this.ingredients();
    if (seeds.length > 0) {
      // Orden alfabético al cargar (no en vivo, para que las filas no salten al editar).
      const sorted = [...seeds].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      this.lines.clear();
      for (const ingredient of sorted) {
        this.lines.push(this.seededLine(ingredient));
      }
      this.lines.push(this.newLine());
    }

    // Mantiene siempre un renglón vacío al final para "seguir escribiendo".
    this.lines.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.ensureTrailingRow());
  }

  protected readonly lineControls = computed(() => {
    this.valueTick();
    return [...this.lines.controls];
  });

  protected readonly ingredientNames = computed(() => {
    this.valueTick();
    const names = new Map<string, string>();
    for (const ingredient of this.ingredients()) {
      names.set(ingredient.name.toLowerCase(), ingredient.name);
    }
    for (const line of this.lines.controls) {
      const name = line.controls.name.value.trim();
      if (name) names.set(name.toLowerCase(), name);
    }
    return [...names.values()];
  });

  /** Unidad mostrada en cada input de empaque (kg/g/u), resuelta por el dominio. */
  protected readonly lineUnits = computed(() => {
    this.valueTick();
    return this.lines.controls.map((line) => this.measureOf(line).unit);
  });

  /** Marca una fila como recién agregada y limpia la marca a los 2.5 s. */
  private markRecentlyAdded(id: string): void {
    this.recentlyAddedId.set(id);
    setTimeout(() => {
      if (this.recentlyAddedId() === id) {
        this.recentlyAddedId.set(null);
      }
    }, 2500);
  }

  /** Lleva el foco al renglón vacío del final (para "Agregar insumo"). */
  focusNew(): void {
    const cells = this.host.nativeElement.querySelectorAll<HTMLElement>('[role="gridcell"][data-col="0"]');
    const last = cells[cells.length - 1];
    last?.querySelector<HTMLInputElement>('input')?.focus();
  }

  // --- Edición de unidad ---

  protected setLineUnit(index: number, token: UnitToken): void {
    const line = this.lines.at(index);
    if (!line) return;
    const kind = this.kindOf(line);
    // En insumos existentes la familia está fija: masa no acepta `u`; conteo solo `u`.
    if (kind === 'mass' && token === 'u') return;
    if (kind === 'count' && token !== 'u') return;
    line.controls.unit.setValue(token);
  }

  // --- Autoguardado al salir de un renglón ---

  protected onFocusOut(event: FocusEvent): void {
    const fromRow = rowIndexOf(event.target);
    const toRow = rowIndexOf(event.relatedTarget);
    if (fromRow !== null && fromRow !== toRow) {
      void this.trySaveRow(fromRow);
    }
  }

  private async trySaveRow(index: number): Promise<void> {
    const line = this.lines.at(index);
    if (!line) return;

    const name = line.controls.name.value.trim();
    const purchase = this.purchaseFor(line);
    const id = line.controls.id.value;

    // Renglón nuevo: solo crea cuando está completo (nombre + empaque + precio).
    if (id === null) {
      if (!name || !purchase) return;
      try {
        const { id: newId } = await this.saveIngredient.execute({
          name,
          baseUnit: purchase.per.unit,
          usage: 'recipe',
          purchasePrice: purchase,
        });
        line.controls.id.setValue(newId);
        line.controls.baseUnit.setValue(purchase.per.unit);
        this.snapshot(line);
        this.errorMessage.set('');
        this.markRecentlyAdded(newId);
        this.ensureTrailingRow();
        this.changed.emit();
      } catch (error) {
        this.errorMessage.set(messageOf(error));
      }
      return;
    }

    // Renglón existente: nada que guardar si está incompleto o sin cambios.
    if (!name) {
      this.errorMessage.set('El nombre del insumo no puede quedar vacío.');
      return;
    }
    if (!purchase || this.snapshotKey(line) === this.savedSnapshots.get(id)) {
      return;
    }
    try {
      await this.updateIngredient.execute({ id, name, purchasePrice: purchase });
      this.snapshot(line);
      this.errorMessage.set('');
      this.changed.emit();
    } catch (error) {
      this.errorMessage.set(messageOf(error));
    }
  }

  // --- Helpers ---

  /** Familia de unidad de la fila: la fija su `baseUnit`; sin él (fila nueva) es libre. */
  private kindOf(line: LineGroup): MeasureKind {
    const baseUnit = line.controls.baseUnit.value;
    if (baseUnit === 'u') return 'count';
    if (baseUnit === 'g') return 'mass';
    return 'any';
  }

  /** Parsea el empaque de la fila con la familia de unidad correcta. */
  private measureOf(line: LineGroup): MeasureInput {
    const kind = this.kindOf(line);
    const packaging = line.controls.packaging.value;
    const raw = kind === 'count' ? packaging : packaging + line.controls.unit.value;
    return MeasureInput.parse(raw, kind);
  }

  /** Compra normalizada de la fila (empaque + precio), o `null` si incompleta. */
  private purchaseFor(line: LineGroup): RowPurchase | null {
    const measure = this.measureOf(line);
    const amount = Number(line.controls.price.value.replace(',', '.'));
    if (!measure.quantity || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return { amount, per: { value: measure.quantity.value, unit: measure.baseUnit } };
  }

  private snapshotKey(line: LineGroup): string {
    const purchase = this.purchaseFor(line);
    return JSON.stringify({ name: line.controls.name.value.trim().toLowerCase(), purchase });
  }

  private snapshot(line: LineGroup): void {
    const id = line.controls.id.value;
    if (id) this.savedSnapshots.set(id, this.snapshotKey(line));
  }

  private ensureTrailingRow(): void {
    const last = this.lines.at(this.lines.length - 1);
    const filled = !!last && (last.controls.name.value.trim() || last.controls.packaging.value.trim());
    if (filled) {
      this.lines.push(this.newLine());
    }
  }

  private newLine(): LineGroup {
    return this.fb.nonNullable.group({
      id: this.fb.control<string | null>(null),
      baseUnit: [''],
      name: [''],
      packaging: [''],
      unit: [''],
      price: [''],
    });
  }

  private seededLine(ingredient: Ingredient): LineGroup {
    const per = ingredient.purchasePrice.per;
    const display = displayPackaging(per.value, per.unit);
    const line = this.fb.nonNullable.group({
      id: this.fb.control<string | null>(ingredient.id.value),
      baseUnit: [ingredient.baseUnit as string],
      name: [ingredient.name],
      packaging: [display.value],
      unit: [display.unit],
      price: [String(ingredient.purchasePrice.amount)],
    });
    this.savedSnapshots.set(ingredient.id.value, this.snapshotKey(line));
    return line;
  }
}

/** Empaque en unidad base → texto + token para los controles (kg si ≥1000 g). */
function displayPackaging(value: number, baseUnit: BaseUnit): { value: string; unit: string } {
  if (baseUnit === 'u') {
    return { value: String(value), unit: 'u' };
  }
  return value >= 1000 ? { value: String(value / 1000), unit: 'k' } : { value: String(value), unit: 'g' };
}

/** Índice de fila de la celda que contiene al elemento, o `null` si está fuera de la grilla. */
function rowIndexOf(target: EventTarget | null): number | null {
  const cell = target instanceof HTMLElement ? target.closest<HTMLElement>('[role="gridcell"]') : null;
  const row = cell?.dataset['row'];
  return row === undefined ? null : Number(row);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo guardar el insumo.';
}
