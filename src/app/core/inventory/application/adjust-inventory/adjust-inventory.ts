import { EventBus } from '../../../_common/application/event-bus';
import { UseCase } from '../../../_common/application/use-case';
import { domainEvent } from '../../../_common/domain/domain-event';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { StockLight } from '../../../catalog/domain/supply/supply';
import { SupplyRepository } from '../../../catalog/domain/supply/supply-repository';
import { SettingsRepository } from '../../../settings/domain/settings-repository';
import { StockService } from '../../domain/stock-service';

export interface AdjustInventoryRequest {
  supplyId: string;
  type: string; // waste, damage, expiry, count, return (settings)
  quantity: number;
  reason?: string;
}

export interface AdjustmentResponse {
  resultingStock: number;
  stockLight: StockLight;
}

/**
 * Adjust inventory (Flow 06): the sign is decided by the TYPE according to
 * settings (waste always subtracts, return adds, count keeps your sign).
 * The movement is left in the kardex.
 */
export class AdjustInventory implements UseCase<AdjustInventoryRequest, AdjustmentResponse> {
  constructor(
    private readonly supplies: SupplyRepository,
    private readonly settings: SettingsRepository,
    private readonly stock: StockService,
    private readonly bus: EventBus,
  ) {}

  async execute(request: AdjustInventoryRequest): Promise<AdjustmentResponse> {
    const supply = await this.supplies.byId(EntityId.of(request.supplyId));
    if (!supply) throw new NotFoundError('Supply', request.supplyId);

    const settings = await this.settings.get();
    const signedQuantity = settings.signedAdjustmentQuantity(request.type, request.quantity);

    const movement = await this.stock.move(
      supply,
      signedQuantity,
      request.type.trim().toLowerCase(),
      supply.id.value,
      request.reason ?? '',
    );

    await this.bus.publish([
      domainEvent('InventoryAdjusted', supply.id.value, {
        type: request.type,
        quantity: signedQuantity,
        resultingStock: movement.resultingStock,
      }),
    ]);

    return { resultingStock: movement.resultingStock, stockLight: supply.stockLight };
  }
}

/** Adjustment preview (previsualizarAjuste in GAS): persists nothing. */
export class PreviewAdjustment
  implements UseCase<AdjustInventoryRequest, AdjustmentResponse & { currentStock: number }>
{
  constructor(
    private readonly supplies: SupplyRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async execute(request: AdjustInventoryRequest) {
    const supply = await this.supplies.byId(EntityId.of(request.supplyId));
    if (!supply) throw new NotFoundError('Supply', request.supplyId);
    const settings = await this.settings.get();
    const signedQuantity = settings.signedAdjustmentQuantity(request.type, request.quantity);

    const currentStock = supply.stock;
    const resultingStock = currentStock + signedQuantity;
    const stockLight: StockLight =
      resultingStock <= 0 ? 'red' : resultingStock <= supply.minStock ? 'yellow' : 'green';
    return { currentStock, resultingStock, stockLight };
  }
}
