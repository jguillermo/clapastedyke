import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/event-bus';
import { EntityId } from '../../../_common/entity-id';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Entrada de {@link UpdateSupply}: el id del insumo a editar más el nombre y el precio nuevos. */
export interface UpdateSupplyRequest {
  /** Identidad del insumo a editar (renombrar por id nunca lo duplica). */
  id: string;
  name: string;
  /** Cómo se compra: presentación (en unidad base) + precio + moneda. */
  purchasePrice: { amount: number; per: { value: number; unit: BaseUnit }; currency?: string };
}

/**
 * Edita un insumo **existente** por id: lo renombra y/o re-tarifa en el sitio. La invoca la pantalla
 * de edición de insumo. A diferencia de
 * {@link import('./save-supply.use-case').SaveSupply} (upsert por nombre, usado para crear), este
 * carga por identidad para que renombrar conserve el mismo `id` (las recetas lo referencian por id)
 * en vez de acuñar un insumo nuevo. Rechaza un renombrado que choque con el nombre de otro insumo
 * (case-insensitive). El dominio decide: `renamedTo`/`repricedTo` construyen la instancia nueva; este
 * use case solo orquesta cargar → mutar → persistir sobre SupplyRepository (arma el precio con el VO
 * PurchasePrice) y publica `SupplySaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class UpdateSupply extends UseCase<UpdateSupplyRequest, { id: string }> {
  private readonly supplies = inject(SupplyRepository);
  private readonly bus = inject(EventBus);

  async execute({ id, name, purchasePrice }: UpdateSupplyRequest): Promise<{ id: string }> {
    const existing = await this.supplies.byId(new EntityId(id));
    if (!existing) {
      throw new Error('Supply not found');
    }

    let supply = existing;
    if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const clash = await this.supplies.byName(name);
      if (clash && !clash.id.equals(existing.id)) {
        throw new Error('Ya existe un insumo con ese nombre');
      }
      supply = supply.renamedTo(name);
    }

    const price = PurchasePrice.of(
      purchasePrice.amount,
      Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
      purchasePrice.currency ?? existing.purchasePrice.currency,
    );
    if (!existing.purchasePrice.equals(price)) {
      supply = supply.repricedTo(price);
    }

    await this.supplies.save(supply);
    await this.bus.publish([RecipeBookEvents.supplySaved(supply.id.value, false)]);
    return { id: supply.id.value };
  }
}
