import { inject, Injectable } from '@angular/core';
import {
  ExportableData,
  ExportedRows,
  ExportQuery,
  ExportRef,
} from '@core/_common/export/exportable-data';
import { BaseUnit } from '@core/_common/quantity';
import { ListRecipeBook } from '../application/use-cases/list-recipe-book.use-case';
import { CapacityGroup } from '../domain/entities/recipe-capacity';
import { SupplyUsage } from '../domain/value-objects/supply-usage';

/**
 * Nombres de agregado que este contexto publica, y la tabla en la que sale cada uno.
 *
 * Este diccionario es del recetario porque solo él sabe qué agregados tiene. Son los mismos nombres
 * que acompañan a sus eventos, así que quien reaccione a un `RecipeSaved` puede pedir
 * `aggregate: 'recipe'` sin conocer nada de aquí.
 */
export const RECIPE_BOOK_AGGREGATES = {
  supply: 'supplies',
  recipe: 'recipes',
  category: 'categories',
  flavor: 'flavors',
  capacity: 'capacities',
} as const;

export type RecipeBookAggregate = keyof typeof RECIPE_BOOK_AGGREGATES;

/** Al exportar una receta viajan también sus líneas y las tablas de referencia que cita. */
const RECIPE_TABLES = ['recipes', 'recipeLines', 'categories', 'flavors', 'capacities'];

/**
 * Filas exportadas: **DTOs de infraestructura**, solo primitivos. Los ids se acompañan de su
 * etiqueta resuelta (`categoryName`, `flavorLabel`…) porque el destino lo va a leer una persona; el
 * id sigue estando para poder reconciliar.
 */
interface SupplyRow {
  id: string;
  name: string;
  baseUnit: BaseUnit;
  usage: SupplyUsage;
  priceAmount: number;
  pricePerValue: number;
  pricePerUnit: BaseUnit;
  currency: string;
}

interface RecipeRow {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  flavorId: string | null;
  flavorLabel: string | null;
  portionsCapacityId: string | null;
  portionsCapacityLabel: string | null;
  moldCapacityId: string | null;
  moldCapacityLabel: string | null;
  lineCount: number;
}

interface RecipeLineRow {
  recipeId: string;
  recipeName: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: BaseUnit;
}

interface NamedRow {
  id: string;
  name: string;
}

interface FlavorRow {
  id: string;
  label: string;
}

interface CapacityRow {
  id: string;
  group: CapacityGroup;
  label: string;
  factor: number;
}

/**
 * Adaptador de salida del recetario hacia el contrato `ExportableData` del shared kernel.
 *
 * Es lo que permite que **otro contexto se lleve estos datos sin conocer este**. Aquí —y solo
 * aquí— se aplana el modelo del recetario a tablas planas: si mañana una receta gana un campo, este
 * es el único fichero que hay que tocar para que salga fuera.
 *
 * Vive en `infrastructure/` a propósito. Es un adaptador hacia el exterior, no una intención del
 * usuario: no existe ningún caso de uso «exportar el recetario» que alguien invoque desde la app,
 * y meterlo en `application/` sería fabricar uno para servir a otro contexto.
 */
@Injectable()
export class RecipeBookExportableData extends ExportableData {
  private readonly catalog = inject(ListRecipeBook);

  async export({ all, refs, aggregate }: ExportQuery): Promise<ExportedRows> {
    const { supplies, categories, recipes, flavors, recipeCapacities } =
      await this.catalog.execute();

    const supplyNames = new Map(supplies.map((supply) => [supply.id.value, supply.name]));
    const categoryNames = new Map(categories.map((category) => [category.id.value, category.name]));
    const flavorLabels = new Map(flavors.map((flavor) => [flavor.id.value, flavor.label]));
    const capacityLabels = new Map(
      recipeCapacities.map((capacity) => [capacity.id.value, capacity.label]),
    );

    const wantedRecipes = recipes.filter((recipe) => all || has(refs, 'recipe', recipe.id.value));

    const supplyRows: SupplyRow[] = supplies
      .filter((supply) => all || has(refs, 'supply', supply.id.value))
      .map((supply) => ({
        id: supply.id.value,
        name: supply.name,
        baseUnit: supply.baseUnit,
        usage: supply.usage,
        priceAmount: supply.purchasePrice.amount,
        pricePerValue: supply.purchasePrice.per.value,
        pricePerUnit: supply.purchasePrice.per.unit,
        currency: supply.purchasePrice.currency,
      }));

    const recipeRows: RecipeRow[] = wantedRecipes.map((recipe) => ({
      id: recipe.id.value,
      name: recipe.name,
      categoryId: recipe.categoryId.value,
      categoryName: categoryNames.get(recipe.categoryId.value) ?? '',
      flavorId: recipe.flavorId?.value ?? null,
      flavorLabel: recipe.flavorId ? (flavorLabels.get(recipe.flavorId.value) ?? null) : null,
      portionsCapacityId: recipe.portionsCapacityId?.value ?? null,
      portionsCapacityLabel: recipe.portionsCapacityId
        ? (capacityLabels.get(recipe.portionsCapacityId.value) ?? null)
        : null,
      moldCapacityId: recipe.moldCapacityId?.value ?? null,
      moldCapacityLabel: recipe.moldCapacityId
        ? (capacityLabels.get(recipe.moldCapacityId.value) ?? null)
        : null,
      lineCount: recipe.lines.length,
    }));

    const recipeLineRows: RecipeLineRow[] = wantedRecipes.flatMap((recipe) =>
      recipe.lines.map((line) => ({
        recipeId: recipe.id.value,
        recipeName: recipe.name,
        supplyId: line.supplyId.value,
        supplyName: supplyNames.get(line.supplyId.value) ?? '',
        quantity: line.quantity.value,
        unit: line.quantity.unit,
      })),
    );

    // Las referencias acompañan a las recetas: sin ellas, las etiquetas de una receta recién
    // exportada apuntarían a filas que todavía no existen en el destino.
    const withRecipes = all || recipeRows.length > 0;

    const categoryRows: NamedRow[] = categories
      .filter((category) => withRecipes || has(refs, 'category', category.id.value))
      .map((category) => ({ id: category.id.value, name: category.name }));

    const flavorRows: FlavorRow[] = flavors
      .filter((flavor) => withRecipes || has(refs, 'flavor', flavor.id.value))
      .map((flavor) => ({ id: flavor.id.value, label: flavor.label }));

    const capacityRows: CapacityRow[] = recipeCapacities
      .filter((capacity) => withRecipes || has(refs, 'capacity', capacity.id.value))
      .map((capacity) => ({
        id: capacity.id.value,
        group: capacity.group,
        label: capacity.label,
        factor: capacity.factor,
      }));

    const tables: ExportedRows = {
      supplies: supplyRows,
      recipes: recipeRows,
      recipeLines: recipeLineRows,
      categories: categoryRows,
      flavors: flavorRows,
      capacities: capacityRows,
    };

    return aggregate === undefined ? tables : only(tables, tablesOf(aggregate));
  }
}

function has(refs: readonly ExportRef[], aggregate: string, id: string): boolean {
  return refs.some((ref) => ref.aggregate === aggregate && ref.id === id);
}

/** Qué tablas produce un agregado. Un nombre desconocido no produce ninguna. */
function tablesOf(aggregate: string): readonly string[] {
  if (aggregate === 'recipe') {
    return RECIPE_TABLES;
  }
  const table = RECIPE_BOOK_AGGREGATES[aggregate as RecipeBookAggregate] as string | undefined;
  return table ? [table] : [];
}

function only(tables: ExportedRows, wanted: readonly string[]): ExportedRows {
  const filtered: Record<string, ExportedRows[string]> = {};
  for (const name of wanted) {
    const rows = tables[name];
    if (rows) {
      filtered[name] = rows;
    }
  }
  return filtered;
}
