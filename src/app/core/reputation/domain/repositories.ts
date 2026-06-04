import { InjectionToken } from '@angular/core';
import { EntityId } from '../../_common/domain/entity-id';
import { Popularity } from './popularity';
import { SocialPost } from './social-post';
import { InformalOrder } from './informal-order';

export interface PopularityRepository {
  load(): Promise<Popularity>;
  save(popularity: Popularity): Promise<void>;
}
export const POPULARITY_REPOSITORY = new InjectionToken<PopularityRepository>('PopularityRepository');

export interface SocialPostRepository {
  nextId(): Promise<EntityId>;
  save(post: SocialPost): Promise<void>;
  all(): Promise<SocialPost[]>;
}
export const SOCIAL_POST_REPOSITORY = new InjectionToken<SocialPostRepository>('SocialPostRepository');

export interface InformalOrderRepository {
  nextId(): Promise<EntityId>;
  save(order: InformalOrder): Promise<void>;
  all(): Promise<InformalOrder[]>;
}
export const INFORMAL_ORDER_REPOSITORY = new InjectionToken<InformalOrderRepository>('InformalOrderRepository');
