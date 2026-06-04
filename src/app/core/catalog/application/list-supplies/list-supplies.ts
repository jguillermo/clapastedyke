import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { StockLight, SupplyPrimitives, SupplyType } from '../../domain/supply/supply';
import { SUPPLY_REPOSITORY } from '../../domain/supply/supply-repository';

export interface ListSuppliesRequest {
  type?: SupplyType;
}

/**
 * DTO ready to PAINT: the view neither computes nor formats anything — the
 * derived fields (price per base unit, stock light) and their formats are
 * delivered by the business layer.
 */
export interface SupplyListItem extends SupplyPrimitives {
  pricePerBaseUnitSoles: number;
  stockLight: StockLight;
  /** 'S/ 5.00' — ready for the table. */
  presentationPriceFormatted: string;
  /** '0.0050' — 4 decimals, like the GAS num4. */
  pricePerBaseUnitFormatted: string;
}

@Injectable({ providedIn: 'root' })
export class ListSupplies implements UseCase<ListSuppliesRequest, SupplyListItem[]> {
  private readonly supplies = inject(SUPPLY_REPOSITORY);

  async execute(request: ListSuppliesRequest = {}): Promise<SupplyListItem[]> {
    const list = request.type
      ? await this.supplies.byType(request.type)
      : await this.supplies.all();
    return list
      .map(s => ({
        ...s.toPrimitives(),
        pricePerBaseUnitSoles: s.pricePerBaseUnit.soles,
        stockLight: s.stockLight,
        presentationPriceFormatted: s.presentation.price.format(),
        pricePerBaseUnitFormatted: s.pricePerBaseUnit.format4(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
