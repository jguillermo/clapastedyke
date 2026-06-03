import { AggregateRoot } from '../../../shared/domain/aggregate';
import { BaseUnit } from '../../../shared/domain/quantity';
import { Money } from '../../../shared/domain/money';
import { ValidationError } from '../../../shared/domain/errors';
import { domainEvent } from '../../../shared/domain/domain-event';
import { EntityId } from '../../../shared/domain/entity-id';

export type SupplyType = 'ingredient' | 'packaging';
export type StockLight = 'red' | 'yellow' | 'green';

/**
 * Presentation VO: how the supply is bought (a 1000 g bag at S/ 5).
 * The price per base unit derives from here — the basis of all costs.
 */
export class Presentation {
  private constructor(
    readonly size: number,
    readonly price: Money,
  ) {}

  static of(size: number, price: Money): Presentation {
    if (!Number.isFinite(size) || size <= 0) {
      throw new ValidationError(`Invalid presentation size: ${size}.`);
    }
    if (!price.isGreaterThan(Money.zero())) {
      throw new ValidationError('The presentation price must be greater than 0.');
    }
    return new Presentation(size, price);
  }

  /** pricePerBaseUnit = presentationPrice / presentationSize */
  get pricePerBaseUnit(): Money {
    return this.price.divideBy(this.size);
  }
}

export interface SupplyPrimitives {
  id: string;
  name: string;
  type: SupplyType;
  baseUnit: BaseUnit;
  presentationSize: number;
  presentationPriceSoles: number;
  stock: number;
  minStock: number;
  recommendedSupplierId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Supply (IN-): ingredient or packaging. Its price and stock live here.
 * Stock may go NEGATIVE (the GAS allows it: approving with shortages warns but
 * does not block); the stock light reflects it in red.
 * Stock mutations are orchestrated from INVENTORY (Stage 4) through this
 * aggregate's intention-revealing methods.
 */
export class Supply extends AggregateRoot {
  private constructor(
    readonly id: EntityId,
    private _name: string,
    readonly type: SupplyType,
    readonly baseUnit: BaseUnit,
    private _presentation: Presentation,
    private _stock: number,
    private _minStock: number,
    private _recommendedSupplierId: EntityId | null,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super();
  }

  static create(
    id: EntityId,
    data: {
      name: string;
      type: SupplyType;
      baseUnit: BaseUnit;
      presentationSize: number;
      presentationPrice: Money;
      initialStock?: number;
      minStock?: number;
      recommendedSupplierId?: EntityId | null;
    },
  ): Supply {
    const initialStock = data.initialStock ?? 0;
    const minStock = data.minStock ?? 0;
    if (initialStock < 0) throw new ValidationError('The initial stock cannot be negative.');
    if (minStock < 0) throw new ValidationError('The minimum stock cannot be negative.');

    const supply = new Supply(
      id,
      Supply.validName(data.name),
      data.type,
      data.baseUnit,
      Presentation.of(data.presentationSize, data.presentationPrice),
      initialStock,
      minStock,
      data.recommendedSupplierId ?? null,
      new Date(),
      new Date(),
    );
    supply.recordEvent(
      domainEvent('SupplyCreated', id.value, {
        name: supply._name,
        type: supply.type,
        initialStock, // INVENTORY will record the 'initial' movement (Stage 4)
      }),
    );
    return supply;
  }

  static fromPrimitives(p: SupplyPrimitives): Supply {
    return new Supply(
      EntityId.of(p.id),
      p.name,
      p.type,
      p.baseUnit,
      Presentation.of(p.presentationSize, Money.fromSoles(p.presentationPriceSoles)),
      p.stock,
      p.minStock,
      p.recommendedSupplierId ? EntityId.of(p.recommendedSupplierId) : null,
      new Date(p.createdAt),
      new Date(p.updatedAt),
    );
  }

  /** Catalog edit: price, presentation, minimum… Stock is NOT touched here. */
  edit(data: {
    name: string;
    presentationSize: number;
    presentationPrice: Money;
    minStock: number;
    recommendedSupplierId?: EntityId | null;
  }): void {
    if (data.minStock < 0) throw new ValidationError('The minimum stock cannot be negative.');
    this._name = Supply.validName(data.name);
    this._presentation = Presentation.of(data.presentationSize, data.presentationPrice);
    this._minStock = data.minStock;
    this._recommendedSupplierId = data.recommendedSupplierId ?? null;
    this.touch();
    this.recordEvent(domainEvent('SupplyEdited', this.id.value, { name: this._name }));
  }

  /* ---------- Stock: intention-revealing methods (used by INVENTORY) ---------- */

  /** Stock inflow (purchase, return, order cancellation). */
  receiveStock(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError(`The amount to receive must be positive: ${amount}.`);
    }
    this._stock += amount;
    this.touch();
    return this._stock;
  }

  /** Stock outflow (order consumption, waste…). May leave it negative. */
  consumeStock(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError(`The amount to consume must be positive: ${amount}.`);
    }
    this._stock -= amount;
    this.touch();
    return this._stock;
  }

  /** A purchase also updates the presentation price to the one paid. */
  updatePresentationPrice(pricePaid: Money): void {
    this._presentation = Presentation.of(this._presentation.size, pricePaid);
    this.touch();
  }

  /* ---------- Derived ---------- */

  get pricePerBaseUnit(): Money {
    return this._presentation.pricePerBaseUnit;
  }

  /** red: stock ≤ 0 · yellow: stock ≤ minimum · green: rest. */
  get stockLight(): StockLight {
    if (this._stock <= 0) return 'red';
    if (this._stock <= this._minStock) return 'yellow';
    return 'green';
  }

  get belowMinimum(): boolean {
    return this._stock <= this._minStock;
  }

  get name(): string {
    return this._name;
  }
  get presentation(): Presentation {
    return this._presentation;
  }
  get stock(): number {
    return this._stock;
  }
  get minStock(): number {
    return this._minStock;
  }
  get recommendedSupplierId(): EntityId | null {
    return this._recommendedSupplierId;
  }

  toPrimitives(): SupplyPrimitives {
    return {
      id: this.id.value,
      name: this._name,
      type: this.type,
      baseUnit: this.baseUnit,
      presentationSize: this._presentation.size,
      presentationPriceSoles: this._presentation.price.soles,
      stock: this._stock,
      minStock: this._minStock,
      recommendedSupplierId: this._recommendedSupplierId?.value ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private static validName(name: string): string {
    const clean = (name ?? '').trim();
    if (!clean) throw new ValidationError('The supply name is required.');
    return clean;
  }
}
