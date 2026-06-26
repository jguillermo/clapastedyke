import { EntityId } from '../../../_common/entity-id';
import { Flavor } from '../entities/flavor';

export abstract class FlavorRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<Flavor | null>;
    abstract all(): Promise<Flavor[]>;
    abstract save(flavor: Flavor): Promise<void>;
    abstract delete(id: EntityId): Promise<void>;
}
