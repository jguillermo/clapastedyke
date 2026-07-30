import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { CapacityGroup, RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/**
 * Las características que puede llevar una receta: su sabor y sus dos dimensiones de tamaño
 * (porciones y molde, que coexisten). Se deriva de `CapacityGroup` para no desincronizarse.
 */
export type RecipePropertyKind = 'flavor' | CapacityGroup;

/** Entrada de {@link SaveRecipeProperty}: con id edita el existente; sin id crea (con dedup por label). */
export interface SaveRecipePropertyRequest {
    kind: RecipePropertyKind;
    id?: string;
    label: string;
    /** Factor de escalado; solo para `portions`/`mold`. Por defecto 1. Se ignora en `flavor`. */
    factor?: number;
}

/**
 * Guarda una CARACTERÍSTICA de receta del catálogo: el sabor o una de las dos capacidades
 * (porciones/molde). Punto de entrada único del campo «Características» del formulario de receta.
 * Despacha por `kind` al catálogo que corresponde; en ambos casos, con id edita el existente y sin id
 * crea con dedup por label (por (grupo, label) en las capacidades), devolviendo el id existente si ya
 * estaba. Las invariantes viven en `RecipeFlavor`/`RecipeCapacity`; el use case orquesta. Publica
 * `FlavorSaved` o `RecipeCapacitySaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipeProperty extends UseCase<SaveRecipePropertyRequest, { id: string }> {
    private readonly flavors = inject(RecipeFlavorRepository);
    private readonly capacities = inject(RecipeCapacityRepository);
    private readonly bus = inject(EventBus);

    async execute({ kind, id, label, factor }: SaveRecipePropertyRequest): Promise<{ id: string }> {
        return kind === 'flavor'
            ? this.saveFlavor(id, label)
            : this.saveCapacity(kind, id, label, factor ?? 1);
    }

    /** Crea o renombra un sabor. Sin id, dedup por label (reutiliza el del mismo nombre). */
    private async saveFlavor(id: string | undefined, label: string): Promise<{ id: string }> {
        if (id) {
            const existing = await this.flavors.byId(new EntityId(id));
            if (!existing) {
                throw new Error(`Flavor ${id} not found`);
            }
            await this.flavors.save(existing.relabeledTo(label));
            await this.bus.publish([RecipeBookEvents.flavorSaved(id, false)]);
            return { id };
        }
        // Dedup por label: crear un sabor que ya existe (mismo nombre) reutiliza el existente.
        const target = label.trim().toLowerCase();
        const existing = (await this.flavors.all()).find((f) => f.label.toLowerCase() === target);
        if (existing) {
            return { id: existing.id.value };
        }
        const newId = this.flavors.nextIdentity();
        await this.flavors.save(RecipeFlavor.create(newId, label));
        await this.bus.publish([RecipeBookEvents.flavorSaved(newId.value, true)]);
        return { id: newId.value };
    }

    /** Crea o edita una capacidad del grupo dado. Sin id, dedup por (grupo, label). */
    private async saveCapacity(
        group: CapacityGroup,
        id: string | undefined,
        label: string,
        factor: number,
    ): Promise<{ id: string }> {
        // Dedup por (grupo, label) al crear: una capacidad nueva con un label ya existente lo reutiliza.
        if (!id) {
            const target = label.trim().toLowerCase();
            const existing = (await this.capacities.byGroup(group)).find(
                (c) => c.label.toLowerCase() === target,
            );
            if (existing) {
                return { id: existing.id.value };
            }
        }
        const capacityId = id ? new EntityId(id) : this.capacities.nextIdentity();
        await this.capacities.save(RecipeCapacity.create(capacityId, group, label, factor));
        await this.bus.publish([RecipeBookEvents.recipeCapacitySaved(capacityId.value, !id)]);
        return { id: capacityId.value };
    }
}
