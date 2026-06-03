import { AggregateRoot } from '../../../_common/domain/aggregate';
import { Money } from '../../../_common/domain/money';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';
import { CalculatedLine, QuoteCalculation, ScalingMode } from './quote-calculator';

/**
 * Persisted statuses. 'Expired' is NOT persisted: it is derived (a Pending
 * quote whose expiry date passed is SHOWN as expired, as in the GAS).
 */
export type QuoteStatus = 'Pending' | 'Approved' | 'Rejected';
export type VisibleQuoteStatus = QuoteStatus | 'Expired';

export interface QuotePrimitives {
  id: string;
  customerId: string;
  customerName: string;
  recipeId: string;
  recipeName: string;
  scalingMode: ScalingMode;
  scalingValue: number;
  appliedFactor: number;
  resultingServings: number;
  lines: CalculatedLine[];
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
  notes: string;
  status: QuoteStatus;
  rejectionReason: string;
  issuedAt: string; // ISO
  expiresAt: string; // ISO
  orderId: string | null;
}

/**
 * Quote (P-): the estimate with ALL its prices frozen when saved — changing
 * catalogs or settings afterwards does not move it. Its detail (ingredient and
 * material lines) is internal to the aggregate.
 *
 * Transitions: Pending → Approved (an order is born) | Rejected (reason).
 * Approved and Rejected are historical: no way back.
 */
export class Quote extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    readonly customerId: EntityId,
    readonly customerName: string,
    readonly recipeId: EntityId,
    readonly recipeName: string,
    readonly scalingMode: ScalingMode,
    readonly scalingValue: number,
    readonly calculation: Readonly<QuoteCalculation>,
    readonly notes: string,
    private _status: QuoteStatus,
    private _rejectionReason: string,
    readonly issuedAt: Date,
    readonly expiresAt: Date,
    private _orderId: EntityId | null,
  ) {
    super();
  }

  /** Freezes a calculation as a Pending quote (Flow 01). */
  static create(
    id: EntityId,
    data: {
      customerId: EntityId;
      customerName: string;
      recipeId: EntityId;
      recipeName: string;
      scalingMode: ScalingMode;
      scalingValue: number;
      calculation: QuoteCalculation;
      notes?: string;
      expiryDays: number;
    },
  ): Quote {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setDate(expiresAt.getDate() + data.expiryDays);

    const quote = new Quote(
      id,
      data.customerId,
      data.customerName,
      data.recipeId,
      data.recipeName,
      data.scalingMode,
      data.scalingValue,
      data.calculation,
      (data.notes ?? '').trim(),
      'Pending',
      '',
      issuedAt,
      expiresAt,
      null,
    );
    quote.recordEvent(
      domainEvent('QuoteCreated', id.value, {
        customerId: data.customerId.value,
        finalPriceSoles: data.calculation.finalPrice.soles,
      }),
    );
    return quote;
  }

  /** Approve: the deal closes and an order is BORN (saved 1:1 with it). */
  approve(orderId: EntityId): void {
    this.requirePending('approve');
    this._status = 'Approved';
    this._orderId = orderId;
    this.recordEvent(
      domainEvent('QuoteApproved', this.id.value, { orderId: orderId.value }),
    );
  }

  /** Reject with a reason: no order is born nor stock touched. */
  reject(reason: string): void {
    this.requirePending('reject');
    this._status = 'Rejected';
    this._rejectionReason = (reason ?? '').trim();
    this.recordEvent(
      domainEvent('QuoteRejected', this.id.value, { reason: this._rejectionReason }),
    );
  }

  get status(): QuoteStatus {
    return this._status;
  }
  get rejectionReason(): string {
    return this._rejectionReason;
  }
  get orderId(): EntityId | null {
    return this._orderId;
  }

  /** A Pending quote past its date is SHOWN Expired (still Pending inside). */
  visibleStatus(today: Date = new Date()): VisibleQuoteStatus {
    if (this._status === 'Pending' && this.expiresAt < today) return 'Expired';
    return this._status;
  }

  toPrimitives(): QuotePrimitives {
    const c = this.calculation;
    return {
      id: this.id.value,
      customerId: this.customerId.value,
      customerName: this.customerName,
      recipeId: this.recipeId.value,
      recipeName: this.recipeName,
      scalingMode: this.scalingMode,
      scalingValue: this.scalingValue,
      appliedFactor: c.factor,
      resultingServings: c.resultingServings,
      lines: c.lines.map(l => ({ ...l })),
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
      notes: this.notes,
      status: this._status,
      rejectionReason: this._rejectionReason,
      issuedAt: this.issuedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      orderId: this._orderId?.value ?? null,
    };
  }

  static fromPrimitives(p: QuotePrimitives): Quote {
    return new Quote(
      EntityId.of(p.id),
      EntityId.of(p.customerId),
      p.customerName,
      EntityId.of(p.recipeId),
      p.recipeName,
      p.scalingMode,
      p.scalingValue,
      {
        factor: p.appliedFactor,
        resultingServings: p.resultingServings,
        lines: p.lines.map(l => ({ ...l })),
        ingredientsCost: Money.fromSoles(p.ingredientsCostSoles),
        materialsCost: Money.fromSoles(p.materialsCostSoles),
        laborCost: Money.fromSoles(p.laborCostSoles),
        indirectCost: Money.fromSoles(p.indirectCostSoles),
        depreciationCost: Money.fromSoles(p.depreciationCostSoles),
        totalCost: Money.fromSoles(p.totalCostSoles),
        margin: p.margin,
        priceWithMargin: Money.fromSoles(p.priceWithMarginSoles),
        applyIgv: p.applyIgv,
        igvRate: p.igvRate,
        igvAmount: Money.fromSoles(p.igvAmountSoles),
        roundingApplied: Money.fromSoles(p.roundingAppliedSoles),
        finalPrice: Money.fromSoles(p.finalPriceSoles),
      },
      p.notes,
      p.status,
      p.rejectionReason,
      new Date(p.issuedAt),
      new Date(p.expiresAt),
      p.orderId ? EntityId.of(p.orderId) : null,
    );
  }

  private requirePending(action: string): void {
    if (this._status !== 'Pending') {
      throw new ValidationError(
        `Can only ${action} a Pending quote (it is ${this._status}).`,
      );
    }
  }
}
