import { AggregateRoot } from '../../../_common/aggregate';
import { BaseUnit } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';
import { PurchasePrice } from '../value-objects/purchase-price';
import { SupplyUsage } from '../value-objects/supply-usage';
import { RecipeBookEvents, SupplySavedData } from '../events/recipe-book-events';

interface SupplyData {
  id: EntityId;
  name: string;
  baseUnit: BaseUnit;
  purchasePrice: PurchasePrice;
  usage: SupplyUsage;
  /** Ver `Supply.updatedAt`. Opcional: quien lo arma de cero todavía no lo ha guardado. */
  updatedAt?: string | null;
}

/**
 * Todo lo que se compra para preparar el pastel es un Supply (insumo de receta,
 * topper, caja o base — se distinguen solo por `usage`). Guarda su precio de
 * compra. Entidad con identidad por id.
 *
 * Graba su propio evento: `create` deja un `SupplySaved` en la cola, que el caso de uso saca con
 * `pullEvents()` tras persistir. Renombrar y re-tarifar no son verbos aparte: se arma el insumo con
 * los datos nuevos sobre la **misma identidad** y se persiste. La invariante que protege la familia
 * de unidad (`baseUnit` debe coincidir con la presentación de compra) vive en `create`, así que
 * pasarle el `baseUnit` del insumo que ya estaba sigue impidiendo que un insumo en `g` pase a `u`.
 */
export class Supply extends AggregateRoot {
  readonly id: EntityId; // Nivel 1: identidad única del insumo
  readonly name: string; // Nivel 1: nombre del insumo (único, ver §11.2)
  readonly baseUnit: BaseUnit; // Nivel 1: unidad en la que se mide (g | u)
  readonly purchasePrice: PurchasePrice; // Nivel 1: costo de compra (presentación + precio)
  readonly usage: SupplyUsage; // Nivel 1: para qué se usa (recipe/topper/box/base)
  /**
   * Nivel 3: metadato de auditoría — cuándo se guardó por última vez (ISO), o `null` si aún no se ha
   * guardado nunca.
   *
   * No es dato de negocio y nada del recetario decide en función de él: existe para que la
   * sincronización pueda saber **cuál de dos cambios es más reciente** cuando el mismo insumo cambió
   * aquí y en el destino. Lo estampa el repositorio al guardar, así que `create` no lo recibe.
   */
  readonly updatedAt: string | null;

  private constructor(data: SupplyData) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.baseUnit = data.baseUnit;
    this.purchasePrice = data.purchasePrice;
    this.usage = data.usage;
    this.updatedAt = data.updatedAt ?? null;
  }

  /** Arma el insumo con su precio de compra y graba que se guardó. */
  static create(
    id: EntityId,
    name: string,
    baseUnit: BaseUnit,
    usage: SupplyUsage,
    purchasePrice: PurchasePrice,
  ): Supply {
    const data = { id, name: name.trim(), baseUnit, usage, purchasePrice };
    Supply.assertValid(data);
    const supply = new Supply(data);
    supply.recordEvent(RecipeBookEvents.supplySaved(id.value, supply.snapshot()));
    return supply;
  }

  /** Rehidrata desde almacenamiento: NO graba eventos (leer no es guardar). */
  static restore(data: SupplyData): Supply {
    return new Supply(data);
  }

  /**
   * Las reglas que hacen válido un insumo, **en un solo sitio**.
   *
   * Está aparte de `create` porque hay un segundo camino legítimo hacia el modelo: rehidratar filas que
   * vienen de fuera (la sincronización trae filas que ha escrito una persona a mano). Ese camino usa
   * `restore`, que no valida a propósito —leer no puede fallar por una regla de negocio—, así que
   * necesita comprobarlas él. Antes las repetía, con lo que eso tiene de divergir en silencio: una regla
   * nueva aquí dejaba entrar por la otra puerta un insumo que la app no sabe pintar.
   *
   * **Los mensajes se le enseñan a alguien**, así que están escritos para leerse: los pinta el formulario
   * cuando el guardado falla, y salen en el diagnóstico de las filas que no se pueden leer.
   */
  static assertValid(data: SupplyData): void {
    if (!data.name.trim()) {
      throw new Error('El insumo necesita un nombre.');
    }
    // Un insumo que se mide en gramos no se puede comprar por unidades.
    if (data.baseUnit !== data.purchasePrice.per.unit) {
      throw new Error(
        `El insumo se mide en «${data.baseUnit}» pero su compra está en «${data.purchasePrice.per.unit}»: no cuadran.`,
      );
    }
  }

  equals(other: Supply): boolean {
    return this.id.equals(other.id);
  }

  /**
   * El estado completo del insumo aplanado a primitivos: lo que viaja en `SupplySaved`. El id no va
   * dentro — es el `aggregateId` del evento.
   */
  private snapshot(): SupplySavedData {
    return {
      name: this.name,
      baseUnit: this.baseUnit,
      usage: this.usage,
      purchasePrice: {
        amount: this.purchasePrice.amount,
        currency: this.purchasePrice.currency,
        per: { value: this.purchasePrice.per.value, unit: this.purchasePrice.per.unit },
      },
    };
  }
}
