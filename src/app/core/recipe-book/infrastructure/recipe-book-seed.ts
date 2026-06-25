import { inject, Injectable } from '@angular/core';
import { buildSystemCategories } from '../domain/entities/recipe-category';
import { RecipeCategoryRepository } from '../domain/repositories/recipe-category.repository';

/**
 * Siembra las categorías de sistema (Queques, Rellenos, Coberturas) cuando la BD
 * está vacía. Sin migración: no lee ni transforma datos anteriores. Idempotente:
 * el guard es que no haya ninguna categoría todavía, así solo siembra en una BD
 * nueva y reabrir no duplica.
 */
@Injectable({ providedIn: 'root' })
export class RecipeBookSeed {
    private readonly categories = inject(RecipeCategoryRepository);

    async run(): Promise<void> {
        const existing = await this.categories.all();
        if (existing.length > 0) {
            return;
        }
        for (const category of buildSystemCategories()) {
            await this.categories.save(category);
        }
    }
}
