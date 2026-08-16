/**
 * Las tablas de **aquí**: leer una entera y escribir en bloque.
 *
 * ## Por qué el sincronizador habla de tablas y no de recetas
 *
 * Este contexto no conoce ningún modelo. No sabe qué es un insumo, ni que una receta tiene líneas, ni
 * que un precio lleva moneda: mueve **filas con id** entre dos sitios. Esa ignorancia es justo lo que
 * hace que replicar algo nuevo sea añadir el nombre de su tabla a un array, sin tocar una línea de
 * este código.
 *
 * Y por eso el puerto es este y no los repositorios del contexto dueño de los datos: pedirle a cada
 * contexto que exponga sus agregados obligaría a traducir a su modelo —y a validar con sus
 * invariantes— algo que solo hay que copiar de un lado a otro. Una fila que la hoja tiene y el modelo
 * de hoy rechazaría (porque la escribió una versión anterior, o una persona) se guarda igual y se
 * queda ahí hasta que alguien la arregle, en vez de perderse.
 */

/**
 * Una fila cualquiera: su identidad y lo que sea que lleve dentro.
 *
 * `id` es obligatorio porque es lo único que el sincronizador necesita entender: sin identidad no hay
 * forma de emparejar esta fila con la de la hoja. El resto es opaco — objetos anidados y listas
 * incluidos.
 */
export type TableRow = { readonly id: string } & Record<string, unknown>;

export abstract class LocalRepository {
  /** Todas las filas de una tabla, **incluidas las borradas**: una lápida también se sincroniza. */
  abstract all(table: string): Promise<TableRow[]>;

  /**
   * Escribe N filas **en una sola transacción**.
   *
   * En bloque y no fila a fila por dos razones, y la segunda es la que importa: una transacción por
   * fila multiplica por N el coste de traerse una tabla entera, y además deja de ser atómico — una
   * caída a la mitad guarda unas filas sí y otras no, y el shadow quedaría describiendo un estado que
   * no existe en ningún lado.
   */
  abstract putAll(table: string, rows: readonly TableRow[]): Promise<void>;
}
