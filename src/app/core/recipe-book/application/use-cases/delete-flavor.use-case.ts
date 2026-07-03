import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { FlavorRepository } from '../../domain/repositories/flavor.repository';

export interface DeleteFlavorRequest {
    id: string;
}

/** Quita un sabor del catálogo. */
@Injectable({ providedIn: 'root' })
export class DeleteFlavor extends UseCase<DeleteFlavorRequest, void> {
    private readonly flavors = inject(FlavorRepository);

    async execute({ id }: DeleteFlavorRequest): Promise<void> {
        await this.flavors.delete(new EntityId(id));
    }
}
