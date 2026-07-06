import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { FlavorRepository } from '../../domain/repositories/flavor.repository';

/** Entrada de {@link DeleteFlavor}: el id del sabor a quitar del catálogo. */
export interface DeleteFlavorRequest {
    id: string;
}

/**
 * Quita un sabor del catálogo. La invocan las pantallas de gestión del catálogo de sabores del
 * recetario. Orquesta solo FlavorRepository (delete por id); no publica ningún evento.
 */
@Injectable({ providedIn: 'root' })
export class DeleteFlavor extends UseCase<DeleteFlavorRequest, void> {
    private readonly flavors = inject(FlavorRepository);

    async execute({ id }: DeleteFlavorRequest): Promise<void> {
        await this.flavors.delete(new EntityId(id));
    }
}
