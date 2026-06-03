import { UseCase } from '../../../shared/application/use-case';
import { formatDate } from '../../../shared/application/formats';
import { Money } from '../../../shared/domain/money';
import { PurchaseRepository } from '../../domain/purchase/purchase-repository';

export interface PurchaseListItem {
  id: string;
  supplierName: string;
  dateFormatted: string;
  lineCount: number;
  /** Σ presentations × paid price — computed by the business. */
  totalFormatted: string;
  lines: {
    supplyName: string;
    receivedPresentations: number;
    paidPriceFormatted: string;
    baseUnitQuantity: number;
  }[];
}

/** Purchase history, ready to paint (most recent first). */
export class ListPurchases implements UseCase<void, PurchaseListItem[]> {
  constructor(private readonly purchases: PurchaseRepository) {}

  async execute(): Promise<PurchaseListItem[]> {
    const all = await this.purchases.all();
    return all
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(p => {
        const total = p.lines.reduce(
          (sum, l) =>
            sum.add(
              Money.fromSoles(l.paidPresentationPriceSoles).multiplyBy(l.receivedPresentations),
            ),
          Money.zero(),
        );
        return {
          id: p.id.value,
          supplierName: p.supplierName,
          dateFormatted: formatDate(p.date),
          lineCount: p.lines.length,
          totalFormatted: total.format(),
          lines: p.lines.map(l => ({
            supplyName: l.supplyName,
            receivedPresentations: l.receivedPresentations,
            paidPriceFormatted: Money.fromSoles(l.paidPresentationPriceSoles).format(),
            baseUnitQuantity: l.baseUnitQuantity,
          })),
        };
      });
  }
}
