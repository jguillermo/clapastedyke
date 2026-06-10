import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/event-bus';
import { PackagingItem, PackagingType } from '../../domain/entities/packaging-item';
import { PackagingItemRepository } from '../../domain/repositories/packaging-item.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SavePackagingItemRequest {
    name: string;
    type: PackagingType;
}

/** Saves a packaging piece (box or base). Upsert by name (§11.2). */
@Injectable({ providedIn: 'root' })
export class SavePackagingItem extends UseCase<SavePackagingItemRequest, { id: string }> {
    private readonly items = inject(PackagingItemRepository);
    private readonly bus = inject(EventBus);

    async execute({ name, type }: SavePackagingItemRequest): Promise<{ id: string }> {
        const existing = await this.items.byName(name);
        const id = existing?.id ?? this.items.nextIdentity();
        const item = PackagingItem.create(id, name, type);

        await this.items.save(item);
        await this.bus.publish([RecipeBookEvents.packagingItemSaved(id.value, !existing)]);
        return { id: id.value };
    }
}
