import { InjectionToken } from '@angular/core';
import { EntityId } from '../../../_common/domain/entity-id';
import { PackagingRule } from './packaging-rule';

export interface PackagingRuleRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<PackagingRule | null>;
  save(rule: PackagingRule): Promise<void>;
  all(): Promise<PackagingRule[]>;
  /** Suggestions when quoting: the rules of a recipe in a given size. */
  byRecipeAndSize(recipeId: EntityId, size: string): Promise<PackagingRule[]>;
}

/**
 * Port towards CONFIGURATION: the business's valid sizes (small, medium…).
 * In Stage 2 the configuration subdomain implements it; meanwhile tests and
 * the app inject it with a fixed list.
 */
export interface AvailableSizes {
  names(): Promise<string[]>;
}

export const PACKAGING_RULE_REPOSITORY = new InjectionToken<PackagingRuleRepository>('PackagingRuleRepository');
export const AVAILABLE_SIZES_TOKEN = new InjectionToken<AvailableSizes>('AvailableSizes');
