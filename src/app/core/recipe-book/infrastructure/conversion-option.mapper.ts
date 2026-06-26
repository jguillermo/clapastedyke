import { EntityId } from '../../_common/entity-id';
import { ConversionOption } from '../domain/entities/conversion-option';
import { ConversionOptionRecord } from './records';

export const ConversionOptionMapper = {
    toRecord(option: ConversionOption): ConversionOptionRecord {
        return {
            id: option.id.value,
            group: option.group,
            label: option.label,
            factor: option.factor,
        };
    },

    toDomain(record: ConversionOptionRecord): ConversionOption {
        return ConversionOption.create(new EntityId(record.id), record.group, record.label, record.factor);
    },
};
