import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';

/**
 * Rearranca la aplicación: recarga el documento y la deja como una carga en frío.
 *
 * ## Por qué hace falta, y por qué no lo hace la vista a mano
 *
 * Hay una operación que deja el proceso hablando de datos que ya no existen: **cerrar sesión**, que
 * vacía todo el almacenamiento local. Después de eso, lo que hay en memoria —el catálogo leído, el
 * estado de la sincronización, las páginas del libro— es el reflejo de una base de datos que se
 * acaba de borrar, y quedarse ahí enseñaría recetas fantasma hasta que alguien pulsara F5.
 *
 * La carga en frío es además lo que hace cierta la promesa de que **la siembra vuelve a llenar el
 * recetario**: los app-initializers solo corren al arrancar.
 *
 * Vive en `platform/` porque es un mecanismo técnico transversal y toca `window`: ni el dominio ni
 * los casos de uso pueden hacerlo, y una feature que llamara a `location.reload()` metería el
 * navegador en la capa de vistas y no habría forma de doblarlo.
 *
 * Con el enrutado por fragmento, recargar **conserva la ruta actual** (va detrás del `#`): quien
 * cierra sesión desde `/#/cuenta` vuelve a `/#/cuenta`, ya desconectado.
 */
@Injectable({ providedIn: 'root' })
export class AppRestart {
  private readonly log = inject(Logger).scoped('restart');

  restart(): void {
    this.log.debug('rearrancando la aplicación');
    window.location.reload();
  }
}
