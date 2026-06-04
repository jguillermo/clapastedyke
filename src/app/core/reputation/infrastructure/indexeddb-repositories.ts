import { IdGenerator, ID_PREFIXES } from '../../_common/domain/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { Popularity, PopularityPrimitives, POPULARITY_ID } from '../domain/popularity';
import { SocialPost, SocialPostPrimitives } from '../domain/social-post';
import { InformalOrder, InformalOrderPrimitives } from '../domain/informal-order';
import {
  InformalOrderRepository,
  PopularityRepository,
  SocialPostRepository,
} from '../domain/repositories';

export class IndexedDbPopularityRepository implements PopularityRepository {
  private readonly store = new IndexedDbStore<PopularityPrimitives>('popularity');

  async load(): Promise<Popularity> {
    const doc = await this.store.get(POPULARITY_ID);
    if (doc) return Popularity.fromPrimitives(doc);
    const fresh = Popularity.start();
    await this.store.put(fresh.toPrimitives());
    return fresh;
  }
  async save(popularity: Popularity): Promise<void> {
    await this.store.put(popularity.toPrimitives());
  }
}

export class IndexedDbSocialPostRepository implements SocialPostRepository {
  private readonly store = new IndexedDbStore<SocialPostPrimitives>('social_posts');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.socialPost);
  }
  async save(post: SocialPost) {
    await this.store.put(post.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(SocialPost.fromPrimitives);
  }
}

export class IndexedDbInformalOrderRepository implements InformalOrderRepository {
  private readonly store = new IndexedDbStore<InformalOrderPrimitives>('informal_orders');
  constructor(private readonly ids: IdGenerator) {}

  nextId() {
    return this.ids.next(ID_PREFIXES.informalOrder);
  }
  async save(order: InformalOrder) {
    await this.store.put(order.toPrimitives());
  }
  async all() {
    return (await this.store.all()).map(InformalOrder.fromPrimitives);
  }
}
