import { InjectionToken } from '@angular/core';
import { EntityId } from '../../../_common/domain/entity-id';
import { BasicOrder } from './basic-order';

export interface BasicOrderRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<BasicOrder | null>;
  save(order: BasicOrder): Promise<void>;
  all(): Promise<BasicOrder[]>;
}

export const BASIC_ORDER_REPOSITORY = new InjectionToken<BasicOrderRepository>('BasicOrderRepository');
