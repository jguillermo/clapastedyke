import { EntityId } from '../../_common/entity-id';
import { RecipeCategory } from '../domain/entities/recipe-category';
import { RecipeProperty } from '../domain/value-objects/recipe-property';
import { RecipeCategoryRecord, RecipePropertyRecord } from './records';

const propertyToRecord = (p: RecipeProperty): RecipePropertyRecord => ({
    id: p.id,
    name: p.name,
    type: p.type,
    required: p.required,
    locked: p.locked,
    role: p.role,
    group: p.group,
    selectable: p.selectable,
});

const propertyToDomain = (r: RecipePropertyRecord): RecipeProperty =>
    RecipeProperty.create(r.id, r.name, r.type, r.required, r.locked ?? false, r.role, r.group, r.selectable ?? false);

export const RecipeCategoryMapper = {
    toRecord(category: RecipeCategory): RecipeCategoryRecord {
        return {
            id: category.id.value,
            name: category.name,
            order: category.order,
            system: category.system,
            properties: category.properties.map(propertyToRecord),
        };
    },

    toDomain(record: RecipeCategoryRecord): RecipeCategory {
        return RecipeCategory.create(
            new EntityId(record.id),
            record.name,
            record.order ?? 0,
            (record.properties ?? []).map(propertyToDomain),
            record.system ?? false,
        );
    },
};
