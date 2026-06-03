/**
 * Domain event: a business fact that already happened (past-tense name).
 * Immutable. Aggregates record them; use cases publish them AFTER persisting.
 */
export interface DomainEvent {
  /** Past-tense fact name: 'CustomerCreated', 'QuoteApproved'… */
  readonly name: string;
  /** Id of the aggregate that produced it. */
  readonly aggregateId: string;
  readonly occurredOn: Date;
  /** Relevant data for subscribers (primitives only). */
  readonly data: Readonly<Record<string, unknown>>;
}

export function domainEvent(
  name: string,
  aggregateId: string,
  data: Record<string, unknown> = {},
): DomainEvent {
  return Object.freeze({ name, aggregateId, occurredOn: new Date(), data: Object.freeze({ ...data }) });
}
