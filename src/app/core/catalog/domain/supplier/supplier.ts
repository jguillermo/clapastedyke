import { AggregateRoot } from '../../../_common/domain/aggregate';
import { ValidationError } from '../../../_common/domain/errors';
import { domainEvent } from '../../../_common/domain/domain-event';
import { EntityId } from '../../../_common/domain/entity-id';

/**
 * Whatsapp VO: number with country code, digits only, minimum 8.
 * It builds the "order by WhatsApp" link in purchases
 * (normalization from src/Proveedores.js).
 */
export class Whatsapp {
  private constructor(readonly number: string) {}

  static of(text: string): Whatsapp {
    const digits = String(text ?? '').replace(/\D/g, '');
    if (digits.length < 8) {
      throw new ValidationError('WhatsApp needs a country code and at least 8 digits.');
    }
    return new Whatsapp(digits);
  }

  get chatLink(): string {
    return `https://wa.me/${this.number}`;
  }

  equals(other: Whatsapp): boolean {
    return this.number === other.number;
  }
}

export interface SupplierPrimitives {
  id: string;
  name: string;
  whatsapp: string;
  notes: string;
  createdAt: string;
}

/**
 * Supplier (PR-): supplies ingredients and packaging. Its WhatsApp lets you
 * order with one click from "Buy materials". Unique name (guaranteed by the
 * use case).
 */
export class Supplier extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    private _name: string,
    private _whatsapp: Whatsapp,
    private _notes: string,
    readonly createdAt: Date,
  ) {
    super();
  }

  static create(id: EntityId, data: { name: string; whatsapp: string; notes?: string }): Supplier {
    const supplier = new Supplier(
      id,
      Supplier.validName(data.name),
      Whatsapp.of(data.whatsapp),
      (data.notes ?? '').trim(),
      new Date(),
    );
    supplier.recordEvent(domainEvent('SupplierCreated', id.value, { name: supplier._name }));
    return supplier;
  }

  static fromPrimitives(p: SupplierPrimitives): Supplier {
    return new Supplier(EntityId.of(p.id), p.name, Whatsapp.of(p.whatsapp), p.notes, new Date(p.createdAt));
  }

  edit(data: { name: string; whatsapp: string; notes?: string }): void {
    this._name = Supplier.validName(data.name);
    this._whatsapp = Whatsapp.of(data.whatsapp);
    this._notes = (data.notes ?? '').trim();
    this.recordEvent(domainEvent('SupplierEdited', this.id.value, { name: this._name }));
  }

  get name(): string {
    return this._name;
  }
  get whatsapp(): Whatsapp {
    return this._whatsapp;
  }
  get notes(): string {
    return this._notes;
  }

  toPrimitives(): SupplierPrimitives {
    return {
      id: this.id.value,
      name: this._name,
      whatsapp: this._whatsapp.number,
      notes: this._notes,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private static validName(name: string): string {
    const clean = (name ?? '').trim();
    if (!clean) throw new ValidationError('The supplier name is required.');
    return clean;
  }
}
