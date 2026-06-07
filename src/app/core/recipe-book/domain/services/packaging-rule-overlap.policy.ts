import { Injectable } from '@angular/core';
import { PackagingRule } from '../entities/packaging-rule';
import { WeightRange } from '../value-objects/weight-range';

/**
 * Set-based invariant (§11.2): packaging weight bands must not overlap. This
 * cannot live on a single PackagingRule because it spans the whole collection,
 * so it is a stateless domain policy consulted by SavePackagingRule.
 */
@Injectable({ providedIn: 'root' })
export class PackagingRuleOverlapPolicy {
    /** Throws if `candidate` overlaps the band of any existing rule. */
    ensureNoOverlap(candidate: WeightRange, existing: readonly PackagingRule[]): void {
        const clash = existing.find((rule) => rule.range.overlaps(candidate));
        if (clash) {
            throw new Error(`Packaging band overlaps an existing rule (${clash.id.value})`);
        }
    }
}
