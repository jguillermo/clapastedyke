import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/event-bus';
import { Topper } from '../../domain/entities/topper';
import { TopperRepository } from '../../domain/repositories/topper.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SaveTopperRequest {
    name: string;
}

/** Saves a decoration topper. Upsert by name (§11.2). */
@Injectable({ providedIn: 'root' })
export class SaveTopper extends UseCase<SaveTopperRequest, { id: string }> {
    private readonly toppers = inject(TopperRepository);
    private readonly bus = inject(EventBus);

    async execute({ name }: SaveTopperRequest): Promise<{ id: string }> {
        const existing = await this.toppers.byName(name);
        const id = existing?.id ?? this.toppers.nextIdentity();
        const topper = Topper.create(id, name);

        await this.toppers.save(topper);
        await this.bus.publish([RecipeBookEvents.topperSaved(id.value, !existing)]);
        return { id: id.value };
    }
}
