import { EntityId } from '../../../_common/entity-id';
import { CakeComposition } from '../entities/cake-composition';

export abstract class CakeCompositionRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<CakeComposition | null>;
    abstract save(composition: CakeComposition): Promise<void>;
    abstract all(): Promise<CakeComposition[]>;
}
