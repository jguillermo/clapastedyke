import { AggregateRoot } from '../../../_common/domain/aggregate';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';

export interface ProductionPrimitives {
  id: string;
  recipeId: string;
  recipeName: string;
  servings: number;
  cookedAt: string;
}

/**
 * Production (PRD-): el registro de una receta cocinada en la cocina de casa.
 * Inmutable; nace al cocinar y emite RecipeCooked (lo escucha la progresión).
 */
export class Production extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly recipeId: string,
    readonly recipeName: string,
    readonly servings: number,
    readonly cookedAt: Date,
  ) {
    super();
  }

  static cook(id: EntityId, data: { recipeId: string; recipeName: string; servings: number }): Production {
    const production = new Production(id, data.recipeId, data.recipeName, data.servings, new Date());
    production.recordEvent(
      domainEvent('RecipeCooked', id.value, {
        recipeId: data.recipeId,
        servings: data.servings,
      }),
    );
    return production;
  }

  static fromPrimitives(p: ProductionPrimitives): Production {
    return new Production(EntityId.of(p.id), p.recipeId, p.recipeName, p.servings, new Date(p.cookedAt));
  }

  toPrimitives(): ProductionPrimitives {
    return {
      id: this.id.value,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      servings: this.servings,
      cookedAt: this.cookedAt.toISOString(),
    };
  }
}
