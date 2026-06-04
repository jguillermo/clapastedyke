import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { SUPPLY_REPOSITORY } from '../../../catalog/domain/supply/supply-repository';
import { SUPPLIER_REPOSITORY } from '../../../catalog/domain/supplier/supplier-repository';
import { ORDER_REPOSITORY } from '../../../sales/domain/order/order-repository';

/** A supply to buy, with its recommended supplier and the WhatsApp link. */
export interface ShoppingListItem {
  supplyId: string;
  supplyName: string;
  suggestedQuantity: number;
  presentationPriceSoles: number;
  supplierId: string | null;
  /** null when there is no recommended supplier (the view translates 'no supplier'). */
  supplierName: string | null;
  whatsappLink: string | null;
}

/** Automatic mode (Flow 05.1): an order's shortages, by supplier. */
@Injectable({ providedIn: 'root' })
export class OrderShortages implements UseCase<{ orderId: string }, ShoppingListItem[]> {
  private readonly orders = inject(ORDER_REPOSITORY);
  private readonly supplies = inject(SUPPLY_REPOSITORY);
  private readonly suppliers = inject(SUPPLIER_REPOSITORY);

  async execute({ orderId }: { orderId: string }): Promise<ShoppingListItem[]> {
    const order = await this.orders.byId(EntityId.of(orderId));
    if (!order) throw new NotFoundError('Order', orderId);

    const items: ShoppingListItem[] = [];
    for (const req of order.requirements) {
      if (req.shortage <= 0) continue;
      items.push(await this.buildItem(req.supplyId, req.supplyName, req.shortage));
    }
    return items;
  }

  private async buildItem(
    supplyId: string,
    name: string,
    quantity: number,
  ): Promise<ShoppingListItem> {
    const supply = await this.supplies.byId(EntityId.of(supplyId));
    const supplier = supply?.recommendedSupplierId
      ? await this.suppliers.byId(supply.recommendedSupplierId)
      : null;
    return {
      supplyId,
      supplyName: name,
      suggestedQuantity: quantity,
      presentationPriceSoles: supply?.presentation.price.soles ?? 0,
      supplierId: supplier?.id.value ?? null,
      supplierName: supplier?.name ?? null,
      whatsappLink: supplier?.whatsapp.chatLink ?? null,
    };
  }
}

/** Manual mode (Flow 05.1): everything below the minimum, pre-checked. */
@Injectable({ providedIn: 'root' })
export class SuppliesBelowMinimum implements UseCase<void, ShoppingListItem[]> {
  private readonly supplies = inject(SUPPLY_REPOSITORY);
  private readonly suppliers = inject(SUPPLIER_REPOSITORY);

  async execute(): Promise<ShoppingListItem[]> {
    const all = await this.supplies.all();
    const items: ShoppingListItem[] = [];
    for (const supply of all) {
      if (!supply.belowMinimum) continue;
      const supplier = supply.recommendedSupplierId
        ? await this.suppliers.byId(supply.recommendedSupplierId)
        : null;
      items.push({
        supplyId: supply.id.value,
        supplyName: supply.name,
        suggestedQuantity: Math.max(0, supply.minStock - supply.stock),
        presentationPriceSoles: supply.presentation.price.soles,
        supplierId: supplier?.id.value ?? null,
        supplierName: supplier?.name ?? null,
        whatsappLink: supplier?.whatsapp.chatLink ?? null,
      });
    }
    return items;
  }
}
