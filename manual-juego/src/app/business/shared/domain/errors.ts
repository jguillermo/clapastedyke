/**
 * Domain errors for the Bakery Costing bounded context.
 * Use cases let them bubble up; the UI decides how to display them.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** A business rule or invariant was violated. */
export class ValidationError extends DomainError {}

/** The requested aggregate does not exist. */
export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} "${id}" does not exist.`);
  }
}

/** Uniqueness clash (e.g. duplicated name). */
export class DuplicateError extends DomainError {}
