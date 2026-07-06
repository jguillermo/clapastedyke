import { EntityId } from '../../_common/entity-id';
import { Flavor } from '../domain/entities/flavor';
import { FlavorRecord } from './records';

/**
 * ACL de persistencia: traduce `Flavor` ⇄ `FlavorRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbFlavorRepository`. Mapea el `EntityId` y el `label`.
 */
export const FlavorMapper = {
    toRecord(flavor: Flavor): FlavorRecord {
        return { id: flavor.id.value, label: flavor.label };
    },

    toDomain(record: FlavorRecord): Flavor {
        return Flavor.create(new EntityId(record.id), record.label);
    },
};
