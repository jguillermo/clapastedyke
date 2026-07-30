import { Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { formatSoles } from '../money';

/** Una línea de receta dentro de {@link PreviewRecipeCostRequest}: cómo se compra el insumo y la cantidad usada. */
export interface PreviewRecipeCostLine {
  purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } } | null;
  quantity?: { value: number; unit: BaseUnit };
}

/** Entrada de {@link PreviewRecipeCost}: las líneas de la receta a costear. */
export interface PreviewRecipeCostRequest {
  lines: PreviewRecipeCostLine[];
}

/** Resultado de {@link PreviewRecipeCost}: el costo por línea y el total, formateados listos para pintar. */
export interface PreviewRecipeCostResult {
  /** Costo proporcional por línea, formateado (`'S/ 1.50'`), alineado al orden de la entrada. */
  items: { cost: string }[];
  /** Total de materiales de las líneas con precio, formateado (`'S/ 4.00'`). */
  total: string;
}

/**
 * Cálculo de referencia en vivo: el costo proporcional de cada línea de receta y el **total de
 * materiales**, todo formateado listo para pintar (memoria `calculos-solo-en-negocio`). Una línea
 * sin precio/cantidad (o con unidad que no coincide) aporta un costo vacío y queda excluida del
 * total. La invoca el formulario de receta al teclear cantidades. Cálculo puro: usa el VO
 * PurchasePrice y el helper `formatSoles` de `money`; no toca repositorios ni publica evento.
 */
@Injectable({ providedIn: 'root' })
export class PreviewRecipeCost extends UseCase<PreviewRecipeCostRequest, PreviewRecipeCostResult> {
  async execute({ lines }: PreviewRecipeCostRequest): Promise<PreviewRecipeCostResult> {
    let total = 0;
    const items = lines.map((line) => {
      const cost = this.lineCost(line);
      if (cost !== null) {
        total += cost;
      }
      return { cost: cost === null ? '' : formatSoles(cost) };
    });
    return { items, total: formatSoles(total) };
  }

  private lineCost(line: PreviewRecipeCostLine): number | null {
    const { purchasePrice, quantity } = line;
    if (
      !purchasePrice ||
      !quantity ||
      quantity.value <= 0 ||
      quantity.unit !== purchasePrice.per.unit
    ) {
      return null;
    }
    const price = PurchasePrice.of(
      purchasePrice.amount,
      Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
    );
    return price.costFor(Quantity.of(quantity.value, quantity.unit));
  }
}
