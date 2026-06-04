import { UseCase } from '../../../_common/application/use-case';
import { PackagingRulePrimitives } from '../../domain/packaging-rule/packaging-rule';
import { PackagingRuleRepository } from '../../domain/packaging-rule/packaging-rule-repository';

export class ListPackagingRules implements UseCase<void, PackagingRulePrimitives[]> {
  constructor(private readonly rules: PackagingRuleRepository) {}

  async execute(): Promise<PackagingRulePrimitives[]> {
    const all = await this.rules.all();
    return all.map(r => r.toPrimitives());
  }
}
