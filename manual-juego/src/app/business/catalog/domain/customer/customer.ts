import { AggregateRoot } from '../../../shared/domain/aggregate';
import { ValidationError } from '../../../shared/domain/errors';
import { domainEvent } from '../../../shared/domain/domain-event';
import { EntityId } from '../../../shared/domain/entity-id';

/** Persistable form of the aggregate (flat document for the repository). */
export interface CustomerPrimitives {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string; // ISO
}

/**
 * Customer (CL-): who quotes are made out to. Every quote belongs to a
 * customer. The name is required; its UNIQUENESS (case-insensitive) is
 * guaranteed by the use case querying the repository.
 */
export class Customer extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    private _name: string,
    private _phone: string,
    private _notes: string,
    readonly createdAt: Date,
  ) {
    super();
  }

  static create(id: EntityId, data: { name: string; phone?: string; notes?: string }): Customer {
    const customer = new Customer(
      id,
      Customer.validName(data.name),
      (data.phone ?? '').trim(),
      (data.notes ?? '').trim(),
      new Date(),
    );
    customer.recordEvent(domainEvent('CustomerCreated', id.value, { name: customer._name }));
    return customer;
  }

  static fromPrimitives(p: CustomerPrimitives): Customer {
    return new Customer(EntityId.of(p.id), p.name, p.phone, p.notes, new Date(p.createdAt));
  }

  /** Corrects name, phone or notes (Flow 07.2 of the manual). */
  edit(data: { name: string; phone?: string; notes?: string }): void {
    this._name = Customer.validName(data.name);
    this._phone = (data.phone ?? '').trim();
    this._notes = (data.notes ?? '').trim();
    this.recordEvent(domainEvent('CustomerEdited', this.id.value, { name: this._name }));
  }

  get name(): string {
    return this._name;
  }
  get phone(): string {
    return this._phone;
  }
  get notes(): string {
    return this._notes;
  }

  toPrimitives(): CustomerPrimitives {
    return {
      id: this.id.value,
      name: this._name,
      phone: this._phone,
      notes: this._notes,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private static validName(name: string): string {
    const clean = (name ?? '').trim();
    if (!clean) throw new ValidationError('The customer name is required.');
    return clean;
  }
}
