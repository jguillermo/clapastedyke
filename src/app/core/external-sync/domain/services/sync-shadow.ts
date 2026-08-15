/**
 * La **base** de la fusión: la última fila que se vio en el destino, por tabla e id.
 *
 * ## Por qué hacen falta tres copias y no dos
 *
 * Con solo lo local y lo remoto no se puede saber **quién** cambió. Si un insumo vale 2,50 aquí y 3,00
 * allí, ¿lo subió alguien en la hoja o lo bajé yo aquí? Son cosas opuestas y se ven igual.
 *
 * Con una tercera copia —lo que había la última vez que se miró— la pregunta se contesta sola:
 *
 * | vs. la base | significa |
 * |---|---|
 * | solo cambió lo local | hay que subirlo |
 * | solo cambió lo remoto | hay que aplicarlo aquí |
 * | cambiaron los dos | conflicto: decide la versión |
 * | no cambió ninguno | no hay nada que hacer |
 *
 * ## Y es lo único que detecta un borrado a mano
 *
 * Si un id está en la base y **ya no está** en el destino, alguien borró esa fila en la hoja. Sin la
 * base, «lo borraron allí» y «esto nunca llegó a este dispositivo» son indistinguibles — y tratarlos
 * igual, en cualquiera de los dos sentidos, pierde datos: o se resucita lo borrado, o se borra lo que
 * nunca se había subido.
 *
 * ## Por qué también se guardan los valores, y no solo la huella
 *
 * Durante un tiempo se guardó solo la huella: para saber **si** algo cambió basta con eso, y ocupa lo
 * mismo tenga la fila tres columnas o treinta. Pero saber que cambió no es suficiente para las dos
 * cosas que la base hace ahora:
 *
 * 1. **Fusionar campo a campo.** Si el destino cambió el precio y aquí se cambió el nombre, se pueden
 *    quedar los dos — pero solo si hay un tercer punto de referencia con el que atribuir cada cambio a
 *    su lado (el mismo papel que el *merge base* de `git`). Con una huella se sabe que la fila cambió;
 *    con los valores se sabe **qué** cambió, y entonces no hay que descartar un lado entero.
 * 2. **Reconocer que falta una columna.** Si alguien borra el rótulo de una columna en la hoja, sus
 *    celdas dejan de tener nombre y no vuelven: la fila parecería editada a mano con ese campo en
 *    blanco y el campo se borraría en todos los dispositivos. Comparando con lo que la base recuerda
 *    se ve que esa columna estaba, y el ciclo se niega a seguir.
 *
 * El precio es duplicar el catálogo en disco. Se acepta: son unos cientos de filas de texto, y lo que
 * compra es no perder el trabajo de nadie.
 *
 * ## Es por cuenta
 *
 * Se vacía al cambiar de cuenta, igual que la cola: una base de la hoja de otra persona haría creer que
 * las filas propias son ediciones remotas.
 */

/** Lo que se recuerda de una fila del destino. */
export interface ShadowRow {
  /** La tabla lógica a la que pertenece. */
  readonly table: string;
  /** El id **canónico** de la fila. Es la identidad con la que se empareja. */
  readonly rowId: string;
  /** La huella de su contenido autoritativo la última vez que se vio. */
  readonly fingerprint: string;
  /** Su versión la última vez que se vio, tal como estaba escrita. */
  readonly version: string;
  /** Si estaba marcada como borrada. Una lápida sigue siendo algo que se vio. */
  readonly deleted: boolean;
  /**
   * Por qué no se pudo aplicar, si no se pudo.
   *
   * Una fila en cuarentena se recuerda **con la huella que tenía al fallar**, y así no se reintenta en
   * cada ciclo: solo cuando el humano cambie esa celda, que es lo único que puede arreglarla. Y sobre
   * todo, **no se sobrescribe**: escribirle nuestro valor encima borraría su intento de corrección.
   */
  readonly rejected?: string;
  /**
   * Los valores de la fila la última vez que se vio, enteros.
   *
   * Es el **ancestro común** con el que se fusionan campos no solapados, y lo que permite reconocer
   * que una columna ha desaparecido de la hoja (ver la cabecera de este fichero).
   *
   * Opcional a propósito: una fila recordada antes de que este campo existiera no lo trae, y su
   * ausencia significa simplemente que no hay ancestro — se decide como siempre, ganando un lado
   * entero. Ningún dispositivo tiene que migrar nada.
   */
  readonly values?: Record<string, unknown>;
}

export abstract class SyncShadow {
  /** Toda la base. El ciclo la lee entera de una vez y compara en memoria. */
  abstract all(): Promise<ShadowRow[]>;

  /**
   * Recuerda una fila.
   *
   * Se escribe **justo después de aplicarla**, no al final del lote. Si el proceso muriera entre
   * «apliqué cuarenta filas» y «apunté la base», esas cuarenta parecerían cambios locales en el ciclo
   * siguiente y se subirían de vuelta **con una versión nueva y contenido viejo**, ganándole a una
   * edición legítima de otro dispositivo.
   */
  abstract put(row: ShadowRow): Promise<void>;

  /**
   * Recuerda N filas **en una sola transacción**.
   *
   * Es la misma escritura que `put`, en bloque: apuntar una tabla entera fila a fila multiplica por N
   * el coste de un ciclo. La atomicidad juega a favor — o se recuerdan todas o ninguna—, siempre que
   * se llame **después** de que la escritura que describen esté confirmada.
   */
  abstract putAll(rows: readonly ShadowRow[]): Promise<void>;

  /** Olvida una fila: ya no está en el destino y tampoco aquí. */
  abstract remove(table: string, rowId: string): Promise<void>;

  /** Vacía la base entera. Al cambiar de cuenta, la de la anterior no vale para nada. */
  abstract clear(): Promise<void>;
}
