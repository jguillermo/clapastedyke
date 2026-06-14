import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BaseUnit } from '@core/_common/quantity';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { Button } from '@components/button/button';
import { FormField } from '@components/form-field/form-field';
import { CurrencyInput } from '@components/currency-input/currency-input';
import { UnitInput, type UnitToken } from '@components/unit-input/unit-input';
import { MeasureInput } from '@core/recipe-book/domain/value-objects/measure-input';
import { PreviewIngredientCost } from '@core/recipe-book/application/use-cases/preview-ingredient-cost.use-case';

/** How an ingredient is bought, normalised to its base unit. */
export interface PurchaseValue {
  amount: number;
  per: { value: number; unit: BaseUnit };
  currency: string;
}

/**
 * Popover en línea para fijar el **costo de compra** de un insumo: presentación
 * (¿cuánto compras?) + precio. Muestra en vivo el costo por unidad base (lo
 * calcula el negocio, {@link PreviewIngredientCost}; la vista no calcula). Emite
 * `confirm` con el precio normalizado a la unidad base. Se reutiliza para
 * cualquier insumo (receta, topper, caja, base).
 */
@Component({
  selector: 'app-price-capture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CdkTrapFocus, Card, CardBody, CardFooter, Button, FormField, CurrencyInput, UnitInput],
  host: { '(keydown.escape)': 'onEscape()' },
  template: `
    <migo-card variant="elevated" elevation="lg" class="w-80">
      <migo-card-body>
        <form cdkTrapFocus cdkTrapFocusAutoCapture class="flex flex-col gap-3" [formGroup]="form" (ngSubmit)="confirmPrice()">
          <p class="m-0 text-sm font-semibold text-heading">¿Cómo compras "{{ name() }}"?</p>

          <div class="flex items-end gap-3">
            <migo-form-field label="Compras" class="flex-1">
              <migo-unit-input
                formControlName="presentation"
                [unit]="presentationUnit()"
                (unitToken)="setUnit($event)"
                placeholder="1"
                ariaLabel="Presentación de compra"
              />
            </migo-form-field>
            <migo-form-field label="Precio" class="flex-1">
              <migo-currency-input formControlName="price" ariaLabel="Precio de la compra" (keydown.enter)="onEnterPrice($event)" />
            </migo-form-field>
          </div>

          <p class="m-0 min-h-5 text-caption text-muted" aria-live="polite">
            @if (perBaseUnitLabel()) {
              Te cuesta {{ perBaseUnitLabel() }}
            }
          </p>
        </form>
      </migo-card-body>
      <migo-card-footer>
        <button migo-button variant="ghost" size="sm" type="button" (click)="cancelled.emit()">Cancelar</button>
        <button migo-button size="sm" type="button" [disabled]="!canConfirm()" (click)="confirmPrice()">Listo</button>
      </migo-card-footer>
    </migo-card>
  `,
})
export class PriceCapture implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly preview = inject(PreviewIngredientCost);

  readonly name = input('');
  readonly initial = input<PurchaseValue | null>(null);

  readonly confirmed = output<PurchaseValue>();
  readonly cancelled = output<void>();

  protected readonly form = this.fb.nonNullable.group({ presentation: [''], price: [''] });
  private readonly unitToken = signal<UnitToken | ''>('');
  protected readonly perBaseUnitLabel = signal('');

  private readonly tick = toSignal(this.form.valueChanges, { initialValue: null });

  /** Unidad resuelta para el chip del input de presentación. */
  protected readonly presentationUnit = computed(() => {
    this.tick();
    return MeasureInput.parse(this.rawPresentation(), 'any').unit;
  });

  protected readonly canConfirm = computed(() => {
    this.tick();
    return this.purchase() !== null;
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => void this.recompute());
  }

  ngOnInit(): void {
    const initial = this.initial();
    if (!initial) return;
    // Pre-fill when editing an existing price (inputs are set by now, not in the constructor).
    this.unitToken.set(initial.per.unit === 'u' ? 'u' : initial.per.value >= 1000 ? 'k' : 'g');
    const display =
      initial.per.unit === 'g' && initial.per.value >= 1000 ? initial.per.value / 1000 : initial.per.value;
    this.form.setValue({ presentation: String(display), price: String(initial.amount) });
  }

  protected onEscape(): void {
    this.cancelled.emit();
  }

  protected onEnterPrice(e: Event): void {
    e.preventDefault();
    this.confirmPrice();
  }

  protected setUnit(token: UnitToken): void {
    this.unitToken.set(token);
  }

  protected confirmPrice(): void {
    const purchase = this.purchase();
    if (purchase) {
      this.confirmed.emit(purchase);
    }
  }

  private rawPresentation(): string {
    return this.form.controls.presentation.value + this.unitToken();
  }

  /** Builds the normalised purchase, or null when incomplete/invalid. */
  private purchase(): PurchaseValue | null {
    const measure = MeasureInput.parse(this.rawPresentation(), 'any');
    const amount = Number(this.form.controls.price.value.replace(',', '.'));
    if (!measure.quantity || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return { amount, per: { value: measure.quantity.value, unit: measure.baseUnit }, currency: 'PEN' };
  }

  private async recompute(): Promise<void> {
    const purchase = this.purchase();
    if (!purchase) {
      this.perBaseUnitLabel.set('');
      return;
    }
    const { perBaseUnitLabel } = await this.preview.execute({ purchasePrice: purchase });
    this.perBaseUnitLabel.set(perBaseUnitLabel);
  }
}
