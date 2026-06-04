import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { SocialPost } from '../../domain/social-post';
import { POPULARITY_REPOSITORY, SOCIAL_POST_REPOSITORY } from '../../domain/repositories';

export interface PublishProductionRequest {
  recipeId: string;
  recipeName: string;
}

/** Puntos de popularidad que otorga cada publicación. */
export const POINTS_PER_POST = 40;

/**
 * Publica una producción en redes (Fase 2): registra el SocialPost, suma
 * popularidad y emite ProductionPublished + PopularityUpdated.
 */
@Injectable({ providedIn: 'root' })
export class PublishProduction implements UseCase<PublishProductionRequest, { points: number }> {
  private readonly posts = inject(SOCIAL_POST_REPOSITORY);
  private readonly popularity = inject(POPULARITY_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute({ recipeId, recipeName }: PublishProductionRequest): Promise<{ points: number }> {
    const post = SocialPost.publish(await this.posts.nextId(), {
      recipeId,
      recipeName,
      points: POINTS_PER_POST,
    });
    await this.posts.save(post);
    await this.bus.publish(post.pullEvents());

    const popularity = await this.popularity.load();
    popularity.award(POINTS_PER_POST);
    await this.popularity.save(popularity);
    await this.bus.publish(popularity.pullEvents());

    return { points: popularity.points };
  }
}
