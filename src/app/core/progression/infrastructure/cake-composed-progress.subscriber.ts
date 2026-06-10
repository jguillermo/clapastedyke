import { inject, Injectable } from '@angular/core';
import { EventBus } from '../../_common/event-bus';
import { RecipeBookEventName } from '../../recipe-book/domain/events/recipe-book-events';
import { RecordProgress } from '../application/use-cases/record-progress.use-case';
import { GoalType } from '../domain/goal-type';

/**
 * Inbound adapter (downstream Anticorruption Layer). `progression` is the
 * downstream of `recipe-book` (Customer/Supplier with Published Language): it
 * subscribes only to the published `CakeComposed` event and translates it into
 * its own language — recording progress on CAKES_COMPOSED. The only coupling
 * is on the published event name, never on recipe-book's domain model.
 */
@Injectable({ providedIn: 'root' })
export class CakeComposedProgressSubscriber {
    private readonly bus = inject(EventBus);
    private readonly recordProgress = inject(RecordProgress);

    register(): void {
        this.bus.subscribe(RecipeBookEventName.CAKE_COMPOSED, async () => {
            await this.recordProgress.execute({ type: GoalType.CAKES_COMPOSED });
        });
    }
}
