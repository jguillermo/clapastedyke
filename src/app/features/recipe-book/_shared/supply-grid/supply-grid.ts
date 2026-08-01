import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, type FormControl } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OverlayModule } from '@angular/cdk/overlay';
import { BaseUnit } from '@core/_common/quantity';
import { UnitInput, type UnitToken } from '@components/unit-input/unit-input';
import { Combobox } from '@components/combobox/combobox';
import { Table, type TableColumn } from '@components/table/table';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import {
  MeasureInput,
  type MeasureKind,
} from '@core/recipe-book/domain/value-objects/measure-input';
import { PreviewRecipeCost } from '@core/recipe-book/application/use-cases/preview-recipe-cost.use-case';
import { SaveSupply } from '@core/recipe-book/application/use-cases/save-supply.use-case';
import { PriceCapture, type PurchaseValue } from '../price-capture/price-capture';
import type { SupplyOption, ParsedLine } from './types';

export type { SupplyOption, ParsedLine, PurchaseValue };

/** Línea inicial para precargar la grilla al editar una receta (cantidad en unidad base). */
export interface InitialLine {
  supplyId: string;
  name: string;
  quantity: number;
  baseUnit: BaseUnit;
}

type LineGroup = FormGroup<{
  /** Identidad del insumo de la fila; vacía hasta que se resuelve del catálogo o se guarda. */
  supplyId: FormControl<string>;
  name: FormControl<string>;
  quantity: FormControl<string>;
  unit: FormControl<string>;
  purchase: FormControl<PurchaseValue | null>;
}>;

interface CostView {
  hasPrice: boolean;
  cost: string;
}

/**
 * Grilla de ingredientes reutilizable (queque, relleno, cobertura). Captura las
 * líneas **nombre → cantidad → costo**: el costo de la cantidad de la receta
 * (regla de tres) y el ghost de la compra se muestran en la 3ª columna; si el
 * insumo ya existe se jala su precio, y si es nuevo un popover en línea
 * ({@link PriceCapture}) pide cómo se compra.
 *
 * **Fijar el precio guarda el insumo** ahí mismo ({@link SaveSupply}): el insumo es un agregado con
 * su propio guardado, y ese es el momento en que el usuario decide su precio. Así, al guardar la
 * receta, todos los insumos ya existen y {@link collect} devuelve solo sus ids — el form padre no
 * vuelve a guardar ninguno.
 */
@Component({
  selector: 'app-supply-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OverlayModule,
    UnitInput,
    Combobox,
    Table,
    Button,
    Icon,
    PriceCapture,
  ],
  host: { '(focusout)': 'bumpInteraction()' },
  templateUrl: './supply-grid.html',
})
export class SupplyGrid implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly previewCost = inject(PreviewRecipeCost);
  private readonly saveSupply = inject(SaveSupply);

  /** Catálogo de insumos existentes (con precio) para autocompletar y jalar el precio. */
  readonly supplies = input<SupplyOption[]>([]);

  /** Líneas para precargar al editar una receta (vacío = grilla nueva en blanco). */
  readonly initialLines = input<InitialLine[]>([]);

  // Ingrediente flexible (absorbe el espacio); Cantidad y Costo 'fit' centradas (se encogen a su
  // contenido: la cantidad usa field-sizing y el costo es un botón de texto). La 4ª columna ('')
  // es la de eliminar fila: el botón lo pinta el feature y llama a `migo-table.remove(r)`.
  protected readonly columns: readonly TableColumn[] = [
    { name: 'Ingrediente' },
    { name: 'Cantidad', size: 'fit', align: 'center' },
    { name: 'Costo', size: 'fit', align: 'center' },
    { name: '', size: 'fit', align: 'center' },
  ];

  protected readonly lines = this.fb.array<LineGroup>([this.newLine()]);

  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly costViews = signal<CostView[]>([]);
  protected readonly materialTotal = signal('');

  private readonly tableRef = viewChild(Table);

  // Popover de precio anclado a la fila activa.
  protected readonly activeRow = signal<number | null>(null);
  protected readonly activeOrigin = signal<HTMLElement | null>(null);

  private readonly valueTick = toSignal(this.lines.valueChanges, { initialValue: null });
  private readonly interaction = signal(0);

  /** Opciones del catálogo indexadas por nombre (para jalar el precio). */
  private readonly optionsByName = computed(
    () =>
      new Map<string, SupplyOption>(
        this.supplies().map((opt) => [opt.name.trim().toLowerCase(), opt]),
      ),
  );

  constructor() {
    this.lines.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.ensureTrailingRow();
      void this.recomputeCosts();
    });
    void this.recomputeCosts();
  }

  ngOnInit(): void {
    // Precarga al editar: los inputs ya están disponibles aquí (no en el constructor),
    // igual que en PriceCapture. El precio se autorrellena solo (purchaseFor lo jala del
    // catálogo por nombre), así que solo se siembra nombre + cantidad + unidad.
    const seeds = this.initialLines();
    if (seeds.length === 0) {
      return;
    }
    // Sembrar sin emitir: si cada push emitiera, `ensureTrailingRow` insertaría una fila vacía
    // entre cada ingrediente. Solo el push final del renglón vacío emite una vez (refresca costos
    // y la vista, y no añade nada porque la última fila ya está vacía).
    this.lines.clear({ emitEvent: false });
    for (const seed of seeds) {
      this.lines.push(this.seededLine(seed), { emitEvent: false });
    }
    this.lines.push(this.newLine());
  }

  protected readonly lineControls = computed(() => {
    this.valueTick();
    return [...this.lines.controls];
  });

  protected readonly supplyNames = computed(() => {
    this.valueTick();
    const names = new Map<string, string>();
    for (const opt of this.supplies()) {
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

  /**
   * Familia de unidad que el popover de precio debe fijar: la dicta la cantidad de
   * la fila activa (`count` si se tecleó en `u`, `mass` si en g/kg). Sin una
   * cantidad válida aún → `any` (el popover queda libre y la cantidad se
   * reinterpretará luego según el precio fijado).
   */
  protected readonly activeKind = computed<MeasureKind>(() => {
    this.valueTick();
    const r = this.activeRow();
    if (r === null) return 'any';
    const line = this.lines.at(r);
    if (!line) return 'any';
    const measure = this.measureOf(line);
    if (!measure.isValid) return 'any';
    return measure.baseUnit === 'u' ? 'count' : 'mass';
  });

  // --- API pública (la consume el form padre) ---

  /** Fuerza mostrar los errores de línea (llamar al enviar el formulario). */
  markSubmitted(): void {
    this.submitted.set(true);
    this.lines.markAllAsTouched();
    this.interaction.update((n) => n + 1);
  }

  /**
   * Valida las líneas y devuelve las parseadas, con el insumo **ya resuelto a su id**, o `null`
   * mostrando el error dentro de la grilla. No guarda nada aquí: el insumo se guardó antes, al
   * confirmar su precio ({@link onPriceConfirmed}); el form padre solo manda la receta.
   */
  collect(): ParsedLine[] | null {
    this.errorMessage.set('');
    this.markSubmitted();

    const filled = this.lines.controls.filter(
      (line) => line.controls.name.value.trim() || line.controls.quantity.value.trim(),
    );
    if (filled.length === 0) {
      this.errorMessage.set('Agrega al menos un ingrediente.');
      return null;
    }

    const parsed: ParsedLine[] = [];
    for (const line of filled) {
      const name = line.controls.name.value.trim();
      const measure = this.measureOf(line);
      const purchase = this.purchaseFor(line);
      if (!name || !measure.quantity) {
        this.errorMessage.set('Revisa los ingredientes marcados.');
        return null;
      }
      if (!purchase) {
        this.errorMessage.set(`Falta el precio de "${name}". Tócalo en la columna Costo.`);
        return null;
      }
      if (measure.baseUnit !== purchase.per.unit) {
        this.errorMessage.set(`La unidad de "${name}" no coincide con cómo lo compras.`);
        return null;
      }
      // Red de seguridad: el insumo se guarda al fijar su precio, así que a estas alturas siempre
      // debería tener id. Si no lo tiene, ese guardado falló y no hay nada que referenciar.
      const supplyId = this.supplyIdOf(line);
      if (!supplyId) {
        this.errorMessage.set(`No se pudo guardar el insumo "${name}". Vuelve a fijar su precio.`);
        return null;
      }
      parsed.push({
        supplyId,
        name,
        baseUnit: purchase.per.unit,
        quantity: measure.quantity.value,
        purchase,
      });
    }
    return parsed;
  }

  // --- Acciones de la grilla ---

  protected setLineUnit(index: number, token: UnitToken): void {
    this.lines.at(index)?.controls.unit.setValue(token);
  }

  /** Tras elegir un insumo (Tab/Enter o clic en el desplegable), avanza a la cantidad (col 1). */
  protected onSupplyPicked(index: number): void {
    setTimeout(() => this.tableRef()?.focusCell(index, 1));
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
    const origin = this.activeOrigin();
    this.activeRow.set(null);
    this.activeOrigin.set(null);
    setTimeout(() => origin?.focus());
  }

  /**
   * Fijar cómo se compra un insumo **es guardarlo**: se persiste aquí mismo, en el momento en que el
   * usuario lo decide, y la fila se queda con su id. Así, cuando se guarde la receta, el insumo ya
   * existe y solo hay que mandar su id — el formulario no vuelve a guardarlo.
   */
  protected async onPriceConfirmed(purchase: PurchaseValue): Promise<void> {
    const r = this.activeRow();
    const line = r === null ? null : this.lines.at(r);
    if (r === null || !line) {
      return;
    }
    line.controls.purchase.setValue(purchase);
    this.activeRow.set(null);
    this.activeOrigin.set(null);
    setTimeout(() => this.tableRef()?.focusCell(r + 1, 0));

    const name = line.controls.name.value.trim();
    if (!name) {
      return;
    }
    try {
      const { id } = await this.saveSupply.execute({
        id: this.supplyIdOf(line) || undefined,
        name,
        usage: 'recipe',
        purchasePrice: purchase,
      });
      line.controls.supplyId.setValue(id);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo guardar el insumo.',
      );
    }
  }

  protected bumpInteraction(): void {
    this.interaction.update((n) => n + 1);
  }

  // --- Helpers ---

  /** Id del insumo de la fila: el que ya tenía o el del catálogo que coincide por nombre. */
  private supplyIdOf(line: LineGroup): string {
    const known = line.controls.supplyId.value;
    if (known) return known;
    return this.optionsByName().get(line.controls.name.value.trim().toLowerCase())?.id ?? '';
  }

  /** Precio de la fila: el fijado en el popover o el jalado del catálogo por nombre. */
  private purchaseFor(line: LineGroup): PurchaseValue | null {
    const explicit = line.controls.purchase.value;
    if (explicit) return explicit;
    const option = this.optionsByName().get(line.controls.name.value.trim().toLowerCase());
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
    const purchases = this.lines.controls.map((line) =>
      line.controls.name.value.trim() ? this.purchaseFor(line) : null,
    );
    const result = await this.previewCost.execute({
      lines: this.lines.controls.map((line, i) => {
        const measure = this.measureOf(line);
        return {
          purchasePrice: purchases[i],
          quantity: measure.quantity
            ? { value: measure.quantity.value, unit: measure.baseUnit }
            : undefined,
        };
      }),
    });
    this.costViews.set(
      result.items.map((item, i) => ({ hasPrice: purchases[i] !== null, cost: item.cost })),
    );
    this.materialTotal.set(purchases.some((p) => p !== null) ? result.total : '');
  }

  private ensureTrailingRow(): void {
    const last = this.lines.at(this.lines.length - 1);
    if (last && (last.controls.name.value.trim() || last.controls.quantity.value.trim())) {
      this.lines.push(this.newLine());
    }
  }

  private newLine(): LineGroup {
    return this.fb.nonNullable.group({
      supplyId: [''],
      name: [''],
      quantity: [''],
      unit: [''],
      purchase: this.fb.nonNullable.control<PurchaseValue | null>(null),
    });
  }

  /** Construye una línea precargada: cantidad base → texto visible + token de unidad. */
  private seededLine(seed: InitialLine): LineGroup {
    const display = displayQuantity(seed.quantity, seed.baseUnit);
    return this.fb.nonNullable.group({
      supplyId: [seed.supplyId],
      name: [seed.name],
      quantity: [display.value],
      unit: [display.unit],
      purchase: this.fb.nonNullable.control<PurchaseValue | null>(null),
    });
  }
}

/**
 * Cantidad en unidad base → texto + token para los controles de la fila. En `u` el
 * token es `u` (conteo); en masa se muestra kg (token `k`) si ≥1000 g, si no g.
 */
function displayQuantity(quantity: number, baseUnit: BaseUnit): { value: string; unit: string } {
  if (baseUnit === 'u') {
    return { value: String(quantity), unit: 'u' };
  }
  return quantity >= 1000
    ? { value: String(quantity / 1000), unit: 'k' }
    : { value: String(quantity), unit: 'g' };
}
