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

/**
 * Reconstruye un evento que estaba guardado, **tal cual se publicó**.
 *
 * No usa `domainEvent()` a propósito: esa factoría sella la hora con `new Date()`, y aquí eso
 * falsearía el `occurredOn` de un evento que ocurrió antes de la última recarga. Un evento repartido
 * hoy y otro repartido tras reiniciar tienen que ser indistinguibles para quien lo recibe.
 *
 * Congela el resultado porque el mismo objeto se entrega a TODOS los suscriptores: si uno pudiera
 * tocarlo, el siguiente recibiría un evento distinto.
 */
export function restoreEvent(
  name: string,
  aggregateId: string,
  occurredOn: Date,
  data: Record<string, unknown>,
): DomainEvent {
  return Object.freeze({
    name,
    aggregateId,
    occurredOn,
    data: Object.freeze({ ...data }),
  });
}
