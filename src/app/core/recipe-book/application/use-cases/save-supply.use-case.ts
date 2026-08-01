import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Supply } from '../../domain/entities/supply';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyUsage } from '../../domain/value-objects/supply-usage';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Entrada de {@link SaveSupply}: los datos del insumo a guardar (incluye su precio de compra). */
export interface SaveSupplyRequest {
  name: string;
  baseUnit: BaseUnit;
  usage: SupplyUsage;
  /** Cómo se compra: presentación (en unidad base) + precio + moneda. */
  purchasePrice: { amount: number; per: { value: number; unit: BaseUnit }; currency?: string };
}

/**
 * Guarda un insumo (cualquier uso). Upsert por nombre (case-insensitive): un nombre nuevo acuña una
 * identidad vía `Supply.create` (registra el precio inicial); uno existente se re-tarifa vía
 * `repricedTo` solo cuando el precio cambió. La invocan las pantallas de alta de insumo del
 * recetario.
 *
 * Orquesta SupplyRepository y arma el precio con el VO PurchasePrice (uso vía SupplyUsage). Publica
 * `SupplySaved` vía EventBus, y además `SupplyCreated` si el nombre era nuevo o `SupplyUpdated` si
 * re-tarifó uno existente (si el insumo llega idéntico no publica ningún específico: no cambió nada).
 */
@Injectable({ providedIn: 'root' })
export class SaveSupply extends UseCase<SaveSupplyRequest, { id: string }> {
  private readonly supplies = inject(SupplyRepository);
  private readonly bus = inject(EventBus);

  async execute({
    name,
    baseUnit,
    usage,
    purchasePrice,
  }: SaveSupplyRequest): Promise<{ id: string }> {
    const price = PurchasePrice.of(
      purchasePrice.amount,
      Quantity.of(purchasePrice.per.value, purchasePrice.per.unit),
      purchasePrice.currency ?? 'PEN',
    );
    const existing = await this.supplies.byName(name);

    let supply: Supply;
    let repriced = false;
    if (!existing) {
      supply = Supply.create(this.supplies.nextIdentity(), name, baseUnit, usage, price);
    } else if (!existing.purchasePrice.equals(price)) {
      supply = existing.repricedTo(price);
      repriced = true;
    } else {
      supply = existing;
    }

    await this.supplies.save(supply);
    await this.bus.publish([
      RecipeBookEvents.supplySaved(supply.id.value, !existing),
      // El específico solo cuando de verdad pasó algo: reencontrar un insumo idéntico no es una
      // edición, y anunciarla haría reaccionar a quien no debe.
      ...(!existing
        ? [RecipeBookEvents.supplyCreated(supply.id.value, supply.name)]
        : repriced
          ? [RecipeBookEvents.supplyUpdated(supply.id.value, { renamed: false, repriced: true })]
          : []),
    ]);
    return { id: supply.id.value };
  }
}
