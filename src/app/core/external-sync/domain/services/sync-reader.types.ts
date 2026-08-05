/**
 * Lo que se lee del destino, en crudo.
 *
 * Deliberadamente **sin interpretar**: celdas tal y como vinieron, sin recortar, sin convertir y sin
 * descartar nada. Quien decide qué significan es `reconcile`, y para decidirlo necesita ver también lo
 * que está mal escrito — una celda que no se puede leer es información, no basura.
 */

/** Una fila del destino, con su posición real. */
export interface RemoteCellRow {
  /**
   * La fila que ocupa en el destino, contando desde 1, cabecera incluida.
   *
   * Se conserva porque es la única forma de volver a escribir **esa** fila. Y por eso el lector **no
   * puede descartar filas en blanco**: en cuanto se salta una, todas las de abajo quedan
   * desplazadas, y escribir por posición acabaría sobrescribiendo la fila del vecino.
   */
  readonly index: number;
  readonly cells: readonly unknown[];
}

/** Una tabla del destino. */
export interface RemoteTable {
  /** El nombre lógico de la tabla, el mismo con el que la nombra el origen. */
  readonly name: string;
  /**
   * `false` si la tabla no está en el destino.
   *
   * No es lo mismo que estar vacía, y confundirlos es catastrófico: «no hay filas» combinado con la
   * regla «lo que estaba y ya no está, se borró» borraría **la tabla entera en todos los
   * dispositivos**. Por eso se distingue aquí y `reconcile` aborta en vez de aplicar.
   */
  readonly present: boolean;
  /** La fila de cabecera tal cual. Sirve para comprobar que las columnas siguen donde se cree. */
  readonly headers: readonly string[];
  readonly rows: readonly RemoteCellRow[];
}

/** Todo el estado remoto de un ciclo, leído de una vez. */
export interface RemoteSnapshot {
  readonly tables: readonly RemoteTable[];
  /**
   * Con qué versión del esquema se escribió el destino, si lo dice. `null` en un destino que todavía
   * no lo apuntaba: quien reconcilia lo trata como «hay que adoptar lo que haya», no como un error.
   */
  readonly schemaVersion: number | null;
}
