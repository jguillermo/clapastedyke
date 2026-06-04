import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { PackagingRulePrimitives } from '../../domain/packaging-rule/packaging-rule';
import { PACKAGING_RULE_REPOSITORY } from '../../domain/packaging-rule/packaging-rule-repository';

@Injectable({ providedIn: 'root' })
export class ListPackagingRules implements UseCase<void, PackagingRulePrimitives[]> {
  private readonly rules = inject(PACKAGING_RULE_REPOSITORY);

  async execute(): Promise<PackagingRulePrimitives[]> {
    const all = await this.rules.all();
    return all.map(r => r.toPrimitives());
  }
}
