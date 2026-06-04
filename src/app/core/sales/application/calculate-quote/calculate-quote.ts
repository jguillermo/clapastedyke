import { UseCase } from '../../../_common/application/use-case';
import { Money } from '../../../_common/domain/money';
import { NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { Supply } from '../../../catalog/domain/supply/supply';
import { SupplyRepository } from '../../../catalog/domain/supply/supply-repository';
import { Recipe } from '../../../catalog/domain/recipe/recipe';
import { RecipeRepository } from '../../../catalog/domain/recipe/recipe-repository';
import { SettingsRepository } from '../../../settings/domain/settings-repository';
import {
  CalculatedLine,
  CalculationRequest,
  QuoteCalculation,
  QuoteCalculator,
} from '../../domain/quote/quote-calculator';

export interface CalculateQuoteRequest extends CalculationRequest {
  recipeId: string;
}

/** Calculation line ready to PAINT (the view formats nothing). */
export interface FlatLine extends CalculatedLine {
  unitPriceFormatted: string; // '0.0050'
  subtotalFormatted: string; // 'S/ 1.50'
}

/** Flat calculation DTO for the UI (live preview of the quoter). */
export interface QuoteCalculationDto {
  factor: number;
  resultingServings: number;
  lines: FlatLine[];
  ingredientsCostSoles: number;
  materialsCostSoles: number;
  laborCostSoles: number;
  indirectCostSoles: number;
  depreciationCostSoles: number;
  totalCostSoles: number;
  margin: number;
  priceWithMarginSoles: number;
  applyIgv: boolean;
  igvRate: number;
  igvAmountSoles: number;
  roundingAppliedSoles: number;
  finalPriceSoles: number;
  // Formats ready to paint
  ingredientsCostFormatted: string;
  materialsCostFormatted: string;
  laborCostFormatted: string;
  indirectCostFormatted: string;
  depreciationCostFormatted: string;
  totalCostFormatted: string;
  priceWithMarginFormatted: string;
  igvAmountFormatted: string;
  roundingAppliedFormatted: string;
  finalPriceFormatted: string;
}

export function toQuoteCalculationDto(c: QuoteCalculation): QuoteCalculationDto {
  return {
    factor: c.factor,
    resultingServings: c.resultingServings,
    lines: c.lines.map(l => ({
      ...l,
      unitPriceFormatted: Money.fromSoles(l.unitPriceSoles).format4(),
      subtotalFormatted: Money.fromSoles(l.subtotalSoles).format(),
    })),
    ingredientsCostSoles: c.ingredientsCost.soles,
    materialsCostSoles: c.materialsCost.soles,
    laborCostSoles: c.laborCost.soles,
    indirectCostSoles: c.indirectCost.soles,
    depreciationCostSoles: c.depreciationCost.soles,
    totalCostSoles: c.totalCost.soles,
    margin: c.margin,
    priceWithMarginSoles: c.priceWithMargin.soles,
    applyIgv: c.applyIgv,
    igvRate: c.igvRate,
    igvAmountSoles: c.igvAmount.soles,
    roundingAppliedSoles: c.roundingApplied.soles,
    finalPriceSoles: c.finalPrice.soles,
    ingredientsCostFormatted: c.ingredientsCost.format(),
    materialsCostFormatted: c.materialsCost.format(),
    laborCostFormatted: c.laborCost.format(),
    indirectCostFormatted: c.indirectCost.format(),
    depreciationCostFormatted: c.depreciationCost.format(),
    totalCostFormatted: c.totalCost.format(),
    priceWithMarginFormatted: c.priceWithMargin.format(),
    igvAmountFormatted: c.igvAmount.format(),
    roundingAppliedFormatted: c.roundingApplied.format(),
    finalPriceFormatted: c.finalPrice.format(),
  };
}

/** Shared helper: loads recipe + supplies + settings and calculates. */
export async function calculateWithCatalog(
  recipes: RecipeRepository,
  supplies: SupplyRepository,
  settingsRepo: SettingsRepository,
  request: CalculateQuoteRequest,
): Promise<{ recipe: Recipe; calculation: QuoteCalculation }> {
  const recipe = await recipes.byId(EntityId.of(request.recipeId));
  if (!recipe) throw new NotFoundError('Recipe', request.recipeId);

  const map = new Map<string, Supply>();
  const ids = [
    ...recipe.ingredients.map(i => i.supplyId),
    ...(request.packaging ?? []).map(p => p.supplyId),
  ];
  for (const id of ids) {
    if (map.has(id)) continue;
    const supply = await supplies.byId(EntityId.of(id));
    if (!supply) throw new NotFoundError('Supply', id);
    map.set(id, supply);
  }

  const settings = await settingsRepo.get();
  const calculation = new QuoteCalculator().calculate(recipe, map, settings, request);
  return { recipe, calculation };
}

/** Calculation preview (persists nothing): the form's «recalc». */
export class CalculateQuote implements UseCase<CalculateQuoteRequest, QuoteCalculationDto> {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly supplies: SupplyRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async execute(request: CalculateQuoteRequest): Promise<QuoteCalculationDto> {
    const { calculation } = await calculateWithCatalog(this.recipes, this.supplies, this.settings, request);
    return toQuoteCalculationDto(calculation);
  }
}
