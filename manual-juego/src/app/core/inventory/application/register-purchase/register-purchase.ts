import { EventBus } from '../../../_common/application/event-bus';
import { UseCase } from '../../../_common/application/use-case';
import { Money } from '../../../_common/domain/money';
import { NotFoundError, ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { SupplyRepository } from '../../../catalog/domain/supply/supply-repository';
import { SupplierRepository } from '../../../catalog/domain/supplier/supplier-repository';
import { Purchase } from '../../domain/purchase/purchase';
import { PurchaseRepository } from '../../domain/purchase/purchase-repository';
import { StockService } from '../../domain/stock-service';

export interface PurchaseLineRequest {
  supplyId: string;
  /** Received presentations (5 bags, not 5000 g). */
  receivedPresentations: number;
  paidPresentationPriceSoles: number;
}

export interface RegisterPurchaseRequest {
  supplierId: string;
  date?: string; // ISO; defaults to today
  lines: PurchaseLineRequest[];
}

/**
 * Register purchase (Flow 05.2): for each line the stock GOES UP in base unit
 * (presentations × size), the supply's presentation price is REPLACED by the
 * one paid (recomputing the price per base unit) and the 'purchase' movement
 * is left in the kardex. The CMP- purchase is immutable history.
 */
export class RegisterPurchase implements UseCase<RegisterPurchaseRequest, { id: string }> {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly supplies: SupplyRepository,
    private readonly suppliers: SupplierRepository,
    private readonly stock: StockService,
    private readonly bus: EventBus,
  ) {}

  async execute(request: RegisterPurchaseRequest): Promise<{ id: string }> {
    const supplier = await this.suppliers.byId(EntityId.of(request.supplierId));
    if (!supplier) throw new NotFoundError('Supplier', request.supplierId);
    if (!request.lines?.length) throw new ValidationError('Add at least one line.');

    // Capture each supply's snapshot and build the Purchase aggregate
    const purchaseLines = [];
    for (const line of request.lines) {
      const supply = await this.supplies.byId(EntityId.of(line.supplyId));
      if (!supply) throw new NotFoundError('Supply', line.supplyId);
      purchaseLines.push({
        supplyId: supply.id.value,
        supplyName: supply.name,
        receivedPresentations: line.receivedPresentations,
        paidPresentationPriceSoles: line.paidPresentationPriceSoles,
        presentationSize: supply.presentation.size,
      });
    }

    const purchase = Purchase.register(await this.purchases.nextId(), {
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: request.date ? new Date(request.date) : undefined,
      lines: purchaseLines,
    });

    // Per-line effects: new price + stock inflow with movement
    for (const line of purchase.lines) {
      const supply = (await this.supplies.byId(EntityId.of(line.supplyId)))!;
      supply.updatePresentationPrice(Money.fromSoles(line.paidPresentationPriceSoles));
      await this.stock.move(
        supply,
        line.baseUnitQuantity,
        'purchase',
        purchase.id.value,
        `Purchase from ${supplier.name}`,
      );
    }

    await this.purchases.save(purchase);
    await this.bus.publish(purchase.pullEvents());
    return { id: purchase.id.value };
  }
}
