import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
import { Logger } from '@core/_common/logger/logger';
import type { Supply } from '@core/recipe-book/domain/entities/supply';
import type { RecipeFlavor } from '@core/recipe-book/domain/entities/recipe-flavor';
import type { RecipeCapacity } from '@core/recipe-book/domain/entities/recipe-capacity';
import { DeleteRecipe } from '@core/recipe-book/application/use-cases/delete-recipe.use-case';
import { SaveRecipe } from '@core/recipe-book/application/use-cases/save-recipe.use-case';
import {
  SaveRecipeProperty,
  type RecipePropertyKind,
} from '@core/recipe-book/application/use-cases/save-recipe-property.use-case';
import {
  SupplyGrid,
  type InitialLine,
  type SupplyOption,
} from '../_shared/supply-grid/supply-grid';

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
  /**
   * `true` si lo que se hizo fue **borrarla**. El libro recarga igual, pero no puede saltar a ella: ya
   * no está, y buscarla dejaría el libro en su portada sin explicación.
   */
  deleted?: boolean;
}

/**
 * Formulario ÚNICO de receta (crear y editar). Contenido de un MigoDialog. Edita el nombre y los
 * ingredientes (grilla reutilizable {@link SupplyGrid}, que muestra el costo). Las tres
 * características —sabor, porciones y molde, que coexisten— se piden en UN solo campo estilo Select2
 * ({@link SelectTag}) con un tipo por característica: elige o crea una etiqueta, con su × para
 * quitarla.
 *
 * **Guardar escribe una sola cosa: la receta** ({@link SaveRecipe}). Los insumos y las características
 * son agregados aparte, con su propio guardado, y para cuando se pulsa Guardar **ya están
 * persistidos**: el insumo al fijar su precio en la grilla y la característica al crearla
 * ({@link onPropertyCreated}). Aquí solo viajan sus ids. La categoría es fija.
 */
@Component({
  selector: 'app-recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Button,
    Icon,
    FormField,
    InputField,
    SelectTag,
    SupplyGrid,
  ],
  // `contents`: el card `fill` es hijo flex directo del diálogo y llena la pantalla en móvil.
  host: { class: 'contents' },
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-icon card-icon name="mat:layers" size="lg" color="brand" />
        <migo-card-title>{{ data.recipe ? data.recipe.name : 'Nueva receta' }}</migo-card-title>
        <migo-card-subtitle>{{ data.category.name }}</migo-card-subtitle>
        <button
          card-actions
          migo-button
          variant="ghost"
          type="button"
          aria-label="Cerrar"
          (click)="cancel()"
        >
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

      <!-- Borrar pregunta EN EL SITIO, y mientras pregunta no se ve nada más: un pie con «Borrar»,
           «Cancelar» y «Guardar» a la vez invita a pulsar el que no era. -->
      <migo-card-footer>
        @if (confirmingDelete()) {
          <span class="me-auto font-body text-sm text-body">
            Se borrará «{{ data.recipe?.name }}».
          </span>
          <button migo-button variant="ghost" type="button" (click)="keepRecipe()">
            Conservar
          </button>
          <!-- «Sí, borrar» y no «Borrar»: el rótulo del que confirma no puede ser idéntico al del que
               pregunta, o quien pulsa dos veces seguidas por inercia borra sin haber leído. -->
          <button
            migo-button
            variant="danger"
            type="button"
            [loading]="deleting()"
            (click)="removeRecipe()"
          >
            Sí, borrar
          </button>
        } @else {
          @if (data.recipe) {
            <button
              class="me-auto"
              migo-button
              variant="ghost"
              type="button"
              (click)="askToDelete()"
            >
              <migo-icon icon-leading name="mat:delete" size="sm" />
              <span>Borrar</span>
            </button>
          }
          <button migo-button variant="ghost" type="button" (click)="cancel()">Cancelar</button>
          <button migo-button type="button" [disabled]="!canSave() || saving()" (click)="save()">
            <migo-icon icon-leading name="mat:check" size="sm" />
            <span>Guardar</span>
          </button>
        }
      </migo-card-footer>
    </migo-card>
  `,
})
export class RecipeForm {
  protected readonly ref = inject<MigoDialogRef<RecipeFormResult>>(MigoDialogRef);
  protected readonly data = inject<RecipeFormData>(MIGO_DIALOG_DATA);
  private readonly saveRecipe = inject(SaveRecipe);
  private readonly saveProperty = inject(SaveRecipeProperty);
  private readonly deleteRecipe = inject(DeleteRecipe);
  private readonly log = inject(Logger).scoped('ui/recipe-form');

  private readonly grid = viewChild.required(SupplyGrid);

  protected readonly name = new FormControl<string>(this.data.recipe?.name ?? '', {
    nonNullable: true,
  });
  private readonly nameValue = toSignal(this.name.valueChanges, { initialValue: this.name.value });

  /**
   * Los tres tipos del campo único de características: el sabor y las dos dimensiones de tamaño
   * (porciones y molde, que coexisten). Las claves son los `RecipePropertyKind` del caso de uso.
   */
  protected readonly propertyTypes = computed<SelectTagType[]>(() => {
    const portions = this.data.capacities.filter((c) => c.group === 'portions');
    const mold = this.data.capacities.filter((c) => c.group === 'mold');
    return [
      {
        key: 'flavor',
        label: 'Sabor',
        values: this.data.flavors.map((f) => f.label),
        allowCreate: true,
      },
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
  /**
   * Ids de las características **creadas en esta sesión del formulario**, indexadas por
   * `tipo:label`. Se llenan en el momento de crearlas ({@link onPropertyCreated}), no al guardar.
   */
  private readonly createdPropertyIds = signal<Record<string, string>>({});

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  /** El pie está preguntando si borrar. Solo se puede llegar aquí editando una receta que existe. */
  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);

  protected readonly canSave = computed(() => this.nameValue().trim().length > 0);

  protected readonly supplyOptions = computed<SupplyOption[]>(() =>
    this.data.supplies.map((s) => ({
      id: s.id.value,
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

  /**
   * Crear una característica **es guardarla**: se persiste aquí mismo, cuando el usuario la añade, y
   * su id queda anotado. Al guardar la receta ya existe y solo se manda ese id.
   */
  protected async onPropertyCreated(event: {
    typeKey: string;
    value: string;
    extra?: number;
  }): Promise<void> {
    const kind = event.typeKey as RecipePropertyKind;
    const label = event.value.trim();
    this.log.debug('crear característica ▶', { kind, conFactor: event.extra !== undefined });
    try {
      const { id } = await this.saveProperty.execute({ kind, label, factor: event.extra });
      this.createdPropertyIds.update((current) => ({ ...current, [propertyKey(kind, label)]: id }));
      this.log.debug('crear característica ✔', { kind, id });
    } catch (error) {
      // El texto en pantalla no sustituye al registro: aquí queda la causa con su pila.
      this.log.warn('no se pudo guardar la característica', error, { kind });
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo guardar la característica.',
      );
    }
  }

  protected askToDelete(): void {
    this.errorMessage.set('');
    this.confirmingDelete.set(true);
  }

  protected keepRecipe(): void {
    this.confirmingDelete.set(false);
  }

  /**
   * Borra la receta que se está editando y cierra.
   *
   * Cierra con `deleted` para que el libro recargue **sin intentar saltar** a una receta que ya no está.
   */
  protected async removeRecipe(): Promise<void> {
    const recipe = this.data.recipe;
    if (!recipe) {
      return;
    }

    this.log.debug('borrar receta ▶', { id: recipe.id });
    this.deleting.set(true);
    this.errorMessage.set('');
    try {
      await this.deleteRecipe.execute({ id: recipe.id });
      this.log.debug('borrar receta ✔', { id: recipe.id });
      this.ref.close({
        id: recipe.id,
        categoryId: this.data.category.id,
        name: recipe.name,
        deleted: true,
      });
    } catch (error) {
      // El mensaje en pantalla no sustituye al registro: aquí queda la causa con su pila.
      this.log.warn('no se pudo borrar la receta', error, { id: recipe.id });
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo borrar la receta.',
      );
      this.confirmingDelete.set(false);
    } finally {
      this.deleting.set(false);
    }
  }

  protected async save(): Promise<void> {
    const name = this.name.value.trim();
    if (!name) {
      this.log.debug('guardar receta: sin nombre, no se guarda');
      return;
    }
    const parsed = this.grid().collect();
    if (!parsed) {
      this.log.debug('guardar receta: la grilla rechazó las líneas, no se guarda');
      return; // la grilla muestra su propio error
    }
    this.log.debug('guardar receta ▶', {
      editando: this.data.recipe?.id !== undefined,
      lineas: parsed.length,
    });
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      // Insumos y características ya están guardados (al fijar su precio / al crearlos): aquí solo
      // viajan sus ids. Un único caso de uso, una única escritura.
      const { id } = await this.saveRecipe.execute({
        id: this.data.recipe?.id,
        categoryId: this.data.category.id,
        name,
        ingredients: parsed.map((line) => ({
          supplyId: line.supplyId,
          quantity: line.quantity,
          unit: line.baseUnit,
        })),
        flavorId: this.propertyId('flavor'),
        portionsCapacityId: this.propertyId('portions'),
        moldCapacityId: this.propertyId('mold'),
      });
      this.log.debug('guardar receta ✔', { id });
      this.ref.close({ id, categoryId: this.data.category.id, name });
    } catch (error) {
      this.log.warn('no se pudo guardar la receta', error, { editando: !!this.data.recipe?.id });
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo guardar la receta.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * El id de la característica elegida para un tipo: la que se acaba de crear o la del catálogo que
   * coincide por label. Es una búsqueda en memoria — el catálogo llega como data del diálogo—, no una
   * escritura.
   */
  private propertyId(kind: RecipePropertyKind): string | null {
    const label = this.propertyValue()[kind]?.trim() ?? '';
    if (!label) {
      return null;
    }
    const created = this.createdPropertyIds()[propertyKey(kind, label)];
    if (created) {
      return created;
    }
    const target = label.toLowerCase();
    if (kind === 'flavor') {
      return this.data.flavors.find((f) => f.label.toLowerCase() === target)?.id.value ?? null;
    }
    return (
      this.data.capacities.find((c) => c.group === kind && c.label.toLowerCase() === target)?.id
        .value ?? null
    );
  }
}

/** Clave de una característica creada en esta sesión: tipo + label, insensible a mayúsculas. */
function propertyKey(kind: RecipePropertyKind, label: string): string {
  return `${kind}:${label.toLowerCase()}`;
}
