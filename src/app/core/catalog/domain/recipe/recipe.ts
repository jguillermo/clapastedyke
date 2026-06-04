import { AggregateRoot } from '../../../_common/domain/aggregate';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';

export type BaseType = 'people' | 'size';

/**
 * Ingredient line: internal entity of the Recipe aggregate (the GAS RI- is a
 * private detail). References the Supply ONLY by identity.
 */
export interface RecipeIngredient {
  supplyId: string;
  /** Quantity per recipe baseServings, in the supply's base unit. */
  baseQuantity: number;
}

export interface RecipePrimitives {
  id: string;
  name: string;
  category: string;
  baseType: BaseType;
  baseServings: number;
  laborHours: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
}

/**
 * Recipe (RC-): defines what a product contains and how much it yields
 * (baseServings). It is what the quote SCALES. Invariant: at least one
 * ingredient with quantity > 0. Changing it does NOT affect saved quotes
 * (they freeze their detail).
 */
export class Recipe extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    private _name: string,
    private _category: string,
    private _baseType: BaseType,
    private _baseServings: number,
    private _laborHours: number,
    private _ingredients: RecipeIngredient[],
    readonly createdAt: Date,
  ) {
    super();
  }

  static create(
    id: EntityId,
    data: {
      name: string;
      category?: string;
      baseType: BaseType;
      baseServings: number;
      laborHours?: number;
      ingredients: RecipeIngredient[];
    },
  ): Recipe {
    const recipe = new Recipe(
      id,
      Recipe.validName(data.name),
      (data.category ?? '').trim(),
      data.baseType,
      Recipe.validServings(data.baseServings),
      Recipe.validHours(data.laborHours ?? 0),
      Recipe.validIngredients(data.ingredients),
      new Date(),
    );
    recipe.recordEvent(domainEvent('RecipeCreated', id.value, { name: recipe._name }));
    return recipe;
  }

  static fromPrimitives(p: RecipePrimitives): Recipe {
    return new Recipe(
      EntityId.of(p.id),
      p.name,
      p.category,
      p.baseType,
      p.baseServings,
      p.laborHours,
      p.ingredients.map(i => ({ ...i })),
      new Date(p.createdAt),
    );
  }

  /** Full edit (the GAS rewrites the lines): same invariants. */
  edit(data: {
    name: string;
    category?: string;
    baseType: BaseType;
    baseServings: number;
    laborHours?: number;
    ingredients: RecipeIngredient[];
  }): void {
    this._name = Recipe.validName(data.name);
    this._category = (data.category ?? '').trim();
    this._baseType = data.baseType;
    this._baseServings = Recipe.validServings(data.baseServings);
    this._laborHours = Recipe.validHours(data.laborHours ?? 0);
    this._ingredients = Recipe.validIngredients(data.ingredients);
    this.recordEvent(domainEvent('RecipeEdited', this.id.value, { name: this._name }));
  }

  get name(): string {
    return this._name;
  }
  get category(): string {
    return this._category;
  }
  get baseType(): BaseType {
    return this._baseType;
  }
  get baseServings(): number {
    return this._baseServings;
  }
  get laborHours(): number {
    return this._laborHours;
  }
  get ingredients(): readonly RecipeIngredient[] {
    return this._ingredients;
  }

  toPrimitives(): RecipePrimitives {
    return {
      id: this.id.value,
      name: this._name,
      category: this._category,
      baseType: this._baseType,
      baseServings: this._baseServings,
      laborHours: this._laborHours,
      ingredients: this._ingredients.map(i => ({ ...i })),
      createdAt: this.createdAt.toISOString(),
    };
  }

  /* ---------- Invariants ---------- */

  private static validName(name: string): string {
    const clean = (name ?? '').trim();
    if (!clean) throw new ValidationError('The recipe name is required.');
    return clean;
  }

  private static validServings(servings: number): number {
    if (!Number.isFinite(servings) || servings <= 0) {
      throw new ValidationError('The recipe base (servings) must be greater than 0.');
    }
    return servings;
  }

  private static validHours(hours: number): number {
    if (!Number.isFinite(hours) || hours < 0) {
      throw new ValidationError('The labor time cannot be negative.');
    }
    return hours;
  }

  private static validIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
    const active = (ingredients ?? []).filter(i => i.supplyId && i.baseQuantity > 0);
    if (!active.length) {
      throw new ValidationError('Add at least one ingredient with quantity greater than 0.');
    }
    return active.map(i => ({ supplyId: i.supplyId, baseQuantity: i.baseQuantity }));
  }
}
