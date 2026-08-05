import { inject, Injectable } from '@angular/core';
import { EntityId } from '@core/_common/entity-id';
import { ExportedRow, ExportRef } from '@core/_common/export/exportable-data';
import {
  ApplyOutcome,
  ImportableData,
  ImportChange,
  RejectedRow,
} from '@core/_common/import/importable-data';
import { Logger } from '@core/_common/logger/logger';
import { BaseUnit, Quantity } from '@core/_common/quantity';
import { CapacityGroup, RecipeCapacity } from '../domain/entities/recipe-capacity';
import { RecipeCategory } from '../domain/entities/recipe-category';
import { RecipeFlavor } from '../domain/entities/recipe-flavor';
import { Recipe } from '../domain/entities/recipe';
import { Supply } from '../domain/entities/supply';
import { RecipeCapacityRepository } from '../domain/repositories/recipe-capacity.repository';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { RecipeFlavorRepository } from '../domain/repositories/recipe-flavor.repository';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { SupplyRepository } from '../domain/repositories/supply.repository';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { RecipeIngredient } from '../domain/value-objects/recipe-ingredient';
import { isSupplyUsage, SupplyUsage } from '../domain/value-objects/supply-usage';

/**
 * Adaptador de entrada del recetario: convierte filas que vienen de fuera en agregados de aquí.
 *
 * Es el gemelo de `RecipeBookExportableData` y su espejo exacto: allí se aplana el modelo a tablas,
 * aquí se levanta el modelo desde tablas. Los dos viven en `infrastructure/` por lo mismo — son
 * adaptadores hacia el exterior, no intenciones del usuario.
 *
 * ## Rehidrata con `restore`, y valida con `assertValid`
 *
 * `restore(...)` es la puerta muda: no graba eventos, que es justo lo que hace falta (ver
 * `ImportableData`). Pero **tampoco valida**, así que las reglas de entidad hay que comprobarlas antes
 * de rehidratar — y se comprueban **llamando a las de la entidad**, no repitiéndolas: cada agregado
 * expone `assertValid(data)`, que es lo mismo que ejecuta su `create`. Un solo dueño por regla.
 *
 * Antes estaban duplicadas aquí, y era una duplicación que se rompe sola: una regla nueva en `create`
 * dejaba entrar por esta puerta un agregado que la app no sabe pintar. Llamar a `create` para validar y
 * tirar la instancia no es alternativa —`infrastructure/` no puede llamar a `create`, y confiar en que
 * nadie saque los eventos de una instancia tirada es justo el tipo de sutileza que se rompe—, y por eso
 * la validación se expone aparte.
 *
 * El resto de reglas las ponen los value objects, que lanzan igual por las dos puertas: `EntityId`
 * rechaza un id vacío, `Quantity.of` una cantidad que no sea finita y positiva, `PurchasePrice.of` un
 * importe que no lo sea.
 *
 * ## Ninguna fila mala tumba el lote
 *
 * Cada fila va en su propio `try`. Una celda imposible se devuelve como rechazada, con un motivo que
 * se le pueda enseñar a alguien, y el resto del lote entra igual.
 *
 * ## El orden importa
 *
 * Primero los catálogos (categorías, sabores, capacidades, insumos) y después las recetas, porque una
 * receta cita a los demás por id y sus líneas necesitan el insumo para saber en qué unidad se mide.
 */
@Injectable()
export class RecipeBookImportableData extends ImportableData {
  private readonly categories = inject(RecipeCategoryRepository);
  private readonly flavors = inject(RecipeFlavorRepository);
  private readonly capacities = inject(RecipeCapacityRepository);
  private readonly supplies = inject(SupplyRepository);
  private readonly recipes = inject(RecipeRepository);
  private readonly log = inject(Logger).scoped('recipe-book/import');

  async apply({ tables, deleted }: ImportChange): Promise<ApplyOutcome> {
    this.log.debug('aplicando lo que llega de fuera ▶', {
      tablas: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
      borrados: deleted.length,
    });

    const applied: ExportRef[] = [];
    const rejected: RejectedRow[] = [];

    await this.applyTable('category', tables['categories'], applied, rejected, (row) =>
      this.category(row),
    );
    await this.applyTable('flavor', tables['flavors'], applied, rejected, (row) =>
      this.flavor(row),
    );
    await this.applyTable('capacity', tables['capacities'], applied, rejected, (row) =>
      this.capacity(row),
    );
    await this.applyTable('supply', tables['supplies'], applied, rejected, (row) =>
      this.supply(row),
    );
    await this.applyTable('recipe', tables['recipes'], applied, rejected, (row) =>
      this.recipe(row, tables['recipeLines'] ?? []),
    );

    await this.remove(deleted, applied, rejected);

    this.log.debug('aplicando lo que llega de fuera ✔', {
      aplicadas: applied.length,
      rechazadas: rejected.length,
    });
    if (rejected.length > 0) {
      this.log.warn('hay filas del destino que no se pueden leer', undefined, {
        ejemplos: rejected.slice(0, 5),
      });
    }
    return { applied, rejected };
  }

  /** Recorre una tabla dejando que cada fila falle por su cuenta. */
  private async applyTable(
    aggregate: string,
    rows: readonly ExportedRow[] | undefined,
    applied: ExportRef[],
    rejected: RejectedRow[],
    save: (row: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    for (const row of rows ?? []) {
      const values = row as Record<string, unknown>;
      // El id se lee antes del `try` para poder decir DE QUÉ fila se habla incluso si nada más se
      // puede leer. Sin él, un rechazo sería «una fila de insumos ha fallado», que no sirve de nada.
      const id = text(values['id']) || text(values['recipeId']);
      try {
        applied.push({ aggregate, id: await save(values) });
      } catch (error) {
        rejected.push({ ref: { aggregate, id }, reason: describe(error) });
      }
    }
  }

  private async remove(
    deleted: readonly ExportRef[],
    applied: ExportRef[],
    rejected: RejectedRow[],
  ): Promise<void> {
    for (const ref of deleted) {
      try {
        await this.repositoryFor(ref.aggregate).delete(new EntityId(ref.id));
        applied.push(ref);
      } catch (error) {
        rejected.push({ ref, reason: describe(error) });
      }
    }
  }

  private repositoryFor(aggregate: string): { delete(id: EntityId): Promise<void> } {
    switch (aggregate) {
      case 'supply':
        return this.supplies;
      case 'recipe':
        return this.recipes;
      case 'category':
        return this.categories;
      case 'flavor':
        return this.flavors;
      case 'capacity':
        return this.capacities;
      default:
        throw new Error(`El recetario no tiene ningún «${aggregate}».`);
    }
  }

  // ── Un método por agregado ───────────────────────────────────────────────────────────────────

  private async category(values: Record<string, unknown>): Promise<string> {
    const data = { id: new EntityId(text(values['id'])), name: text(values['name']) };
    RecipeCategory.assertValid(data);

    await this.categories.save(RecipeCategory.restore(data));
    return data.id.value;
  }

  private async flavor(values: Record<string, unknown>): Promise<string> {
    const data = { id: new EntityId(text(values['id'])), label: text(values['label']) };
    RecipeFlavor.assertValid(data);

    await this.flavors.save(RecipeFlavor.restore(data));
    return data.id.value;
  }

  private async capacity(values: Record<string, unknown>): Promise<string> {
    const data = {
      id: new EntityId(text(values['id'])),
      // La conversión de tipo es de la traducción, no una regla: `assertValid` comprueba justo después
      // que el grupo exista de verdad, así que una celda con cualquier cosa se rechaza igual.
      group: text(values['group']).toLowerCase() as CapacityGroup,
      label: text(values['label']),
      factor: number(values['factor'], 'El factor de la capacidad'),
    };
    RecipeCapacity.assertValid(data);

    await this.capacities.save(RecipeCapacity.restore(data));
    return data.id.value;
  }

  private async supply(values: Record<string, unknown>): Promise<string> {
    const per = Quantity.of(
      number(values['pricePerValue'], 'La presentación de compra'),
      unit(values['pricePerUnit'], 'La unidad de la presentación de compra'),
    );
    const data = {
      id: new EntityId(text(values['id'])),
      name: text(values['name']),
      baseUnit: unit(values['baseUnit'], 'La unidad base del insumo'),
      usage: supplyUsage(values['usage']),
      purchasePrice: PurchasePrice.of(
        number(values['priceAmount'], 'El precio'),
        per,
        text(values['currency']) || 'PEN',
      ),
    };
    Supply.assertValid(data);

    await this.supplies.save(Supply.restore(data));
    return data.id.value;
  }

  private async recipe(
    values: Record<string, unknown>,
    lines: readonly ExportedRow[],
  ): Promise<string> {
    const id = new EntityId(text(values['id']));
    const data = {
      id,
      categoryId: new EntityId(text(values['categoryId'])),
      name: text(values['name']),
      ingredients: await this.ingredientsOf(id.value, lines),
      flavorId: optionalId(values['flavorId']),
      portionsCapacityId: optionalId(values['portionsCapacityId']),
      moldCapacityId: optionalId(values['moldCapacityId']),
    };
    // Aquí es donde muerde la regla «una receta necesita al menos un ingrediente»: si alguien le borró
    // las líneas a mano, la receta se rechaza en vez de entrar en un estado que la app no sabe pintar.
    Recipe.assertValid(data);

    await this.recipes.save(Recipe.restore(data));
    return id.value;
  }

  /**
   * Las líneas de una receta.
   *
   * La unidad la dicta **el insumo**, no la celda: es el insumo el que sabe si se mide en gramos o en
   * unidades, y una celda que dijera otra cosa daría un costo disparatado. Una línea que cite un insumo
   * que no existe se salta —no se inventa— y si eso deja la receta sin ninguna, la receta se rechaza.
   */
  private async ingredientsOf(
    recipeId: string,
    lines: readonly ExportedRow[],
  ): Promise<RecipeIngredient[]> {
    const ingredients: RecipeIngredient[] = [];

    for (const line of lines) {
      const values = line as Record<string, unknown>;
      if (text(values['recipeId']) !== recipeId) {
        continue;
      }
      const supplyId = text(values['supplyId']);
      const supply = supplyId ? await this.supplies.byId(new EntityId(supplyId)) : null;
      if (!supply) {
        this.log.warn('línea de receta con un insumo que no está, se omite', undefined, {
          recipeId,
          supplyId,
        });
        continue;
      }
      ingredients.push(
        RecipeIngredient.of(
          supply.id,
          Quantity.of(number(values['quantity'], 'La cantidad de la línea'), supply.baseUnit),
        ),
      );
    }
    return ingredients;
  }
}

// ── Lectura de valores que vienen de fuera ─────────────────────────────────────────────────────

/**
 * Texto de una celda. Puede llegar como número (una hoja devuelve números como números), así que se
 * convierte antes de recortar.
 */
function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

/**
 * Número de una celda, venga como número o como texto. Acepta la coma decimal de quien teclea en
 * español, y solo cuando no hay ambigüedad — `1.234,56` significa cosas distintas en dos idiomas y no
 * se adivina.
 */
function number(value: unknown, what: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const raw = text(value).replace(/\s/g, '');
  const normalised =
    (raw.match(/,/g) ?? []).length === 1 && !raw.includes('.') ? raw.replace(',', '.') : raw;
  const parsed = Number(normalised);
  if (normalised.length === 0 || !Number.isFinite(parsed)) {
    throw new Error(`${what} no es un número: «${text(value)}».`);
  }
  return parsed;
}

function unit(value: unknown, what: string): BaseUnit {
  const raw = text(value).toLowerCase();
  if (raw !== 'g' && raw !== 'u') {
    throw new Error(`${what} tiene que ser «g» o «u», y dice «${text(value)}».`);
  }
  return raw;
}

function supplyUsage(value: unknown): SupplyUsage {
  const raw = text(value).toLowerCase();
  // Un uso en blanco no es un error del usuario: es una columna que quizá no rellenó. Se le pone el
  // caso normal en vez de rechazar la fila entera por una etiqueta de agrupación.
  return isSupplyUsage(raw) ? raw : 'recipe';
}

/** Un id que puede no estar. Vacío = no hay, que es distinto de un id malo. */
function optionalId(value: unknown): EntityId | null {
  const raw = text(value);
  return raw.length === 0 ? null : new EntityId(raw);
}

function describe(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'La fila no se ha podido interpretar.';
}
