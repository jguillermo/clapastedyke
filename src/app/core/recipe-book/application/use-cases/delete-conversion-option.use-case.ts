import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';

export interface DeleteConversionOptionRequest {
    id: string;
}

/** Quita una opción del catálogo de conversión. */
@Injectable({ providedIn: 'root' })
export class DeleteConversionOption extends UseCase<DeleteConversionOptionRequest, void> {
    private readonly options = inject(ConversionOptionRepository);

    async execute({ id }: DeleteConversionOptionRequest): Promise<void> {
        await this.options.delete(new EntityId(id));
    }
}
