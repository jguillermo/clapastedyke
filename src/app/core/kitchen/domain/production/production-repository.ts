import { InjectionToken } from '@angular/core';
import { EntityId } from '../../../_common/domain/entity-id';
import { Production } from './production';

export interface ProductionRepository {
  nextId(): Promise<EntityId>;
  save(production: Production): Promise<void>;
  all(): Promise<Production[]>;
}

export const PRODUCTION_REPOSITORY = new InjectionToken<ProductionRepository>('ProductionRepository');
