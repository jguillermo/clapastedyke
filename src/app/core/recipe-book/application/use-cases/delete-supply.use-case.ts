import { inject, Injectable } from '@angular/core';
import { EntityId } from '@core/_common/entity-id';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { SupplyRepository } from '../../domain/repositories/supply.repository';

export interface DeleteSupplyRequest {
  id: string;
}

/**
 * Borra un insumo, **si no lo está usando ninguna receta**.
 *
 * ## Por qué se niega en vez de borrar y arreglar
 *
 * Un insumo borrado deja a cada receta que lo usaba con una línea que apunta a nada: la receta pierde
 * ese ingrediente y su costo baja sin que nadie lo haya decidido. Las tres salidas posibles eran quitar
 * la línea de cada receta (borrar datos que el usuario no pidió borrar), dejarla colgando (una receta que
 * la app no sabe costear) o **no borrar y decir por qué**. La tercera es la única en la que no se pierde
 * nada, y además le dice a la persona exactamente qué tiene que hacer antes.
 *
 * ## La regla vive aquí, y no en el dominio
 *
 * «No se puede borrar lo que otro agregado está usando» necesita **preguntar al repositorio de recetas**,
 * y eso ninguna entidad puede hacerlo. Es el caso que las convenciones reservan al caso de uso: no es una
 * regla del insumo, es una regla del recetario.
 *
 * Ver {@link DeleteRecipe} para lo que comparten: lápida en vez de olvido, y ningún evento.
 */
@Injectable({ providedIn: 'root' })
export class DeleteSupply extends UseCase<DeleteSupplyRequest, void> {
  private readonly supplies = inject(SupplyRepository);
  private readonly recipes = inject(RecipeRepository);
  private readonly log = inject(Logger).scoped('recipe-book/delete-supply');

  async execute({ id }: DeleteSupplyRequest): Promise<void> {
    const supplyId = new EntityId(id);
    this.log.debug('borrar insumo ▶', { id });

    const used = (await this.recipes.all()).filter((recipe) =>
      recipe.ingredients.some((ingredient) => ingredient.supplyId.equals(supplyId)),
    );
    if (used.length > 0) {
      this.log.debug('borrar insumo ✘: lo usan recetas', { id, recetas: used.length });
      throw new Error(
        `No se puede borrar: lo usa ${recipesIn(used.map((recipe) => recipe.name))}.`,
      );
    }

    await this.supplies.delete(supplyId);
    this.log.debug('borrar insumo ✔', { id });
  }
}

/**
 * «la receta «Bizcocho»» · «2 recetas («Bizcocho», «Torta»)» · «5 recetas («A», «B», «C» y 2 más)».
 *
 * Se nombran las recetas porque el mensaje tiene que ser accionable: «lo usa alguna receta» obliga a
 * buscarlas una por una. Se cortan a tres para que quepa en un aviso.
 */
function recipesIn(names: readonly string[]): string {
  const quoted = names.map((name) => `«${name}»`);
  if (quoted.length === 1) {
    return `la receta ${quoted[0]}`;
  }
  const shown = quoted.slice(0, 3).join(', ');
  const rest = quoted.length - 3;
  return `${quoted.length} recetas (${rest > 0 ? `${shown} y ${rest} más` : shown})`;
}
