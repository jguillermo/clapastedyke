import { inject, Injectable } from '@angular/core';
import { EntityId } from '@core/_common/entity-id';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';

export interface DeleteRecipeRequest {
  id: string;
}

/**
 * Borra una receta.
 *
 * ## Es una lápida, no un olvido
 *
 * El repositorio no quita el documento: le pone fecha de borrado y deja de entregarlo en las lecturas
 * (ver `synced-record.ts`). Eso es lo que permite que el borrado **viaje**: la sincronización compara lo
 * que hay aquí con la base de la última vez, y una fila que estaba y ya no está es lo que se marca como
 * borrada en la hoja del usuario. Si el documento desapareciera del todo, el borrado sería
 * indistinguible de «esta receta nunca llegó a este dispositivo» y el primer dispositivo desconectado la
 * resucitaría.
 *
 * ## Nada que comprobar antes
 *
 * A una receta no apunta nadie: las categorías, los sabores y las capacidades existen por su cuenta, y
 * los insumos no saben en qué recetas se usan. Por eso este caso de uso toca un solo repositorio, al
 * contrario que {@link DeleteSupply}.
 *
 * ## No publica ningún evento
 *
 * No hay `RecipeDeleted` en el Published Language, y esto no lo necesita: el borrado se sube porque la
 * sincronización lo **deduce** de la diferencia, no porque nadie se lo cuente. La única consecuencia es
 * de cadencia — sin evento no hay rebote de cinco segundos, así que la lápida sale con el ciclo
 * siguiente (a los dos minutos, o antes si el usuario toca cualquier otra cosa).
 */
@Injectable({ providedIn: 'root' })
export class DeleteRecipe extends UseCase<DeleteRecipeRequest, void> {
  private readonly recipes = inject(RecipeRepository);
  private readonly log = inject(Logger).scoped('recipe-book/delete-recipe');

  async execute({ id }: DeleteRecipeRequest): Promise<void> {
    this.log.debug('borrar receta ▶', { id });
    await this.recipes.delete(new EntityId(id));
    this.log.debug('borrar receta ✔', { id });
  }
}
