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
 * ## Por qué se guarda la huella y no la fila
 *
 * Para comparar basta saber **si** cambió, no en qué. Guardando la huella, la base ocupa lo mismo por
 * fila tenga la fila tres columnas o treinta, y no duplica en disco un catálogo que ya está entero en
 * los stores de su contexto.
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
}

export abstract class SyncShadow {
  /** Toda la base. El ciclo la lee entera de una vez y compara en memoria. */
  abstract all(): Promise<ShadowRow[]>;

  /**
   * Recuerda una fila.
   *
   * Se escribe **fila a fila, justo después de aplicar cada una**, no al final del lote. Si el proceso
   * muriera entre «apliqué cuarenta filas» y «apunté la base», esas cuarenta parecerían cambios locales
   * en el ciclo siguiente y se subirían de vuelta **con una versión nueva y contenido viejo**, ganándole
   * a una edición legítima de otro dispositivo.
   */
  abstract put(row: ShadowRow): Promise<void>;

  /** Olvida una fila: ya no está en el destino y tampoco aquí. */
  abstract remove(table: string, rowId: string): Promise<void>;

  /** Vacía la base entera. Al cambiar de cuenta, la de la anterior no vale para nada. */
  abstract clear(): Promise<void>;
}
