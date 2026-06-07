import { EntityId } from '../../../_common/entity-id';

export type PackagingType = 'box' | 'base';

interface PackagingItemData {
    id: EntityId;
    name: string;
    type: PackagingType;
}

/** A packaging piece: a box or a base. Aggregate root. */
export class PackagingItem {
    readonly id: EntityId; // Nivel 1: identidad única del empaque
    readonly name: string; // Nivel 1: nombre del empaque (único, ver §11.2)
    readonly type: PackagingType; // Nivel 1: si es caja o base

    private constructor(data: PackagingItemData) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
    }

    static create(id: EntityId, name: string, type: PackagingType): PackagingItem {
        if (!name.trim()) {
            throw new Error('Packaging item name is required');
        }
        return new PackagingItem({ id, name: name.trim(), type });
    }

    equals(other: PackagingItem): boolean {
        return this.id.equals(other.id);
    }
}
