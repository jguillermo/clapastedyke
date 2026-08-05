import { ExportedRows, ExportRef } from '../export/exportable-data';

/**
 * El reverso de `ExportableData`: **traer datos de fuera al modelo de quien los posee**.
 *
 * Es lo que permite que la sincronización aplique lo que leyó del destino **sin conocer a nadie**.
 * Quien sincroniza sabe qué filas ganaron; lo que significan esas filas, y si se pueden convertir en
 * algo válido, solo lo sabe el contexto que las posee. Vive en el shared kernel por la misma razón que
 * su gemelo: es el único sitio del que pueden depender dos contextos que no se conocen.
 *
 * ## Se aplica por tablas, no fila a fila
 *
 * Porque hay agregados que **no caben en una fila**: una receta necesita sus líneas, y las líneas
 * vienen en otra tabla. Un contrato de fila en fila obligaría a quien llama a saber eso — es decir, a
 * conocer el modelo del otro contexto, que es justo lo que este contrato evita.
 *
 * ## CRITICAL: aplicar NO puede publicar eventos
 *
 * Quien implemente esto rehidrata con `restore(...)` y guarda por el repositorio, **nunca a través de
 * un caso de uso y nunca publicando**. Un `*Saved` por cada fila bajada haría que el suscriptor de
 * cambios encolara una subida de lo que se acaba de bajar, en bucle. Es la misma razón por la que el
 * seed usa `restore`, y está documentada en su fichero.
 *
 * ## CRITICAL: aplicar NO lanza por datos
 *
 * Una fila puede ser imposible: una cantidad en cero, una unidad en blanco, una receta sin
 * ingredientes. Si eso lanzara, el ciclo entero moriría — y como la celda seguiría en el destino,
 * moriría **igual para siempre**, y la convergencia se detendría del todo.
 *
 * Así que se contesta **fila a fila**: lo que entró y lo que no, con su motivo. Quien llama apunta las
 * rechazadas para no reintentarlas hasta que cambien, no las sobrescribe (escribirles encima borraría
 * el intento de corrección de una persona) y las cuenta en el indicador. El resto del lote entra.
 *
 * Lanzar sigue estando bien para lo que **no** es un dato: que IndexedDB no abra, que falte una
 * dependencia. Eso no es una fila mala, es que no se puede trabajar.
 */

/** Lo que hay que traer: filas que ganaron, y agregados que hay que borrar. */
export interface ImportChange {
  /**
   * Las filas a aplicar, por tabla, con la misma forma que produce `ExportableData`.
   *
   * Sus valores llegan **como los dio el destino**: un número puede venir como número o como texto.
   * Quien implementa esto los interpreta; es su capa anticorrupción hacia fuera.
   */
  readonly tables: ExportedRows;
  /** Los agregados a borrar, por si el destino dice que ya no están. */
  readonly deleted: readonly ExportRef[];
}

/** Una fila que no se pudo aplicar, y por qué — en un texto que se le pueda enseñar a alguien. */
export interface RejectedRow {
  readonly ref: ExportRef;
  readonly reason: string;
}

export interface ApplyOutcome {
  /** Lo que entró. Quien llama lo usa para poner al día su base de comparación. */
  readonly applied: readonly ExportRef[];
  /** Lo que no pudo entrar, con su motivo. */
  readonly rejected: readonly RejectedRow[];
}

export abstract class ImportableData {
  abstract apply(change: ImportChange): Promise<ApplyOutcome>;
}
