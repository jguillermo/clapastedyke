import { EntityId } from '../../../_common/entity-id';

interface TopperData {
    id: EntityId;
    name: string;
}

/** Decoration item picked by hand for a cake. Aggregate root. */
export class Topper {
    readonly id: EntityId; // Nivel 1: identidad única del topper
    readonly name: string; // Nivel 1: nombre del topper (único, ver §11.2)

    private constructor(data: TopperData) {
        this.id = data.id;
        this.name = data.name;
    }

    static create(id: EntityId, name: string): Topper {
        if (!name.trim()) {
            throw new Error('Topper name is required');
        }
        return new Topper({ id, name: name.trim() });
    }

    equals(other: Topper): boolean {
        return this.id.equals(other.id);
    }
}
