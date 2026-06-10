/**
 * A domain event: the record of something significant that happened in the
 * domain. Past-tense name, immutable, primitive-only payload so it can cross
 * context boundaries as a Published Language.
 */
export interface DomainEvent {
    readonly name: string;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly data: Readonly<Record<string, unknown>>;
}

export function domainEvent(
    name: string,
    aggregateId: string,
    data: Record<string, unknown> = {},
): DomainEvent {
    return Object.freeze({
        name,
        aggregateId,
        occurredOn: new Date(),
        data: Object.freeze({ ...data }),
    });
}
