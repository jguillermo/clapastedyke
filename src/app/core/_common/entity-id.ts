/**
 * Identity value object shared across aggregates. Identity *is* the value:
 * a strong type over a string so an id of one aggregate can never be confused
 * with another. Immutable, equality by value.
 */
export class EntityId {
    constructor(readonly value: string) {
        if (!value || !value.trim()) {
            throw new Error('EntityId cannot be empty');
        }
    }

    equals(other: EntityId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
