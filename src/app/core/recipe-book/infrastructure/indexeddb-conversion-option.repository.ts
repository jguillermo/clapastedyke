import { Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { IndexedDbStore } from '../../_common/infrastructure/indexeddb/store';
import { ConversionGroup, ConversionOption } from '../domain/entities/conversion-option';
import { ConversionOptionRepository } from '../domain/repositories/conversion-option.repository';
import { ConversionOptionMapper } from './conversion-option.mapper';
import { ConversionOptionRecord } from './records';

@Injectable()
export class IndexedDbConversionOptionRepository extends ConversionOptionRepository {
    private readonly store = new IndexedDbStore<ConversionOptionRecord>('conversion_options');

    nextIdentity(): EntityId {
        return new EntityId(crypto.randomUUID());
    }

    async byId(id: EntityId): Promise<ConversionOption | null> {
        const record = await this.store.get(id.value);
        return record ? ConversionOptionMapper.toDomain(record) : null;
    }

    async byGroup(group: ConversionGroup): Promise<ConversionOption[]> {
        return (await this.store.all())
            .filter((r) => r.group === group)
            .map(ConversionOptionMapper.toDomain);
    }

    async all(): Promise<ConversionOption[]> {
        return (await this.store.all()).map(ConversionOptionMapper.toDomain);
    }

    async save(option: ConversionOption): Promise<void> {
        await this.store.put(ConversionOptionMapper.toRecord(option));
    }

    async delete(id: EntityId): Promise<void> {
        await this.store.delete(id.value);
    }
}
