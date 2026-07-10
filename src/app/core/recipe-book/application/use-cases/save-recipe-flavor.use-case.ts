import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

/** Entrada de {@link SaveRecipeFlavor}: el label del sabor (con id para renombrar, sin id para crear). */
export interface SaveRecipeFlavorRequest {
    id?: string; // presente → renombrar; ausente → crear
    label: string;
}

/**
 * Crea o renombra un sabor del catálogo. La invocan las pantallas de gestión del catálogo de sabores
 * del recetario. Con id renombra el existente vía `RecipeFlavor.relabeledTo`; sin id crea uno nuevo, con
 * dedup por label (reutiliza el sabor existente con el mismo nombre). La regla vive en `RecipeFlavor`; el
 * use case orquesta. Orquesta RecipeFlavorRepository y publica `FlavorSaved` vía EventBus.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipeFlavor extends UseCase<SaveRecipeFlavorRequest, { id: string }> {
    private readonly flavors = inject(RecipeFlavorRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, label }: SaveRecipeFlavorRequest): Promise<{ id: string }> {
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
}
