import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { CardSubtitle } from '@components/card/card-subtitle';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { FormField } from '@components/form-field/form-field';
import { InputField } from '@components/input/input';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import { SaveRecipe } from '@core/recipe-book/application/use-cases/save-recipe.use-case';
import { SaveSupply } from '@core/recipe-book/application/use-cases/save-supply.use-case';
import { SupplyGrid, type InitialLine, type SupplyOption } from '../_shared/supply-grid/supply-grid';

/** Datos del diálogo de crear/editar receta. */
export interface RecipeFormData {
  /** Categoría destino (fija): su id se guarda, su nombre se muestra como subtítulo. */
  category: { id: string; name: string };
  /** Catálogo de insumos (con precio) para autocompletar la grilla y resolver ids. */
  supplies: readonly Supply[];
  /** Presente → editar (precarga nombre + líneas); ausente → crear. */
  recipe?: { id: string; name: string; lines: InitialLine[] };
}

/** Resultado al guardar: para que el libro recargue y salte a la receta tocada. */
export interface RecipeFormResult {
  id: string;
  categoryId: string;
  name: string;
}

/**
 * Formulario ÚNICO de receta (crear y editar). Contenido de un MigoDialog. Edita el nombre y los
 * ingredientes (grilla reutilizable {@link SupplyGrid}, que muestra el costo). Al guardar, asegura
 * cada insumo por nombre ({@link SaveSupply}, create-if-absent) y persiste la receta
 * ({@link SaveRecipe}); la categoría es fija. Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Button, Icon, FormField, InputField, SupplyGrid],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:layers" size="lg" color="brand" />
        <migo-card-title>{{ data.recipe ? data.recipe.name : 'Nueva receta' }}</migo-card-title>
        <migo-card-subtitle>{{ data.category.name }}</migo-card-subtitle>
        <button card-actions migo-button variant="ghost" type="button" aria-label="Cerrar" (click)="cancel()">
          <migo-icon icon-leading name="mat:close" size="sm" />
        </button>
      </migo-card-header>

      <migo-card-body>
        <div class="flex flex-col gap-4">
          <migo-form-field label="Nombre">
            <migo-input [formControl]="name" placeholder="Nombre de la receta" />
          </migo-form-field>

          <app-supply-grid [supplies]="supplyOptions()" [initialLines]="initialLines()" />

          @if (errorMessage(); as error) {
            <p class="m-0 text-sm text-error" role="alert">{{ error }}</p>
          }
        </div>
      </migo-card-body>

      <migo-card-footer>
        <button migo-button variant="ghost" type="button" (click)="cancel()">Cancelar</button>
        <button migo-button type="button" [disabled]="!canSave() || saving()" (click)="save()">
          <migo-icon icon-leading name="mat:check" size="sm" />
          <span>Guardar</span>
        </button>
      </migo-card-footer>
    </migo-card>
  `,
})
export class RecipeForm {
  protected readonly ref = inject<MigoDialogRef<RecipeFormResult>>(MigoDialogRef);
  protected readonly data = inject<RecipeFormData>(MIGO_DIALOG_DATA);
  private readonly saveRecipe = inject(SaveRecipe);
  private readonly saveSupply = inject(SaveSupply);

  private readonly grid = viewChild.required(SupplyGrid);

  protected readonly name = new FormControl<string>(this.data.recipe?.name ?? '', { nonNullable: true });
  private readonly nameValue = toSignal(this.name.valueChanges, { initialValue: this.name.value });

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly canSave = computed(() => this.nameValue().trim().length > 0);

  protected readonly supplyOptions = computed<SupplyOption[]>(() =>
    this.data.supplies.map((s) => ({
      name: s.name,
      baseUnit: s.baseUnit,
      purchase: {
        amount: s.purchasePrice.amount,
        per: { value: s.purchasePrice.per.value, unit: s.purchasePrice.per.unit },
        currency: s.purchasePrice.currency,
      },
    })),
  );

  protected readonly initialLines = computed<InitialLine[]>(() => this.data.recipe?.lines ?? []);

  protected cancel(): void {
    this.ref.close();
  }

  protected async save(): Promise<void> {
    const name = this.name.value.trim();
    if (!name) {
      return;
    }
    const parsed = this.grid().collect();
    if (!parsed) {
      return; // la grilla muestra su propio error
    }
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      // Asegura cada insumo por nombre (create-if-absent) y resuelve su id.
      const lines = [];
      for (const line of parsed) {
        const { id: supplyId } = await this.saveSupply.execute({
          name: line.name,
          baseUnit: line.baseUnit,
          usage: 'recipe',
          purchasePrice: line.purchase,
        });
        lines.push({ supplyId, quantity: line.quantity });
      }
      const { id } = await this.saveRecipe.execute({
        id: this.data.recipe?.id,
        categoryId: this.data.category.id,
        name,
        lines,
      });
      this.ref.close({ id, categoryId: this.data.category.id, name });
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo guardar la receta.');
    } finally {
      this.saving.set(false);
    }
  }
}
