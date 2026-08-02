import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Logger } from '../../../_common/logger/logger';
import { Supply } from '../../domain/entities/supply';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyUsage } from '../../domain/value-objects/supply-usage';
import { SupplyRepository } from '../../domain/repositories/supply.repository';

/** Entrada de {@link SaveSupply}: sobre qué identidad persistir y los datos del insumo. */
export interface SaveSupplyRequest {
  /**
   * Identidad sobre la que persistir. Con id, renombrar la conserva (las recetas referencian el
   * insumo por id). Sin id, se resuelve por nombre.
   */
  id?: string;
  name: string;
  /** Para qué se usa. Omitido: se conserva el del insumo resuelto; si es nuevo, `recipe`. */
  usage?: SupplyUsage;
  /**
   * Cómo se compra: presentación (en unidad base) + precio + moneda. La unidad de la presentación
   * **es** la unidad base del insumo, así que no se manda por separado.
   */
  purchasePrice: { amount: number; per: { value: number; unit: BaseUnit }; currency?: string };
}

/**
 * **Persiste** un insumo (de cualquier uso). La invocan la lista de insumos y el formulario de
 * receta. No hay crear ni editar: se resuelve la identidad, se arma el insumo con los datos que
 * llegan y se persiste — si no estaba se inserta, si estaba se actualiza, sin ninguna diferencia.
 *
 * Lo que decide aquí, porque necesita el repositorio y no cabe en el dominio:
 * - **Qué identidad** se usa: la del `id` recibido; si no, la del insumo que ya tiene ese nombre; y
 *   si no, una nueva. Resolver por nombre es lo que evita duplicar insumos cuando el formulario de
 *   receta los da de alta al vuelo.
 * - Que el nombre **no lo tenga otro** insumo (unicidad case-insensitive).
 * - Los defectos de lo que no llega (`usage`, moneda) y la **unidad base**, que se toma del insumo
 *   resuelto: así `Supply.create` sigue rechazando que un insumo en `g` pase a medirse en `u`.
 *
 * El evento `SupplySaved` **lo graba el propio agregado**; aquí solo se saca la cola con
 * `pullEvents()` tras persistir y se publica por el `EventBus`.
 */
@Injectable({ providedIn: 'root' })
export class SaveSupply extends UseCase<SaveSupplyRequest, { id: string }> {
  private readonly supplies = inject(SupplyRepository);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('recipe-book/save-supply');

  async execute({ id, name, usage, purchasePrice }: SaveSupplyRequest): Promise<{ id: string }> {
    this.log.debug('ejecutando', { sobreId: id ?? null, usage: usage ?? null });

    const sameName = await this.supplies.byName(name);
    const existing = id ? await this.supplies.byId(new EntityId(id)) : sameName;
    // El nombre solo puede estar tomado por el insumo sobre el que estamos persistiendo.
    if (sameName && !(existing && sameName.id.equals(existing.id))) {
      // No se registra el fallo aquí: se lanza y lo registra quien decide qué ve el usuario.
      // Esta línea solo cuenta POR QUÉ se rechazó, para poder seguir el flujo.
      this.log.debug('nombre ya tomado por otro insumo, se rechaza', {
        tomadoPor: sameName.id.value,
      });
      throw new Error('Ya existe un insumo con ese nombre');
    }
    this.log.debug(
      existing ? 'insumo existente, se reutiliza su identidad' : 'insumo nuevo',
      existing ? { id: existing.id.value, baseUnit: existing.baseUnit } : undefined,
    );

    const price = PurchasePrice.of(
      purchasePrice.amount,
      Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
      purchasePrice.currency ?? existing?.purchasePrice.currency ?? 'PEN',
    );
    const supply = Supply.create(
      existing?.id ?? (id ? new EntityId(id) : this.supplies.nextIdentity()),
      name,
      // La unidad base la fija el insumo que ya estaba; cambiar de familia (g ↔ u) lo rechaza
      // `Supply.create`, que es donde vive la invariante.
      existing?.baseUnit ?? purchasePrice.per.unit,
      usage ?? existing?.usage ?? 'recipe',
      price,
    );

    await this.supplies.save(supply);
    await this.bus.publish(supply.pullEvents());
    this.log.debug('hecho', { id: supply.id.value, baseUnit: supply.baseUnit });
    return { id: supply.id.value };
  }
}
