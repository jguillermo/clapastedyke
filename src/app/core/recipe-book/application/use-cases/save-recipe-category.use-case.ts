import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/event-bus';
import { RecipeCategory } from '../../domain/entities/recipe-category';
import { RecipeProperty, PropertyType } from '../../domain/value-objects/recipe-property';
import { RecipeCategoryRepository } from '../../domain/repositories/recipe-category.repository';
import { RecipeBookEvents } from '../../domain/events/recipe-book-events';

export interface RecipePropertyInput {
    id?: string;
    name: string;
    type: PropertyType;
    required: boolean;
}

export interface SaveRecipeCategoryRequest {
    id?: string; // presente → editar; ausente → crear
    name: string;
    properties: RecipePropertyInput[];
}

/**
 * Crea o edita una categoría y su esquema de propiedades. Al crear, la añade al
 * final (`order = max + 1`). Al editar una categoría de sistema, conserva las
 * propiedades bloqueadas (lo garantiza `RecipeCategory.redefine`). La regla vive
 * en el dominio; el use case orquesta.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipeCategory extends UseCase<SaveRecipeCategoryRequest, { id: string }> {
    private readonly categories = inject(RecipeCategoryRepository);
    private readonly bus = inject(EventBus);

    async execute({ id, name, properties }: SaveRecipeCategoryRequest): Promise<{ id: string }> {
        if (id) {
            return this.edit(id, name, properties);
        }
        return this.create(name, properties);
    }

    private async create(name: string, properties: RecipePropertyInput[]): Promise<{ id: string }> {
        if (await this.categories.byName(name)) {
            throw new Error(`Ya existe una categoría llamada "${name}"`);
        }
        const all = await this.categories.all();
        const order = all.reduce((max, c) => Math.max(max, c.order), -1) + 1;
        const newId = this.categories.nextIdentity();
        const category = RecipeCategory.create(
            newId,
            name,
            order,
            properties.map((p) => this.toProperty(p)),
        );
        await this.categories.save(category);
        await this.bus.publish([RecipeBookEvents.recipeCategorySaved(newId.value, true)]);
        return { id: newId.value };
    }

    private async edit(
        id: string,
        name: string,
        properties: RecipePropertyInput[],
    ): Promise<{ id: string }> {
        const existing = await this.categories.byId(new EntityId(id));
        if (!existing) {
            throw new Error(`Category ${id} not found`);
        }
        // Las propiedades existentes conservan locked/role/type (no se pueden cambiar las bloqueadas).
        const merged = properties.map((input) => {
            const prior = input.id ? existing.property(input.id) : undefined;
            if (prior?.locked) {
                return prior; // bloqueada: intacta
            }
            return this.toProperty(input, prior?.type);
        });
        const category = existing.redefine(name, merged);
        await this.categories.save(category);
        await this.bus.publish([RecipeBookEvents.recipeCategorySaved(id, false)]);
        return { id };
    }

    private toProperty(input: RecipePropertyInput, fixedType?: PropertyType): RecipeProperty {
        return RecipeProperty.create(
            input.id ?? crypto.randomUUID(),
            input.name,
            fixedType ?? input.type,
            input.required,
        );
    }
}
