import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';

interface CakeCompositionData {
    id: EntityId;
    name?: string;
    targetWeight: Quantity;
    spongeRecipeId: EntityId;
    fillingRecipeId: EntityId;
    coveringRecipeId: EntityId;
    topperId?: EntityId;
    suggestedBoxId: EntityId;
    suggestedBaseId: EntityId;
}

/**
 * The cake being assembled: a target weight plus the recipes, topper and
 * resolved packaging it is made of — all held by id. Aggregate root.
 * Recompositions return a new instance (the weight that governs scaling).
 */
export class CakeComposition {
    readonly id: EntityId; // Nivel 1: identidad única de la composición
    readonly name?: string; // Nivel 1: nombre opcional de la torta
    readonly targetWeight: Quantity; // Nivel 1: peso objetivo que gobierna el escalado (g)
    readonly spongeRecipeId: EntityId; // Nivel 2: queque elegido (id)
    readonly fillingRecipeId: EntityId; // Nivel 2: relleno elegido (id)
    readonly coveringRecipeId: EntityId; // Nivel 2: cobertura elegida (id)
    readonly topperId?: EntityId; // Nivel 2: topper elegido (id, opcional)
    readonly suggestedBoxId: EntityId; // Nivel 2: caja resuelta por la regla de empaque (id)
    readonly suggestedBaseId: EntityId; // Nivel 2: base resuelta por la regla de empaque (id)

    private constructor(data: CakeCompositionData) {
        this.id = data.id;
        this.name = data.name;
        this.targetWeight = data.targetWeight;
        this.spongeRecipeId = data.spongeRecipeId;
        this.fillingRecipeId = data.fillingRecipeId;
        this.coveringRecipeId = data.coveringRecipeId;
        this.topperId = data.topperId;
        this.suggestedBoxId = data.suggestedBoxId;
        this.suggestedBaseId = data.suggestedBaseId;
    }

    static compose(data: CakeCompositionData): CakeComposition {
        // Quantity.of already enforces targetWeight > 0 at construction of the VO.
        return new CakeComposition({ ...data, name: data.name?.trim() || undefined });
    }

    /**
     * Re-target the cake to a new weight. The packaging re-resolution is
     * orchestrated by the ComposeCake use case (it needs the rules loaded).
     */
    recompose(targetWeight: Quantity): CakeComposition {
        return new CakeComposition({ ...this.toData(), targetWeight });
    }

    equals(other: CakeComposition): boolean {
        return this.id.equals(other.id);
    }

    private toData(): CakeCompositionData {
        return {
            id: this.id,
            name: this.name,
            targetWeight: this.targetWeight,
            spongeRecipeId: this.spongeRecipeId,
            fillingRecipeId: this.fillingRecipeId,
            coveringRecipeId: this.coveringRecipeId,
            topperId: this.topperId,
            suggestedBoxId: this.suggestedBoxId,
            suggestedBaseId: this.suggestedBaseId,
        };
    }
}
