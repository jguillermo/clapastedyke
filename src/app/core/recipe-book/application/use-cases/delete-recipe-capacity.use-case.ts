import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';

/** Entrada de {@link DeleteRecipeCapacity}: el id de la capacidad a quitar del catálogo. */
export interface DeleteRecipeCapacityRequest {
    id: string;
}

/**
 * Quita una capacidad del catálogo de receta. La invocan las pantallas de gestión del catálogo de
 * capacidades del recetario. Orquesta solo RecipeCapacityRepository (delete por id); no publica
 * ningún evento.
 */
@Injectable({ providedIn: 'root' })
export class DeleteRecipeCapacity extends UseCase<DeleteRecipeCapacityRequest, void> {
    private readonly capacities = inject(RecipeCapacityRepository);

    async execute({ id }: DeleteRecipeCapacityRequest): Promise<void> {
        await this.capacities.delete(new EntityId(id));
    }
}
