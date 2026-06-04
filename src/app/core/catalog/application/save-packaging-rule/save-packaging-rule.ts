import { EventBus } from '../../../_common/application/event-bus';
import { UseCase } from '../../../_common/application/use-case';
import { DuplicateError, NotFoundError, ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { SupplyRepository } from '../../domain/supply/supply-repository';
import { RecipeRepository } from '../../domain/recipe/recipe-repository';
import { PackagingRule } from '../../domain/packaging-rule/packaging-rule';
import {
  AvailableSizes,
  PackagingRuleRepository,
} from '../../domain/packaging-rule/packaging-rule-repository';

export interface SavePackagingRuleRequest {
  id?: string;
  recipeId: string;
  size: string;
  packagingSupplyId: string;
  quantity: number;
}

/**
 * Create or edit a packaging rule (src/ReglasEmpaque.js): the recipe and the
 * packaging must exist (and be of type 'packaging'), the size must be defined
 * in configuration, and the (recipe, size, packaging) triple is unique.
 */
export class SavePackagingRule
  implements UseCase<SavePackagingRuleRequest, { id: string }>
{
  constructor(
    private readonly rules: PackagingRuleRepository,
    private readonly recipes: RecipeRepository,
    private readonly supplies: SupplyRepository,
    private readonly sizes: AvailableSizes,
    private readonly bus: EventBus,
  ) {}

  async execute(request: SavePackagingRuleRequest): Promise<{ id: string }> {
    const recipeId = EntityId.of(request.recipeId);
    const packagingId = EntityId.of(request.packagingSupplyId);
    const size = (request.size ?? '').trim().toLowerCase();

    if (!(await this.recipes.byId(recipeId))) {
      throw new NotFoundError('Recipe', request.recipeId);
    }
    const packaging = await this.supplies.byId(packagingId);
    if (!packaging) throw new NotFoundError('Supply', request.packagingSupplyId);
    if (packaging.type !== 'packaging') {
      throw new ValidationError(`"${packaging.name}" is not a packaging.`);
    }
    const names = await this.sizes.names();
    if (!names.map(n => n.toLowerCase()).includes(size)) {
      throw new ValidationError(`The size "${request.size}" is not defined in configuration.`);
    }

    if (request.id) {
      const id = EntityId.of(request.id);
      const rule = await this.rules.byId(id);
      if (!rule) throw new NotFoundError('Packaging rule', request.id);
      rule.edit({ packagingSupplyId: packagingId, quantity: request.quantity });
      await this.rules.save(rule);
      await this.bus.publish(rule.pullEvents());
      return { id: rule.id.value };
    }

    // Triple uniqueness (only on create, like the GAS)
    const siblings = await this.rules.byRecipeAndSize(recipeId, size);
    if (siblings.some(r => r.packagingSupplyId.equals(packagingId))) {
      throw new DuplicateError('That combination of recipe, size and packaging already exists.');
    }

    const rule = PackagingRule.create(await this.rules.nextId(), {
      recipeId,
      size,
      packagingSupplyId: packagingId,
      quantity: request.quantity,
    });
    await this.rules.save(rule);
    await this.bus.publish(rule.pullEvents());
    return { id: rule.id.value };
  }
}
