import { AggregateRoot } from '../../../_common/domain/aggregate';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';

export interface PackagingRulePrimitives {
  id: string;
  recipeId: string;
  size: string;
  packagingSupplyId: string;
  quantity: number;
  createdAt: string;
}

/**
 * PackagingRule (RL-): for a recipe in a given size, which packaging to
 * suggest and how much. Uniqueness of the (recipe, size, packaging) triple —
 * guaranteed by the use case. Several packagings per (recipe, size) are
 * allowed.
 */
export class PackagingRule extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly recipeId: EntityId,
    private _size: string,
    private _packagingSupplyId: EntityId,
    private _quantity: number,
    readonly createdAt: Date,
  ) {
    super();
  }

  static create(
    id: EntityId,
    data: { recipeId: EntityId; size: string; packagingSupplyId: EntityId; quantity: number },
  ): PackagingRule {
    const rule = new PackagingRule(
      id,
      data.recipeId,
      PackagingRule.validSize(data.size),
      data.packagingSupplyId,
      PackagingRule.validQuantity(data.quantity),
      new Date(),
    );
    rule.recordEvent(
      domainEvent('PackagingRuleCreated', id.value, {
        recipeId: data.recipeId.value,
        size: rule._size,
      }),
    );
    return rule;
  }

  static fromPrimitives(p: PackagingRulePrimitives): PackagingRule {
    return new PackagingRule(
      EntityId.of(p.id),
      EntityId.of(p.recipeId),
      p.size,
      EntityId.of(p.packagingSupplyId),
      p.quantity,
      new Date(p.createdAt),
    );
  }

  /** Edit: only packaging and suggested quantity (Flow 11.2 of the manual). */
  edit(data: { packagingSupplyId: EntityId; quantity: number }): void {
    this._packagingSupplyId = data.packagingSupplyId;
    this._quantity = PackagingRule.validQuantity(data.quantity);
    this.recordEvent(domainEvent('PackagingRuleEdited', this.id.value, {}));
  }

  get size(): string {
    return this._size;
  }
  get packagingSupplyId(): EntityId {
    return this._packagingSupplyId;
  }
  get quantity(): number {
    return this._quantity;
  }

  matches(recipeId: EntityId, size: string): boolean {
    return this.recipeId.equals(recipeId) && this._size === size.trim().toLowerCase();
  }

  toPrimitives(): PackagingRulePrimitives {
    return {
      id: this.id.value,
      recipeId: this.recipeId.value,
      size: this._size,
      packagingSupplyId: this._packagingSupplyId.value,
      quantity: this._quantity,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private static validSize(size: string): string {
    const clean = (size ?? '').trim().toLowerCase();
    if (!clean) throw new ValidationError('The size is required.');
    return clean;
  }

  private static validQuantity(quantity: number): number {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ValidationError('The suggested quantity must be greater than 0.');
    }
    return quantity;
  }
}
