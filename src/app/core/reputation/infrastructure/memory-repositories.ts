import { EntityId, ID_PREFIXES } from '../../_common/domain/entity-id';
import { Popularity, PopularityPrimitives } from '../domain/popularity';
import { SocialPost } from '../domain/social-post';
import { InformalOrder } from '../domain/informal-order';
import {
  InformalOrderRepository,
  PopularityRepository,
  SocialPostRepository,
} from '../domain/repositories';

export class MemoryPopularityRepository implements PopularityRepository {
  private current: PopularityPrimitives | null = null;
  async load(): Promise<Popularity> {
    this.current ??= Popularity.start().toPrimitives();
    return Popularity.fromPrimitives(this.current);
  }
  async save(popularity: Popularity): Promise<void> {
    this.current = popularity.toPrimitives();
  }
}

export class MemorySocialPostRepository implements SocialPostRepository {
  private readonly items: SocialPost[] = [];
  private seq = 0;
  async nextId(): Promise<EntityId> {
    return EntityId.create(ID_PREFIXES.socialPost, ++this.seq);
  }
  async save(post: SocialPost): Promise<void> {
    this.items.push(post);
  }
  async all(): Promise<SocialPost[]> {
    return [...this.items];
  }
}

export class MemoryInformalOrderRepository implements InformalOrderRepository {
  private readonly items: InformalOrder[] = [];
  private seq = 0;
  async nextId(): Promise<EntityId> {
    return EntityId.create(ID_PREFIXES.informalOrder, ++this.seq);
  }
  async save(order: InformalOrder): Promise<void> {
    this.items.push(order);
  }
  async all(): Promise<InformalOrder[]> {
    return [...this.items];
  }
}
