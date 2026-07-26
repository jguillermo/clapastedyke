import { Injectable } from '@angular/core';
import { RecipeBookSeedDocument } from './recipe-book-seed-document';

/** URL (relativa) del documento de seed, servido desde `public/`. */
export const SEED_DOCUMENT_URL = 'seed/recipe-book.seed.json';

/**
 * Carga el documento de seed del libro de recetas. Abstracción para poder swapear la fuente
 * en tests (igual que las repositories). Devuelve `null` cuando no hay documento disponible.
 */
export abstract class SeedDataSource {
    abstract load(): Promise<RecipeBookSeedDocument | null>;
}

/**
 * Lee el JSON de seed desde `public/` con `fetch` en runtime (sin `HttpClient`, que no está
 * provisto en la app). Si el fichero no existe o falla la lectura, devuelve `null` para que el
 * seed se omita con elegancia en lugar de romper el arranque.
 */
@Injectable()
export class HttpSeedDataSource extends SeedDataSource {
    async load(): Promise<RecipeBookSeedDocument | null> {
        try {
            const res = await fetch(SEED_DOCUMENT_URL, { cache: 'no-cache' });
            if (!res.ok) {
                return null;
            }
            return (await res.json()) as RecipeBookSeedDocument;
        } catch {
            return null;
        }
    }
}
