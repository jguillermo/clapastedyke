import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { CapacityGroup, RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Entrada de {@link SaveRecipeCapacity}: grupo, label y factor de la capacidad (con id para editar, sin id para crear). */
export interface SaveRecipeCapacityRequest {
    id?: string; // presente → editar; ausente → crear
    group: CapacityGroup;
    label: string;
    factor: number;
}

/**
 * Crea o edita una capacidad del catálogo de receta (porciones/molde). La invocan las pantallas de
 * gestión del catálogo de capacidades del recetario. Al crear, dedup por (grupo, label). El factor y
 * sus invariantes viven en `RecipeCapacity`; el use case orquesta. Orquesta RecipeCapacityRepository
 * y publica `RecipeCapacitySaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipeCapacity extends UseCase<SaveRecipeCapacityRequest, { id: string }> {
    private readonly capacities = inject(RecipeCapacityRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, group, label, factor }: SaveRecipeCapacityRequest): Promise<{ id: string }> {
        // Dedup por (grupo, label) al crear: una capacidad nueva con un label ya existente lo reutiliza.
        if (!id) {
            const target = label.trim().toLowerCase();
            const existing = (await this.capacities.byGroup(group)).find((c) => c.label.toLowerCase() === target);
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
