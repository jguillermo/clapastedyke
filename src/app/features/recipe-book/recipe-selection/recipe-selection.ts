import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { Combobox } from '@components/combobox/combobox';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { ConversionGroup } from '@core/recipe-book/domain/entities/conversion-option';
import {
  ConvertRecipe,
  type ConvertRecipeResult,
} from '@core/recipe-book/application/use-cases/convert-recipe.use-case';
import { SelectRecipe } from '@core/recipe-book/application/use-cases/select-recipe.use-case';
import { formatQuantity } from '../_shared/recipe-format';
import { messageOf } from '../_shared/recipe-form.utils';

/** Una opción de conversión en forma plana (label + factor + id). */
export interface SelectionOption {
  id: string;
  label: string;
  factor: number;
}

/** Un selector visible del diálogo de selección (sabor u opción de conversión). */
export interface RecipeSelectionField {
  propertyId: string;
  label: string;
  kind: 'flavor' | 'options';
  group?: ConversionGroup;
  /** Labels para el autocompletado. */
  suggestions: string[];
  /** Solo `options`: opciones del grupo con su factor (para mapear label → id). */
  options?: SelectionOption[];
}

/** Datos del diálogo: la receta y los selectores visibles (sabor/porciones/molde). */
export interface RecipeSelectionData {
  recipeId: string;
  recipeName: string;
  fields: RecipeSelectionField[];
}

interface PreviewLine {
  name: string;
  quantityLabel: string;
  cost: string;
}

/**
 * Diálogo para SELECCIONAR una receta en un tamaño. Muestra un autocompletado de
 * catálogo por cada propiedad visible (Sabor/Porciones/Molde, misma UX que `main`).
 * Sabor no escala; Porciones y Molde aplican su factor (se multiplican). Preview en
 * vivo vía `ConvertRecipe`; Guardar persiste la selección (`SelectRecipe`).
 */
@Component({
  selector: 'app-recipe-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Icon, FormField, Combobox],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  templateUrl: './recipe-selection.html',
})
export class RecipeSelection {
  private readonly convertRecipe = inject(ConvertRecipe);
  private readonly selectRecipe = inject(SelectRecipe);
  protected readonly ref = inject<MigoDialogRef<{ id: string }>>(MigoDialogRef);
  private readonly data = inject<RecipeSelectionData>(MIGO_DIALOG_DATA);

  protected readonly recipeName = this.data.recipeName;
  protected readonly fields = this.data.fields;

  protected readonly form = new FormGroup(
    Object.fromEntries(this.fields.map((f) => [f.propertyId, new FormControl<string>('', { nonNullable: true })])),
  );

  protected readonly preview = signal<ConvertRecipeResult | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly saving = signal(false);

  protected readonly previewLines = computed<PreviewLine[]>(() =>
    (this.preview()?.lines ?? []).map((line) => ({
      name: line.name,
      quantityLabel: formatQuantity(line.quantity.value, line.quantity.unit),
      cost: line.cost,
    })),
  );

  // Zoneless: recalcular la preview cuando cambia cualquier selector.
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: null });

  constructor() {
    this.form.valueChanges.subscribe(() => void this.refreshPreview());
  }

  protected control(propertyId: string): FormControl<string> {
    return this.form.get(propertyId) as FormControl<string>;
  }

  protected async save(): Promise<void> {
    this.errorMessage.set('');
    this.saving.set(true);
    try {
      const result = await this.selectRecipe.execute({
        recipeId: this.data.recipeId,
        flavorLabel: this.flavorLabel() || undefined,
        portionsOptionId: this.optionIdFor('portions'),
        moldOptionId: this.optionIdFor('mold'),
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

  // --- Helpers ---

  /** Label del sabor elegido (vacío si no hay campo sabor o no se eligió). */
  private flavorLabel(): string {
    const field = this.fields.find((f) => f.kind === 'flavor');
    return field ? (this.form.get(field.propertyId)?.value ?? '').trim() : '';
  }

  /** Id de la opción elegida en el grupo dado (mapea el label del autocompletado → id). */
  private optionIdFor(group: ConversionGroup): string | undefined {
    const field = this.fields.find((f) => f.kind === 'options' && f.group === group);
    if (!field) {
      return undefined;
    }
    const label = (this.form.get(field.propertyId)?.value ?? '').trim().toLowerCase();
    return field.options?.find((o) => o.label.toLowerCase() === label)?.id;
  }

  private async refreshPreview(): Promise<void> {
    this.formValue();
    const portionsOptionId = this.optionIdFor('portions');
    const moldOptionId = this.optionIdFor('mold');
    if (!portionsOptionId && !moldOptionId) {
      this.preview.set(null);
      return;
    }
    try {
      this.preview.set(
        await this.convertRecipe.execute({ recipeId: this.data.recipeId, portionsOptionId, moldOptionId }),
      );
      this.errorMessage.set('');
    } catch (error) {
      this.preview.set(null);
      this.errorMessage.set(messageOf(error));
    }
  }
}
