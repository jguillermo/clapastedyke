import { EntityId } from '../../../_common/entity-id';
import { Topper } from '../entities/topper';

export abstract class TopperRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<Topper | null>;
    abstract byName(name: string): Promise<Topper | null>;
    abstract save(topper: Topper): Promise<void>;
    abstract all(): Promise<Topper[]>;
}
