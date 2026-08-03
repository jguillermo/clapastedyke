/**
 * Una fila: un registro plano de primitivos. Qué columnas tenga lo decide quien exporta.
 *
 * Es `object` y no `Record<string, unknown>` por una limitación de TypeScript: una `interface` no
 * tiene índice implícito, así que las filas tipadas de cada contexto no encajarían en un `Record` y
 * habría que declararlas como alias de tipo (o colar un cast) solo para satisfacer una forma que
 * **nadie lee**: aquí las filas se transportan y se serializan, nunca se inspeccionan columna a
 * columna. Quien exporta sí tipa las suyas; el contrato solo exige que sean objetos.
 */
export type ExportedRow = object;

/**
 * Datos exportados, agrupados en **tablas con nombre** (`'recipes'`, `'supplies'`, …).
 *
 * Ni quien pide ni el transporte conocen las columnas: son datos planos que viajan tal cual. Esa
 * ignorancia es lo que permite exportar cualquier cosa sin tocar a quien la mueve.
 */
export type ExportedRows = Readonly<Record<string, readonly ExportedRow[]>>;

/** Referencia a un dato concreto: qué agregado (`'recipe'`) y cuál. */
export interface ExportRef {
  aggregate: string;
  id: string;
}

export interface ExportQuery {
  /** `true` = todo lo exportable; `false` = solo las `refs`. */
  all: boolean;
  /** Los datos concretos a exportar. Vacío cuando `all` es `true`. */
  refs: readonly ExportRef[];
  /** Limita la exportación a un agregado. Ausente = todos los que haya. */
  aggregate?: string;
}

/**
 * Contrato del shared kernel: **quién sabe proyectar sus datos a filas planas** para sacarlos del
 * sistema.
 *
 * Vive aquí, y no en el contexto que los posee ni en el que los envía, porque un contexto no puede
 * importar de otro. El dueño de los datos lo implementa —él conoce su modelo y sus nombres de
 * agregado—; quien los sincroniza lo consume sin saber de qué datos se trata.
 */
export abstract class ExportableData {
  abstract export(query: ExportQuery): Promise<ExportedRows>;
}
