import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { BaseUnit } from '@core/_common/quantity';
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
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import { INGREDIENT_USAGES, type IngredientUsage } from '@core/recipe-book/domain/value-objects/ingredient-usage';
import { SaveIngredient } from '@core/recipe-book/application/use-cases/save-ingredient.use-case';
import { PriceCapture, type PurchaseValue } from '../_shared/price-capture/price-capture';
import { USAGE_LABELS } from '../_shared/ingredient-usage.labels';
import { messageOf } from '../_shared/recipe-form.utils';

/** Datos del diálogo: si viene `ingredient`, abre en modo edición (nombre bloqueado). */
export interface IngredientFormData {
  ingredient?: {
    name: string;
    usage: IngredientUsage;
    purchase: PurchaseValue;
  };
}

const USAGE_OPTIONS: SelectOption[] = INGREDIENT_USAGES.map((usage) => ({ value: usage, label: USAGE_LABELS[usage] }));

/**
 * Formulario para crear o editar un insumo del catálogo: nombre, para qué se usa
 * y su costo de compra. El precio se captura reutilizando {@link PriceCapture}
 * (popover): fija presentación + monto y normaliza a la unidad base, que pasa a
 * ser la unidad base del insumo. Inyecta solo el use case `SaveIngredient`
 * (upsert por nombre). El nombre queda bloqueado al editar.
 */
@Component({
  selector: 'app-ingredient-form',
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
    Select,
    PriceCapture,
  ],
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:add" size="lg" color="brand" />
        <migo-card-title>{{ title }}</migo-card-title>
      </migo-card-header>

      <migo-card-body>
        <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="save()">
          <migo-form-field
            label="Nombre"
            required
            reserveMessage
            [error]="nameError()"
            [hint]="editing ? 'El nombre no se puede cambiar al editar.' : ''"
          >
            <migo-input formControlName="name" placeholder="Harina sin preparar" />
          </migo-form-field>

          <migo-form-field label="¿Para qué se usa?">
            <migo-select formControlName="usage" [options]="usageOptions" ariaLabel="Uso del insumo" />
          </migo-form-field>

          <div class="flex flex-col gap-2">
            <span class="font-body text-sm font-semibold text-body">Costo de compra</span>
            <button
              #priceOrigin
              cdkOverlayOrigin
              #origin="cdkOverlayOrigin"
              migo-button
              variant="secondary"
              type="button"
              (click)="openPrice()"
            >
              <migo-icon icon-leading name="mat:edit" size="sm" />
              {{ priceLabel() || 'Fijar precio' }}
            </button>
            @if (priceError()) {
              <p class="m-0 text-caption font-medium text-error" role="alert">Fija cómo compras el insumo.</p>
            }

            <ng-template
              cdkConnectedOverlay
              [cdkConnectedOverlayOrigin]="origin"
              [cdkConnectedOverlayOpen]="priceOpen()"
              (overlayOutsideClick)="closePrice()"
              (detach)="closePrice()"
            >
              <app-price-capture
                [name]="nameValue()"
                [initial]="purchase()"
                (confirmed)="onPrice($event)"
                (cancelled)="closePrice()"
              />
            </ng-template>
          </div>

          @if (errorMessage()) {
            <p class="m-0 text-caption font-medium text-error" role="alert">{{ errorMessage() }}</p>
          }
        </form>
      </migo-card-body>

      <migo-card-footer>
        <button migo-button variant="ghost" type="button" (click)="cancel()">Cancelar</button>
        <button migo-button type="button" [loading]="saving()" (click)="save()">{{ saveLabel }}</button>
      </migo-card-footer>
    </migo-card>
  `,
})
export class IngredientForm {
  private readonly fb = inject(FormBuilder);
  private readonly saveIngredient = inject(SaveIngredient);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<IngredientFormData | null>(MIGO_DIALOG_DATA, { optional: true });

  private readonly prefill = this.data?.ingredient ?? null;
  protected readonly editing = this.prefill !== null;
  protected readonly title = this.editing ? 'Editar insumo' : 'Nuevo insumo';
  protected readonly saveLabel = this.editing ? 'Guardar cambios' : 'Guardar insumo';
  protected readonly usageOptions = USAGE_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    name: [{ value: this.prefill?.name ?? '', disabled: this.editing }, Validators.required],
    usage: [this.prefill?.usage ?? ('recipe' as IngredientUsage), Validators.required],
  });

  protected readonly purchase = signal<PurchaseValue | null>(this.prefill?.purchase ?? null);
  protected readonly priceOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly nameError = computed(() =>
    this.submitted() && this.form.controls.name.invalid ? 'El nombre es obligatorio.' : '',
  );
  protected readonly priceError = computed(() => this.submitted() && this.purchase() === null);
  protected readonly priceLabel = computed(() => {
    const p = this.purchase();
    return p ? `S/ ${p.amount} · ${presentationLabel(p.per.value, p.per.unit)}` : '';
  });

  protected nameValue(): string {
    return this.form.getRawValue().name || 'el insumo';
  }

  protected openPrice(): void {
    this.priceOpen.set(true);
  }

  protected closePrice(): void {
    this.priceOpen.set(false);
  }

  protected onPrice(purchase: PurchaseValue): void {
    this.purchase.set(purchase);
    this.priceOpen.set(false);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.form.markAllAsTouched();

    const purchase = this.purchase();
    if (this.form.controls.name.invalid || !purchase) {
      return;
    }

    this.saving.set(true);
    try {
      const result = await this.saveIngredient.execute({
        name: this.form.getRawValue().name,
        baseUnit: purchase.per.unit,
        usage: this.form.controls.usage.value,
        purchasePrice: { amount: purchase.amount, per: purchase.per, currency: purchase.currency },
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
}

/** Presentación de compra → etiqueta legible (solo presentación). */
function presentationLabel(value: number, unit: BaseUnit): string {
  if (unit === 'u') return `${value} u`;
  return value >= 1000 ? `${+(value / 1000).toFixed(2)} kg` : `${value} g`;
}
