import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';

/** Entrada de {@link DeleteRecipeFlavor}: el id del sabor a quitar del catálogo. */
export interface DeleteRecipeFlavorRequest {
    id: string;
}

/**
 * Quita un sabor del catálogo. La invocan las pantallas de gestión del catálogo de sabores del
 * recetario. Orquesta solo RecipeFlavorRepository (delete por id); no publica ningún evento.
 */
@Injectable({ providedIn: 'root' })
export class DeleteRecipeFlavor extends UseCase<DeleteRecipeFlavorRequest, void> {
    private readonly flavors = inject(RecipeFlavorRepository);

    async execute({ id }: DeleteRecipeFlavorRequest): Promise<void> {
        await this.flavors.delete(new EntityId(id));
    }
}
