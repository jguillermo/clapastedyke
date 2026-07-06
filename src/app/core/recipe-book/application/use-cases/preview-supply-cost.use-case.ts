import { Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { BaseUnit, Quantity } from '../../../_common/quantity';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { formatPerBaseUnit, formatReference, formatSoles } from '../money';

/** Entrada de {@link PreviewSupplyCost}: cómo se compra el insumo y la cantidad que usa la línea. */
export interface PreviewSupplyCostRequest {
    /** Cómo se compra el insumo (presentación + precio), normalizado a la unidad base. */
    purchasePrice: { amount: number; per: { value: number; unit: BaseUnit } };
    /** La cantidad que usa la línea de receta (misma unidad base que `per`). */
    quantity?: { value: number; unit: BaseUnit };
}

/** Resultado de {@link PreviewSupplyCost}: los tres strings formateados listos para pintar. */
export interface PreviewSupplyCostResult {
    /** Costo proporcional de `quantity`, listo para pintar (vacío si aún no hay cantidad). */
    cost: string;
    /** Costo por unidad base, p. ej. `'S/ 0.0050 / g'`. */
    perBaseUnitLabel: string;
    /** Referencia fantasma de cómo se compra, p. ej. `'1 kg · S/ 5'`. */
    reference: string;
}

/**
 * Cálculo de referencia en vivo (sin persistencia): dado cómo se compra un insumo y la cantidad de
 * la línea, devuelve el costo proporcional, el costo por unidad base y la referencia fantasma — todo
 * **formateado, listo para pintar**, para que la vista nunca calcule ni formatee (memoria
 * `calculos-solo-en-negocio`). La invocan los formularios de insumo/receta al teclear el precio.
 *
 * Cálculo puro: usa el VO PurchasePrice y los helpers de `money`; no toca repositorios ni publica
 * evento alguno.
 */
@Injectable({ providedIn: 'root' })
export class PreviewSupplyCost extends UseCase<PreviewSupplyCostRequest, PreviewSupplyCostResult> {
    async execute({ purchasePrice, quantity }: PreviewSupplyCostRequest): Promise<PreviewSupplyCostResult> {
        const price = PurchasePrice.of(purchasePrice.amount, Quantity.of(purchasePrice.per.value, purchasePrice.per.unit));

        let cost = '';
        if (quantity && quantity.value > 0 && quantity.unit === price.per.unit) {
            cost = formatSoles(price.costFor(Quantity.of(quantity.value, quantity.unit)));
        }

        return { cost, perBaseUnitLabel: formatPerBaseUnit(price), reference: formatReference(price) };
    }
}
