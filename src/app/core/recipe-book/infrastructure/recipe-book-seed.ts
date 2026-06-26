import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../_common/entity-id';
import { buildSystemCategories } from '../domain/entities/recipe-category';
import { ConversionGroup, ConversionOption } from '../domain/entities/conversion-option';
import { Flavor } from '../domain/entities/flavor';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';
import { ConversionOptionRepository } from '../domain/repositories/conversion-option.repository';
import { FlavorRepository } from '../domain/repositories/flavor.repository';

/** Catálogo de sabores sembrado (parecido a `main`). */
const SEED_FLAVORS: ReadonlyArray<{ id: string; label: string }> = [
    { id: 'flv-vainilla', label: 'Vainilla' },
    { id: 'flv-chocolate', label: 'Chocolate' },
];

/** Catálogo de opciones de conversión sembrado, por grupo, con su factor. */
const SEED_CONVERSION_OPTIONS: ReadonlyArray<{
    id: string;
    group: ConversionGroup;
    label: string;
    factor: number;
}> = [
    // Porciones: el número es el label y el factor a la vez (queque para N personas).
    { id: 'co-portions-10', group: 'portions', label: '10', factor: 10 },
    { id: 'co-portions-20', group: 'portions', label: '20', factor: 20 },
    { id: 'co-portions-40', group: 'portions', label: '40', factor: 40 },
    { id: 'co-mold-small', group: 'mold', label: 'Molde pequeño', factor: 0.5 },
    { id: 'co-mold-medium', group: 'mold', label: 'Molde mediano', factor: 1 },
    { id: 'co-mold-large', group: 'mold', label: 'Molde grande', factor: 2 },
];

/**
 * Siembra las categorías de sistema (Queques, Rellenos, Coberturas), el catálogo
 * de sabores y el de opciones de conversión. Idempotente **por concern**: cada
 * catálogo se siembra solo si su store está vacío, así una BD que ya tenía
 * categorías recibe igualmente los catálogos nuevos. Sin migración: no transforma
 * datos anteriores.
 */
@Injectable({ providedIn: 'root' })
export class RecipeBookSeed {
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly flavors = inject(FlavorRepository);
    private readonly options = inject(ConversionOptionRepository);

    async run(): Promise<void> {
        await Promise.all([this.seedCategories(), this.seedFlavors(), this.seedConversionOptions()]);
    }

    private async seedCategories(): Promise<void> {
        if ((await this.categories.all()).length > 0) {
            return;
        }
        for (const category of buildSystemCategories()) {
            await this.categories.save(category);
        }
    }

    private async seedFlavors(): Promise<void> {
        if ((await this.flavors.all()).length > 0) {
            return;
        }
        for (const { id, label } of SEED_FLAVORS) {
            await this.flavors.save(Flavor.create(new EntityId(id), label));
        }
    }

    private async seedConversionOptions(): Promise<void> {
        if ((await this.options.all()).length > 0) {
            return;
        }
        for (const { id, group, label, factor } of SEED_CONVERSION_OPTIONS) {
            await this.options.save(ConversionOption.create(new EntityId(id), group, label, factor));
        }
    }
}
