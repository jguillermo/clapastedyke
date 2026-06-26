import { EntityId } from '../../../_common/entity-id';
import { ConversionGroup, ConversionOption } from '../entities/conversion-option';

export abstract class ConversionOptionRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<ConversionOption | null>;
    abstract byGroup(group: ConversionGroup): Promise<ConversionOption[]>;
    abstract all(): Promise<ConversionOption[]>;
    abstract save(option: ConversionOption): Promise<void>;
    abstract delete(id: EntityId): Promise<void>;
}
