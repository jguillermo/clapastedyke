/**
 * Todo lo que este navegador guarda: el recetario, la cola de sincronización, la base de comparación
 * con la hoja, la pista de sesión, el marcador de siembra y la cola de eventos. **Todo**, sin
 * distinguir de qué contexto es cada cosa.
 *
 * ## Por qué existe y por qué está en el shared kernel
 *
 * Cerrar sesión tiene que dejar el navegador como recién instalado: si quedara una sola receta, un
 * solo cambio en la cola o el enlace a la hoja de la cuenta anterior, la persona siguiente que use
 * este aparato vería datos que no son suyos —y en el primer ciclo de sincronización viajarían a *su*
 * hoja—.
 *
 * Quien decide borrarlo es la **autenticación**, y lo que se borra pertenece a **todos** los
 * contextos. Como ningún contexto puede conocer a otro, la única forma legítima de que uno pida algo
 * que abarca a los demás es un contrato del shared kernel: aquí está el qué, y el adaptador de
 * infraestructura sabe el cómo.
 *
 * **No distingue por cuenta a propósito.** No es «borra lo de esta persona», es «este navegador
 * vuelve a ser de nadie»: lo que se conserve, se conserva para quien venga después.
 */
export abstract class LocalData {
  /**
   * Vacía todo el almacenamiento local de la app. Al arrancar de nuevo, la siembra vuelve a dejar el
   * recetario de ejemplo (su marcador también se borra aquí, que es lo que la deja volver a correr).
   *
   * No deja nada a medias: si falla, lo hace lanzando, y quien lo pidió decide qué contar.
   */
  abstract wipe(): Promise<void>;
}
