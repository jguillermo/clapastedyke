import { BaseUnit } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';
import { PurchasePrice } from '../value-objects/purchase-price';
import { SupplyUsage } from '../value-objects/supply-usage';

interface SupplyData {
  id: EntityId;
  name: string;
  baseUnit: BaseUnit;
  purchasePrice: PurchasePrice;
  usage: SupplyUsage;
}

/**
 * Todo lo que se compra para preparar el pastel es un Supply (insumo de receta,
 * topper, caja o base — se distinguen solo por `usage`). Guarda su precio de
 * compra. Entidad con identidad por id; los cambios de estado (renombrar,
 * re-tarifar) devuelven una nueva instancia.
 */
export class Supply {
  readonly id: EntityId; // Nivel 1: identidad única del insumo
  readonly name: string; // Nivel 1: nombre del insumo (único, ver §11.2)
  readonly baseUnit: BaseUnit; // Nivel 1: unidad en la que se mide (g | u)
  readonly purchasePrice: PurchasePrice; // Nivel 1: costo de compra (presentación + precio)
  readonly usage: SupplyUsage; // Nivel 1: para qué se usa (recipe/topper/box/base)

  private constructor(data: SupplyData) {
    this.id = data.id;
    this.name = data.name;
    this.baseUnit = data.baseUnit;
    this.purchasePrice = data.purchasePrice;
    this.usage = data.usage;
  }

  /** Insumo nuevo con su precio de compra. */
  static create(
    id: EntityId,
    name: string,
    baseUnit: BaseUnit,
    usage: SupplyUsage,
    purchasePrice: PurchasePrice,
  ): Supply {
    if (!name.trim()) {
      throw new Error('Supply name is required');
    }
    if (baseUnit !== purchasePrice.per.unit) {
      throw new Error(
        `Supply base unit (${baseUnit}) must match its purchase presentation unit (${purchasePrice.per.unit})`,
      );
    }
    return new Supply({ id, name: name.trim(), baseUnit, usage, purchasePrice });
  }

  /** Rehidrata desde almacenamiento. */
  static restore(data: SupplyData): Supply {
    return new Supply(data);
  }

  /** Renombra el insumo; devuelve una nueva instancia conservando la misma identidad. */
  renamedTo(newName: string): Supply {
    if (!newName.trim()) {
      throw new Error('Supply name is required');
    }
    return new Supply({ ...this.data(), name: newName.trim() });
  }

  /** Cambia el precio de compra; devuelve una nueva instancia. */
  repricedTo(newPrice: PurchasePrice): Supply {
    if (newPrice.per.unit !== this.baseUnit) {
      throw new Error(
        `Cannot reprice a ${this.baseUnit} supply with a ${newPrice.per.unit} purchase presentation`,
      );
    }
    return new Supply({ ...this.data(), purchasePrice: newPrice });
  }

  equals(other: Supply): boolean {
    return this.id.equals(other.id);
  }

  private data(): SupplyData {
    return {
      id: this.id,
      name: this.name,
      baseUnit: this.baseUnit,
      purchasePrice: this.purchasePrice,
      usage: this.usage,
    };
  }
}
