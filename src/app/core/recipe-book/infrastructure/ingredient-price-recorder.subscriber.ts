import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { EventBus } from '../../_common/event-bus';
import { DomainEvent } from '../../_common/domain-event';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { IngredientPriceHistoryRepository } from '../domain/repositories/ingredient-price-history.repository';
import { PurchasePricePrimitive, RecipeBookEventName } from '../domain/events/recipe-book-events';

/**
 * Audit subscriber (invisible to the user): listens to `IngredientRepriced` and
 * appends the new price to the price history. Decoupled from `SaveIngredient` —
 * it reacts to the event, it is not called by the use case. Same pattern as
 * `progression`'s `CakeComposedProgressSubscriber`.
 */
@Injectable({ providedIn: 'root' })
export class IngredientPriceRecorder {
    private readonly bus = inject(EventBus);
    private readonly history = inject(IngredientPriceHistoryRepository);

    register(): void {
        this.bus.subscribe(RecipeBookEventName.INGREDIENT_REPRICED, (event: DomainEvent) => {
            const newPrice = event.data['newPrice'] as PurchasePricePrimitive;
            return this.history.append({
                ingredientId: new EntityId(event.aggregateId),
                price: PurchasePrice.of(newPrice.amount, Quantity.of(newPrice.per.value, newPrice.per.unit)),
                recordedAt: event.occurredOn,
            });
        });
    }
}
