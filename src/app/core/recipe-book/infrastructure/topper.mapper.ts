import { EntityId } from '../../_common/entity-id';
import { Topper } from '../domain/entities/topper';
import { TopperRecord } from './records';

export const TopperMapper = {
    toRecord(topper: Topper): TopperRecord {
        return { id: topper.id.value, name: topper.name };
    },

    toDomain(record: TopperRecord): Topper {
        return Topper.create(new EntityId(record.id), record.name);
    },
};
