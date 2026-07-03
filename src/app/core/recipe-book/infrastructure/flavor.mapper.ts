import { EntityId } from '../../_common/entity-id';
import { Flavor } from '../domain/entities/flavor';
import { FlavorRecord } from './records';

export const FlavorMapper = {
    toRecord(flavor: Flavor): FlavorRecord {
        return { id: flavor.id.value, label: flavor.label };
    },

    toDomain(record: FlavorRecord): Flavor {
        return Flavor.create(new EntityId(record.id), record.label);
    },
};
