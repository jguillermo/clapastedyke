import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { WeightRange } from '../value-objects/weight-range';

interface PackagingRuleData {
    id: EntityId;
    range: WeightRange;
    boxId: EntityId;
    baseId: EntityId;
}

/**
 * Maps a cake weight band to the box and base to use. Aggregate root; its
 * range invariants live in the WeightRange value object.
 */
export class PackagingRule {
    readonly id: EntityId; // Nivel 1: identidad única de la regla
    readonly range: WeightRange; // Nivel 1: banda de peso que cubre la regla
    readonly boxId: EntityId; // Nivel 2: caja sugerida (id de un Ingredient con usage 'box')
    readonly baseId: EntityId; // Nivel 2: base sugerida (id de un Ingredient con usage 'base')

    private constructor(data: PackagingRuleData) {
        this.id = data.id;
        this.range = data.range;
        this.boxId = data.boxId;
        this.baseId = data.baseId;
    }

    static create(id: EntityId, range: WeightRange, boxId: EntityId, baseId: EntityId): PackagingRule {
        return new PackagingRule({ id, range, boxId, baseId });
    }

    /** True when this rule covers the given cake weight. */
    matches(weight: Quantity): boolean {
        return this.range.contains(weight);
    }

    equals(other: PackagingRule): boolean {
        return this.id.equals(other.id);
    }
}
