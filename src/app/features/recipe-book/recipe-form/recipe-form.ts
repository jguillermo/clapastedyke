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
import { SelectTag, type SelectTagType } from '@components/select-tag/select-tag';
import { MIGO_DIALOG_DATA, MigoDialogRef } from '@components/dialog/dialog.service';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { RecipeFlavor } from '@core/recipe-book/domain/entities/recipe-flavor';
import type { RecipeCapacity } from '@core/recipe-book/domain/entities/recipe-capacity';
import { SaveRecipe } from '@core/recipe-book/application/use-cases/save-recipe.use-case';
import { SaveSupply } from '@core/recipe-book/application/use-cases/save-supply.use-case';
import {
  SaveRecipeProperty,
  type RecipePropertyKind,
} from '@core/recipe-book/application/use-cases/save-recipe-property.use-case';
import { SupplyGrid, type InitialLine, type SupplyOption } from '../_shared/supply-grid/supply-grid';

/** Datos del diálogo de crear/editar receta. */
export interface RecipeFormData {
  /** Categoría destino (fija): su id se guarda, su nombre se muestra como subtítulo. */
  category: { id: string; name: string };
  /** Catálogo de insumos (con precio) para autocompletar la grilla y resolver ids. */
  supplies: readonly Supply[];
  /** Catálogo de sabores para el campo de características (elegir uno existente o crear uno nuevo). */
  flavors: readonly RecipeFlavor[];
  /** Catálogo de capacidades (porciones/molde) para el campo de características. */
  capacities: readonly RecipeCapacity[];
  /** Presente → editar (precarga nombre + líneas + sabor + tamaño); ausente → crear. */
  recipe?: {
    id: string;
    name: string;
    lines: InitialLine[];
    flavorLabel: string | null;
    portionsLabel: string | null;
    moldLabel: string | null;
  };
}

/** Resultado al guardar: para que el libro recargue y salte a la receta tocada. */
export interface RecipeFormResult {
  id: string;
  categoryId: string;
  name: string;
}

/**
 * Formulario ÚNICO de receta (crear y editar). Contenido de un MigoDialog. Edita el nombre y los
 * ingredientes (grilla reutilizable {@link SupplyGrid}, que muestra el costo). Las tres
 * características —sabor, porciones y molde, que coexisten— se piden en UN solo campo estilo Select2
 * ({@link SelectTag}) con un tipo por característica: elige o crea una etiqueta, con su × para
 * quitarla. Al guardar, asegura cada insumo por nombre ({@link SaveSupply}, create-if-absent),
 * resuelve cada característica a su id ({@link SaveRecipeProperty}, creándola si es nueva) y
 * persiste la receta ({@link SaveRecipe}); la categoría es fija. Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Button, Icon, FormField, InputField, SelectTag, SupplyGrid],
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

          <migo-form-field label="Características (opcional)">
            <migo-select-tag
              [types]="propertyTypes()"
              [value]="propertyValue()"
              (valueChange)="propertyValue.set($event)"
              (created)="onPropertyCreated($event)"
              placeholder="Añade sabor, porciones y/o molde…"
            />
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
  private readonly saveProperty = inject(SaveRecipeProperty);

  private readonly grid = viewChild.required(SupplyGrid);

  protected readonly name = new FormControl<string>(this.data.recipe?.name ?? '', { nonNullable: true });
  private readonly nameValue = toSignal(this.name.valueChanges, { initialValue: this.name.value });

  /**
   * Los tres tipos del campo único de características: el sabor y las dos dimensiones de tamaño
   * (porciones y molde, que coexisten). Las claves son los `RecipePropertyKind` del caso de uso.
   */
  protected readonly propertyTypes = computed<SelectTagType[]>(() => {
    const portions = this.data.capacities.filter((c) => c.group === 'portions');
    const mold = this.data.capacities.filter((c) => c.group === 'mold');
    return [
      { key: 'flavor', label: 'Sabor', values: this.data.flavors.map((f) => f.label), allowCreate: true },
      {
        key: 'portions',
        label: 'Porciones',
        values: portions.map((c) => c.label),
        allowCreate: true,
        // Las porciones ya son un número (p.ej. "33"): ese número se usa directo como factor, sin
        // preguntar nada — `extraField` solo actúa de red de seguridad si alguien teclea texto.
        extraField: {
          label: 'Factor de escalado (1 = base, 2 = doble)',
          placeholder: 'Ej. 2',
          reference: portions.map((c) => ({ label: c.label, extra: c.factor })),
        },
      },
      {
        key: 'mold',
        label: 'Molde',
        values: mold.map((c) => c.label),
        allowCreate: true,
        extraField: {
          label: 'Factor de escalado (1 = base, 0.5 = mitad)',
          placeholder: 'Ej. 1/8 o 0.2',
          reference: mold.map((c) => ({ label: c.label, extra: c.factor })),
        },
      },
    ];
  });
  protected readonly propertyValue = signal<Record<string, string>>({
    ...(this.data.recipe?.flavorLabel ? { flavor: this.data.recipe.flavorLabel } : {}),
    ...(this.data.recipe?.portionsLabel ? { portions: this.data.recipe.portionsLabel } : {}),
    ...(this.data.recipe?.moldLabel ? { mold: this.data.recipe.moldLabel } : {}),
  });
  /** Factor capturado al crear una capacidad nueva (por tipo), pendiente de persistir en `save()`. */
  private readonly pendingFactors = signal<Partial<Record<RecipePropertyKind, number>>>({});

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

  protected onPropertyCreated(event: { typeKey: string; value: string; extra: number }): void {
    this.pendingFactors.update((current) => ({ ...current, [event.typeKey]: event.extra }));
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

      const flavorId = await this.resolveProperty('flavor', this.propertyValue()['flavor']);
      const portionsCapacityId = await this.resolveProperty('portions', this.propertyValue()['portions']);
      const moldCapacityId = await this.resolveProperty('mold', this.propertyValue()['mold']);

      const { id } = await this.saveRecipe.execute({
        id: this.data.recipe?.id,
        categoryId: this.data.category.id,
        name,
        lines,
        flavorId,
        portionsCapacityId,
        moldCapacityId,
      });
      this.ref.close({ id, categoryId: this.data.category.id, name });
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo guardar la receta.');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Resuelve a un id el label elegido para una característica. El dedup por label lo hace
   * {@link SaveRecipeProperty} (devuelve el id del que ya existe, sin tocar su factor); si es nuevo,
   * lo crea con el factor capturado al añadirlo (`onPropertyCreated`).
   */
  private async resolveProperty(kind: RecipePropertyKind, label: string | undefined): Promise<string | null> {
    const trimmed = label?.trim() ?? '';
    if (!trimmed) {
      return null;
    }
    const { id } = await this.saveProperty.execute({
      kind,
      label: trimmed,
      factor: this.pendingFactors()[kind],
    });
    return id;
  }
}
