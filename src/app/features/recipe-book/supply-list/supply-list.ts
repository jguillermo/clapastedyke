import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, type FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Table, type TableColumn } from '@components/table/table';
import { Autocomplete } from '@components/autocomplete/autocomplete';
import { UnitInput, type UnitToken } from '@components/unit-input/unit-input';
import { CurrencyInput } from '@components/currency-input/currency-input';
import { Icon } from '@components/icon/icon';
import { Logger } from '@core/_common/logger/logger';
import { BaseUnit } from '@core/_common/quantity';
import {
  MeasureInput,
  type MeasureKind,
} from '@core/recipe-book/domain/value-objects/measure-input';
import { SaveSupply } from '@core/recipe-book/application/use-cases/save-supply.use-case';
import type { Supply } from '@core/recipe-book/domain/entities/supply';

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
 * insumo (nombre → empaque → precio) que se edita en línea y se guarda solo. El
 * renglón vacío para **agregar** va **arriba** (primera fila); debajo, los insumos
 * existentes ordenados alfabéticamente se editan/renombran/reprecian por id; el renglón vacío acuña
 * uno nuevo al escribirlo. Ambos casos son la misma llamada ({@link SaveSupply}): lo único que
 * cambia es si se manda el id de la fila. Reusa la grilla y los controles del design system.
 */
@Component({
  selector: 'app-supply-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Table, Autocomplete, UnitInput, CurrencyInput, Icon],
  host: { '(focusout)': 'onFocusOut($event)' },
  templateUrl: './supply-list.html',
})
export class SupplyList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly saveSupply = inject(SaveSupply);
  private readonly log = inject(Logger).scoped('ui/supply-list');

  /** Catálogo de insumos a mostrar/editar (lo pasa el hub ya cargado). */
  readonly supplies = input<readonly Supply[]>([]);

  /** Se emite tras guardar para que el hub recargue el catálogo (libro 3D, etc.). */
  readonly changed = output<void>();

  // Insumo flexible (absorbe el espacio); empaque y precio fijos compactos (llevan input).
  protected readonly columns: readonly TableColumn[] = [
    { name: 'Insumo' },
    { name: 'Empaque', size: 96 },
    { name: 'Precio', size: 96 },
  ];

  protected readonly lines = this.fb.array<LineGroup>([this.newLine()]);
  protected readonly errorMessage = signal('');
  /** Id del insumo recién creado: muestra una marca breve en su fila (sin notificación). */
  protected readonly recentlyAddedId = signal<string | null>(null);

  private readonly valueTick = toSignal(this.lines.valueChanges, { initialValue: null });
  /** Última versión guardada de cada fila, para no reescribir lo que no cambió. */
  private readonly savedSnapshots = new Map<string, string>();

  ngOnInit(): void {
    const seeds = this.supplies();
    // El renglón para agregar va arriba (primera fila); debajo, los existentes en orden alfabético
    // (no en vivo, para que las filas no salten al editar).
    this.lines.clear();
    this.lines.push(this.newLine());
    for (const supply of [...seeds].sort((a, b) => a.name.localeCompare(b.name, 'es'))) {
      this.lines.push(this.seededLine(supply));
    }
  }

  protected readonly lineControls = computed(() => {
    this.valueTick();
    return [...this.lines.controls];
  });

  protected readonly supplyNames = computed(() => {
    this.valueTick();
    const names = new Map<string, string>();
    for (const supply of this.supplies()) {
      names.set(supply.name.toLowerCase(), supply.name);
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

  /**
   * Enter en el renglón de agregar (arriba): lo guarda y deja el cursor en el renglón vacío nuevo
   * (arriba), para seguir añadiendo. Evita que la tabla mueva el foco a la fila de abajo.
   */
  protected onAddRowEnter(event: Event, index: number): void {
    const line = this.lines.at(index);
    if (!line || line.controls.id.value !== null) {
      return; // solo la fila de agregar (sin id); las existentes usan la navegación de la tabla
    }
    event.preventDefault();
    event.stopPropagation();
    this.trySaveRow(index)
      .then(() => setTimeout(() => this.focusNew()))
      .catch((error: unknown) => this.log.error('el guardado del renglón ha fallado', error));
  }

  /** Lleva el foco al renglón vacío de arriba (para "Agregar insumo"). */
  focusNew(): void {
    const first = this.host.nativeElement.querySelector<HTMLElement>(
      '[role="gridcell"][data-col="0"]',
    );
    first?.querySelector<HTMLInputElement>('input')?.focus();
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
      this.trySaveRow(fromRow).catch((error: unknown) =>
        this.log.error('el guardado del renglón ha fallado', error),
      );
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
      if (!name || !purchase) {
        this.log.debug('renglón nuevo incompleto, todavía no se guarda', {
          index,
          conNombre: !!name,
          conPrecio: !!purchase,
        });
        return;
      }
      this.log.debug('crear insumo ▶', { index });
      try {
        const { id: newId } = await this.saveSupply.execute({
          name,
          usage: 'recipe',
          purchasePrice: purchase,
        });
        line.controls.id.setValue(newId);
        line.controls.baseUnit.setValue(purchase.per.unit);
        this.snapshot(line);
        this.errorMessage.set('');
        this.markRecentlyAdded(newId);
        // Deja un renglón vacío arriba para seguir agregando (el recién creado baja una fila).
        this.lines.insert(0, this.newLine());
        this.changed.emit();
        this.log.debug('crear insumo ✔', { id: newId });
      } catch (error) {
        this.log.warn('no se pudo crear el insumo', error, { index });
        this.errorMessage.set(messageOf(error));
      }
      return;
    }

    // Renglón existente: nada que guardar si está incompleto o sin cambios.
    if (!name) {
      this.log.debug('renglón existente sin nombre, no se guarda', { id });
      this.errorMessage.set('El nombre del insumo no puede quedar vacío.');
      return;
    }
    if (!purchase || this.snapshotKey(line) === this.savedSnapshots.get(id)) {
      // «Sin cambios» es la respuesta a «lo edité y no se guardó», así que se cuenta.
      this.log.debug(purchase ? 'sin cambios, no se guarda' : 'sin precio, no se guarda', { id });
      return;
    }
    this.log.debug('actualizar insumo ▶', { id });
    try {
      await this.saveSupply.execute({ id, name, purchasePrice: purchase });
      this.snapshot(line);
      this.errorMessage.set('');
      this.changed.emit();
      this.log.debug('actualizar insumo ✔', { id });
    } catch (error) {
      this.log.warn('no se pudo actualizar el insumo', error, { id });
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

  private seededLine(supply: Supply): LineGroup {
    const per = supply.purchasePrice.per;
    const display = displayPackaging(per.value, per.unit);
    const line = this.fb.nonNullable.group({
      id: this.fb.control<string | null>(supply.id.value),
      baseUnit: [supply.baseUnit as string],
      name: [supply.name],
      packaging: [display.value],
      unit: [display.unit],
      price: [String(supply.purchasePrice.amount)],
    });
    this.savedSnapshots.set(supply.id.value, this.snapshotKey(line));
    return line;
  }
}

/** Empaque en unidad base → texto + token para los controles (kg si ≥1000 g). */
function displayPackaging(value: number, baseUnit: BaseUnit): { value: string; unit: string } {
  if (baseUnit === 'u') {
    return { value: String(value), unit: 'u' };
  }
  return value >= 1000
    ? { value: String(value / 1000), unit: 'k' }
    : { value: String(value), unit: 'g' };
}

/** Índice de fila de la celda que contiene al elemento, o `null` si está fuera de la grilla. */
function rowIndexOf(target: EventTarget | null): number | null {
  const cell =
    target instanceof HTMLElement ? target.closest<HTMLElement>('[role="gridcell"]') : null;
  const row = cell?.dataset['row'];
  return row === undefined ? null : Number(row);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo guardar el insumo.';
}
