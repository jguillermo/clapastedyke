import { AggregateRoot } from '../../_common/domain/aggregate';
import { domainEvent } from '../../_common/domain/domain-event';
import { EntityId } from '../../_common/domain/entity-id';

export interface SocialPostPrimitives {
  id: string;
  recipeId: string;
  recipeName: string;
  points: number;
  date: string;
}

/**
 * SocialPost (PUB-): una producción publicada en redes. Inmutable; al
 * publicarse emite ProductionPublished (lo escucha la progresión).
 */
export class SocialPost extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly recipeId: string,
    readonly recipeName: string,
    readonly points: number,
    readonly date: Date,
  ) {
    super();
  }

  static publish(id: EntityId, data: { recipeId: string; recipeName: string; points: number }): SocialPost {
    const post = new SocialPost(id, data.recipeId, data.recipeName, data.points, new Date());
    post.recordEvent(domainEvent('ProductionPublished', id.value, { recipeId: data.recipeId }));
    return post;
  }

  static fromPrimitives(p: SocialPostPrimitives): SocialPost {
    return new SocialPost(EntityId.of(p.id), p.recipeId, p.recipeName, p.points, new Date(p.date));
  }

  toPrimitives(): SocialPostPrimitives {
    return {
      id: this.id.value,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      points: this.points,
      date: this.date.toISOString(),
    };
  }
}
