import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { BaseUnit } from '../../../shared/domain/quantity';
import { Money } from '../../../shared/domain/money';
import { DuplicateError, NotFoundError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { Supply, SupplyType } from '../../domain/supply/supply';
import { SupplyRepository } from '../../domain/supply/supply-repository';

export interface SaveSupplyRequest {
  id?: string;
  name: string;
  type: SupplyType;
  baseUnit: BaseUnit;
  presentationSize: number;
  presentationPriceSoles: number;
  /** Only on create; live stock is moved from INVENTORY. */
  initialStock?: number;
  minStock?: number;
  recommendedSupplierId?: string | null;
}

/**
 * Create or edit a supply (src/Insumos.js). On edit the stock is NOT touched
 * (it rises with purchases and is adjusted with inventory); type and base unit
 * do not change either (they define the supply's nature).
 */
export class SaveSupply implements UseCase<SaveSupplyRequest, { id: string }> {
  constructor(
    private readonly supplies: SupplyRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(request: SaveSupplyRequest): Promise<{ id: string }> {
    const existing = await this.supplies.byName(request.name);
    const supplierId = request.recommendedSupplierId
      ? EntityId.of(request.recommendedSupplierId)
      : null;

    if (request.id) {
      const id = EntityId.of(request.id);
      const supply = await this.supplies.byId(id);
      if (!supply) throw new NotFoundError('Supply', request.id);
      if (existing && !existing.id.equals(id)) {
        throw new DuplicateError('A supply with that name already exists.');
      }
      supply.edit({
        name: request.name,
        presentationSize: request.presentationSize,
        presentationPrice: Money.fromSoles(request.presentationPriceSoles),
        minStock: request.minStock ?? supply.minStock,
        recommendedSupplierId: supplierId,
      });
      await this.supplies.save(supply);
      await this.bus.publish(supply.pullEvents());
      return { id: supply.id.value };
    }

    if (existing) throw new DuplicateError('A supply with that name already exists.');
    const supply = Supply.create(await this.supplies.nextId(), {
      name: request.name,
      type: request.type,
      baseUnit: request.baseUnit,
      presentationSize: request.presentationSize,
      presentationPrice: Money.fromSoles(request.presentationPriceSoles),
      initialStock: request.initialStock,
      minStock: request.minStock,
      recommendedSupplierId: supplierId,
    });
    await this.supplies.save(supply);
    await this.bus.publish(supply.pullEvents());
    return { id: supply.id.value };
  }
}
