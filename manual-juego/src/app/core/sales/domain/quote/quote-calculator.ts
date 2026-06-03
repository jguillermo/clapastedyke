import { Money } from '../../../_common/domain/money';
import { ValidationError } from '../../../_common/domain/errors';
import { Percentage } from '../../../_common/domain/percentage';
import { Supply } from '../../../catalog/domain/supply/supply';
import { Recipe } from '../../../catalog/domain/recipe/recipe';
import { BusinessSettings } from '../../../settings/domain/business-settings';

/** Recipe scaling mode (src/Presupuestos.js · calcularPresupuesto). */
export type ScalingMode = 'quantity' | 'people' | 'size' | 'factor';

export interface ChosenPackaging {
  supplyId: string;
  /** Packaging does NOT scale with the factor: the quantity is the form's. */
  quantity: number;
}

export interface CalculationRequest {
  scalingMode: ScalingMode;
  /** Quantity/people/factor depending on the mode (ignored in 'size' mode). */
  scalingValue?: number;
  /** Only in 'size' mode. */
  size?: string;
  packaging: ChosenPackaging[];
  /** Profit margin OVER THE SALE (0–99). */
  margin: number;
  applyIgv: boolean;
}

export interface CalculatedLine {
  kind: 'ingredient' | 'material';
  supplyId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceSoles: number;
  subtotalSoles: number;
}

/** Calculation result: what the quote FREEZES when saved. */
export interface QuoteCalculation {
  factor: number;
  resultingServings: number;
  lines: CalculatedLine[];
  ingredientsCost: Money;
  materialsCost: Money;
  laborCost: Money;
  indirectCost: Money;
  depreciationCost: Money;
  totalCost: Money;
  margin: number;
  priceWithMargin: Money;
  applyIgv: boolean;
  igvRate: number;
  igvAmount: Money;
  roundingApplied: Money;
  finalPrice: Money;
}

/**
 * Domain service: the EXACT system formula (src/Presupuestos.js):
 *
 *   factor       = per mode (direct · size→settings · value/baseServings)
 *   ingredients  = Σ baseQuantity×factor × pricePerBaseUnit
 *   materials    = Σ quantity (NOT scaled) × pricePerBaseUnit
 *   labor        = recipeHours × factor × hourlyRate
 *   fixed        = indirect + depreciation (do not scale)
 *   totalCost    = sum of the five
 *   priceMargin  = totalCost / (1 − margin/100)   ← margin over the SALE
 *   IGV          = priceMargin × rate/100 (if applicable)
 *   finalPrice   = MULTIPLE_OF_5 rounding up (or none)
 */
export class QuoteCalculator {
  calculate(
    recipe: Recipe,
    suppliesById: ReadonlyMap<string, Supply>,
    settings: BusinessSettings,
    request: CalculationRequest,
  ): QuoteCalculation {
    const { factor, resultingServings } = this.resolveFactor(recipe, settings, request);

    // Ingredients: scaled by the factor
    const lines: CalculatedLine[] = [];
    let ingredientsCost = Money.zero();
    for (const ingredient of recipe.ingredients) {
      const supply = this.requiredSupply(suppliesById, ingredient.supplyId);
      const quantity = ingredient.baseQuantity * factor;
      const subtotal = supply.pricePerBaseUnit.multiplyBy(quantity);
      ingredientsCost = ingredientsCost.add(subtotal);
      lines.push(this.line('ingredient', supply, quantity, subtotal));
    }

    // Materials/packaging: the form quantity, not scaled
    let materialsCost = Money.zero();
    for (const item of request.packaging ?? []) {
      if (!(item.quantity > 0)) continue;
      const supply = this.requiredSupply(suppliesById, item.supplyId);
      const subtotal = supply.pricePerBaseUnit.multiplyBy(item.quantity);
      materialsCost = materialsCost.add(subtotal);
      lines.push(this.line('material', supply, item.quantity, subtotal));
    }

    const general = settings.general;
    const laborCost = Money.fromSoles(general.laborRatePerHour)
      .multiplyBy(recipe.laborHours)
      .multiplyBy(factor);
    const indirectCost = Money.fromSoles(general.indirectCostPerOrder);
    const depreciationCost = Money.fromSoles(general.depreciationPerOrder);

    const totalCost = ingredientsCost
      .add(materialsCost)
      .add(laborCost)
      .add(indirectCost)
      .add(depreciationCost);

    // Margin over the sale: price = cost / (1 − margin)
    const margin = Percentage.of(request.margin);
    const priceWithMargin = totalCost.divideBy(1 - margin.fraction);

    const igvRate = Percentage.of(general.igvRate);
    const igvAmount = request.applyIgv
      ? priceWithMargin.multiplyBy(igvRate.fraction)
      : Money.zero();

    const priceBeforeRounding = priceWithMargin.add(igvAmount);
    const finalPrice =
      general.rounding === 'MULTIPLE_OF_5'
        ? Money.fromSoles(Math.ceil(priceBeforeRounding.soles / 5) * 5)
        : priceBeforeRounding;

    return {
      factor,
      resultingServings,
      lines,
      ingredientsCost,
      materialsCost,
      laborCost,
      indirectCost,
      depreciationCost,
      totalCost,
      margin: margin.value,
      priceWithMargin,
      applyIgv: request.applyIgv,
      igvRate: igvRate.value,
      igvAmount,
      roundingApplied: finalPrice.subtract(priceBeforeRounding),
      finalPrice,
    };
  }

  private resolveFactor(
    recipe: Recipe,
    settings: BusinessSettings,
    request: CalculationRequest,
  ): { factor: number; resultingServings: number } {
    const baseServings = recipe.baseServings;

    switch (request.scalingMode) {
      case 'factor': {
        const factor = this.positiveValue(request.scalingValue, 'the factor');
        return { factor, resultingServings: baseServings * factor };
      }
      case 'size': {
        if (!request.size?.trim()) throw new ValidationError('Choose a size.');
        const factor = settings.factorOfSize(request.size);
        return { factor, resultingServings: baseServings * factor };
      }
      case 'quantity':
      case 'people': {
        const value = this.positiveValue(request.scalingValue, 'the quantity');
        return { factor: value / baseServings, resultingServings: value };
      }
      default:
        throw new ValidationError(`Unknown scaling mode: ${request.scalingMode}.`);
    }
  }

  private positiveValue(value: number | undefined, label: string): number {
    if (!Number.isFinite(value) || (value as number) <= 0) {
      throw new ValidationError(`Provide ${label} (greater than 0).`);
    }
    return value as number;
  }

  private requiredSupply(supplies: ReadonlyMap<string, Supply>, id: string): Supply {
    const supply = supplies.get(id);
    if (!supply) throw new ValidationError(`Missing supply ${id} to calculate.`);
    return supply;
  }

  private line(
    kind: 'ingredient' | 'material',
    supply: Supply,
    quantity: number,
    subtotal: Money,
  ): CalculatedLine {
    return {
      kind,
      supplyId: supply.id.value,
      name: supply.name,
      quantity,
      unit: supply.baseUnit,
      unitPriceSoles: supply.pricePerBaseUnit.soles,
      subtotalSoles: subtotal.soles,
    };
  }
}
