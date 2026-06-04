import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { formatDate } from '../../../_common/application/formats';
import { STOCK_MOVEMENT_REPOSITORY } from '../../domain/stock-movement/stock-movement-repository';

export interface StockMovementListItem {
  id: string;
  dateFormatted: string;
  supplyId: string;
  supplyName: string;
  type: string;
  quantity: number; // signed: + inflow · − outflow
  reference: string;
  reason: string;
  resultingStock: number;
}

export interface ListStockMovementsRequest {
  supplyId?: string;
}

/** The kardex, ready to paint (most recent first). */
@Injectable({ providedIn: 'root' })
export class ListStockMovements
  implements UseCase<ListStockMovementsRequest, StockMovementListItem[]>
{
  private readonly movements = inject(STOCK_MOVEMENT_REPOSITORY);

  async execute(request: ListStockMovementsRequest = {}): Promise<StockMovementListItem[]> {
    let list = await this.movements.all();
    if (request.supplyId) list = list.filter(m => m.supplyId.value === request.supplyId);
    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(m => ({
        id: m.id.value,
        dateFormatted: formatDate(m.date),
        supplyId: m.supplyId.value,
        supplyName: m.supplyName,
        type: m.type,
        quantity: m.quantity,
        reference: m.reference,
        reason: m.reason,
        resultingStock: m.resultingStock,
      }));
  }
}
