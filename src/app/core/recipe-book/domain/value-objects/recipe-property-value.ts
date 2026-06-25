import { Quantity } from '../../../_common/quantity';
import { PropertyType } from './recipe-property';

/** El valor concreto que toma una propiedad en una receta, según su tipo. */
export type PropertyValue = string | number | Quantity;

interface RecipePropertyValueData {
    propertyId: string;
    type: PropertyType;
    value: PropertyValue;
}

/**
 * El valor de una propiedad en una receta. Lleva el `type` (denormalizado de la
 * propiedad de la categoría) para poder reconstruirse y formatearse sin cargar la
 * categoría. Indexado por `propertyId`. Identidad por valor.
 */
export class RecipePropertyValue {
    readonly propertyId: string;
    readonly type: PropertyType;
    readonly value: PropertyValue;

    private constructor(data: RecipePropertyValueData) {
        this.propertyId = data.propertyId;
        this.type = data.type;
        this.value = data.value;
    }

    static of(propertyId: string, type: PropertyType, value: PropertyValue): RecipePropertyValue {
        if (!propertyId.trim()) {
            throw new Error('propertyId is required');
        }
        if (type === 'weight' && !(value instanceof Quantity)) {
            throw new Error(`Property ${propertyId} of type weight must hold a Quantity`);
        }
        if (type === 'number' && typeof value !== 'number') {
            throw new Error(`Property ${propertyId} of type number must hold a number`);
        }
        if (type === 'text' && typeof value !== 'string') {
            throw new Error(`Property ${propertyId} of type text must hold a string`);
        }
        return new RecipePropertyValue({ propertyId, type, value });
    }

    /** El valor como Quantity (solo para tipo weight). */
    asWeight(): Quantity {
        if (!(this.value instanceof Quantity)) {
            throw new Error(`Property ${this.propertyId} is not a weight`);
        }
        return this.value;
    }

    equals(other: RecipePropertyValue): boolean {
        if (this.propertyId !== other.propertyId || this.type !== other.type) {
            return false;
        }
        if (this.value instanceof Quantity && other.value instanceof Quantity) {
            return this.value.equals(other.value);
        }
        return this.value === other.value;
    }
}
