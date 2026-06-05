import { ValidationError } from './errors';

/**
 * Human-readable identity prefixes, inherited from the original GAS system
 * (they appear in the manual and tutorial: P-0001, CL-0001…). Format is
 * PREFIX-NNNN with at least 4 digits.
 */
export const ID_PREFIXES = {
  customer: 'CL',
  supplier: 'PR',
  supply: 'IN',
  recipe: 'RC',
  packagingRule: 'RL',
  quote: 'P',
  quoteLine: 'PDL',
  order: 'PD',
  orderRequirement: 'REQ',
  purchase: 'CMP',
  purchaseLine: 'CDL',
  stockMovement: 'MV',
  sale: 'VT',
  production: 'PRD',
  socialPost: 'PUB',
  informalOrder: 'INF',
  basicOrder: 'PDB',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

const ID_FORMAT = /^[A-Z]{1,4}-\d{4,}$/;

/** Identity value object of an aggregate. Equality by value. */
export class EntityId {
  private constructor(readonly value: string) {}

  static of(value: string): EntityId {
    const clean = String(value ?? '').trim();
    if (!ID_FORMAT.test(clean)) {
      throw new ValidationError(`Id "${value}" does not match PREFIX-NNNN.`);
    }
    return new EntityId(clean);
  }

  /** Builds identity N of a prefix: create('CL', 7) → CL-0007. */
  static create(prefix: IdPrefix, number: number): EntityId {
    if (!Number.isInteger(number) || number <= 0) {
      throw new ValidationError(`Invalid id number: ${number}.`);
    }
    return new EntityId(`${prefix}-${String(number).padStart(4, '0')}`);
  }

  equals(other: EntityId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/** Port: produces the next identity of a prefix (persistent sequence). */
export interface IdGenerator {
  next(prefix: IdPrefix): Promise<EntityId>;
}
