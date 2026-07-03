import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { ConversionGroup, ConversionOption } from '../../domain/entities/conversion-option';
import { ConversionOptionRepository } from '../../domain/repositories/conversion-option.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SaveConversionOptionRequest {
    id?: string; // presente → editar; ausente → crear
    group: ConversionGroup;
    label: string;
    factor: number;
}

/**
 * Crea o edita una opción del catálogo de conversión (tamaño/molde/porciones).
 * El factor y sus invariantes viven en `ConversionOption`; el use case orquesta.
 */
@Injectable({ providedIn: 'root' })
export class SaveConversionOption extends UseCase<SaveConversionOptionRequest, { id: string }> {
    private readonly options = inject(ConversionOptionRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, group, label, factor }: SaveConversionOptionRequest): Promise<{ id: string }> {
        // Dedup por (grupo, label) al crear: una opción nueva con un label ya existente lo reutiliza.
        if (!id) {
            const target = label.trim().toLowerCase();
            const existing = (await this.options.byGroup(group)).find((o) => o.label.toLowerCase() === target);
            if (existing) {
                return { id: existing.id.value };
            }
        }
        const optionId = id ? new EntityId(id) : this.options.nextIdentity();
        await this.options.save(ConversionOption.create(optionId, group, label, factor));
        await this.bus.publish([RecipeBookEvents.conversionOptionSaved(optionId.value, !id)]);
        return { id: optionId.value };
    }
}
