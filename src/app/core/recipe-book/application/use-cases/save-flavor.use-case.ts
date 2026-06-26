import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { Flavor } from '../../domain/entities/flavor';
import { FlavorRepository } from '../../domain/repositories/flavor.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface SaveFlavorRequest {
    id?: string; // presente → renombrar; ausente → crear
    label: string;
}

/** Crea o renombra un sabor del catálogo. La regla vive en `Flavor`; el use case orquesta. */
@Injectable({ providedIn: 'root' })
export class SaveFlavor extends UseCase<SaveFlavorRequest, { id: string }> {
    private readonly flavors = inject(FlavorRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, label }: SaveFlavorRequest): Promise<{ id: string }> {
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
        await this.flavors.save(Flavor.create(newId, label));
        await this.bus.publish([RecipeBookEvents.flavorSaved(newId.value, true)]);
        return { id: newId.value };
    }
}
