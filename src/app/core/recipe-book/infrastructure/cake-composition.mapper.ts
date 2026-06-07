import { EntityId } from '../../_common/entity-id';
import { CakeComposition } from '../domain/entities/cake-composition';
import { CakeCompositionRecord } from './records';
import { quantityToDomain, quantityToRecord } from './value-record.mappers';

export const CakeCompositionMapper = {
    toRecord(composition: CakeComposition): CakeCompositionRecord {
        return {
            id: composition.id.value,
            name: composition.name,
            targetWeight: quantityToRecord(composition.targetWeight),
            spongeRecipeId: composition.spongeRecipeId.value,
            fillingRecipeId: composition.fillingRecipeId.value,
            coveringRecipeId: composition.coveringRecipeId.value,
            topperId: composition.topperId?.value,
            suggestedBoxId: composition.suggestedBoxId.value,
            suggestedBaseId: composition.suggestedBaseId.value,
        };
    },

    toDomain(record: CakeCompositionRecord): CakeComposition {
        return CakeComposition.compose({
            id: new EntityId(record.id),
            name: record.name,
            targetWeight: quantityToDomain(record.targetWeight),
            spongeRecipeId: new EntityId(record.spongeRecipeId),
            fillingRecipeId: new EntityId(record.fillingRecipeId),
            coveringRecipeId: new EntityId(record.coveringRecipeId),
            topperId: record.topperId ? new EntityId(record.topperId) : undefined,
            suggestedBoxId: new EntityId(record.suggestedBoxId),
            suggestedBaseId: new EntityId(record.suggestedBaseId),
        });
    },
};
