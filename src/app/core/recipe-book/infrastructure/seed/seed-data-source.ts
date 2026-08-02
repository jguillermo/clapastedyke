import { inject, Injectable } from '@angular/core';
import { Logger } from '../../../_common/logger/logger';
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
  private readonly log = inject(Logger).scoped('recipe-book/seed-source');

  async load(): Promise<RecipeBookSeedDocument | null> {
    try {
      const res = await fetch(SEED_DOCUMENT_URL, { cache: 'no-cache' });
      if (!res.ok) {
        // Degradación silenciosa: la app arranca con el recetario vacío y parece un error de datos.
        this.log.warn('no hay documento de seed: el recetario arranca vacío', undefined, {
          url: SEED_DOCUMENT_URL,
          status: res.status,
        });
        return null;
      }
      const doc = (await res.json()) as RecipeBookSeedDocument;
      this.log.debug('documento de seed leído', { version: doc.version ?? 1 });
      return doc;
    } catch (error) {
      this.log.warn('documento de seed ilegible: el recetario arranca vacío', error, {
        url: SEED_DOCUMENT_URL,
      });
      return null;
    }
  }
}
