import { SyncTarget } from '../value-objects/sync-target';

/**
 * Las tablas **del destino**: leerlas y escribirlas, con la misma forma de fila que las de aquí.
 *
 * Deliberadamente simétrico con `LocalRepository`, y deliberadamente ignorante: no dice qué es el
 * destino. Hoy es una hoja de cálculo; lo que sabe este contrato es que hay tablas con nombre, filas
 * con id, y unos metadatos de sincronización por fila. Cambiar de destino es cambiar la línea de
 * `external-sync.providers.ts` que decide la implementación.
 *
 * La única concesión a que el destino tenga **posición** —el `index` de cada fila— no es un capricho:
 * una hoja la escribe una persona, que pone las filas donde quiere. Sin la posición no se puede
 * corregir una celda sin mover la fila de sitio, y mover de sitio la fila de alguien es una forma
 * silenciosa de estropearle el trabajo.
 */

/** Los metadatos de sincronización que el destino guarda junto a cada fila. */
export interface RemoteRowMeta {
  /** Reloj lógico: decide quién gana un conflicto. Vacío en una fila que este motor nunca escribió. */
  readonly version: string;
  /** Qué dispositivo la escribió. Desempate y diagnóstico. */
  readonly origin: string;
  /** La huella del contenido tal y como está escrita. Vacía = fila que este motor nunca escribió. */
  readonly fingerprint: string;
  /** La lápida. */
  readonly deleted: boolean;
}

export interface RemoteRow {
  /**
   * Dónde está la fila, contando desde 1 y con la cabecera incluida.
   *
   * Se conserva porque es la única forma de volver a escribir **esa** fila. Y por eso el lector no
   * puede descartar filas en blanco: en cuanto se salta una, todas las de abajo quedan desplazadas.
   */
  readonly index: number;
  /** La fila ya reconstruida: objetos anidados y listas incluidos. Sin sus metadatos. */
  readonly values: Record<string, unknown>;
  readonly meta: RemoteRowMeta;
}

export interface RemoteTable {
  readonly table: string;
  /**
   * `false` si la tabla **no está** en el destino.
   *
   * No es lo mismo que estar vacía, y confundirlos es catastrófico: «no hay filas» combinado con «lo
   * que estaba y ya no está se borró» borraría la tabla entera en todos los dispositivos. Un clic
   * derecho en «Eliminar hoja» no puede costar eso.
   */
  readonly present: boolean;
  /** Las columnas que el destino tiene hoy, en su orden. */
  readonly columns: readonly string[];
  readonly rows: readonly RemoteRow[];
  /** Filas cuyo contenido no se puede leer. No entran en la decisión y no se sobrescriben nunca. */
  readonly unreadable: readonly UnreadableRemoteRow[];
  /**
   * Las filas de datos **tal y como están escritas**, sin interpretar, en el orden de la tabla.
   *
   * Hace falta para poder reescribirla sin perder lo que este código no entiende: una fila que alguien
   * acaba de teclear y todavía no tiene id, una que quedó en cuarentena por una celda ilegible, o una
   * columna que ningún registro de aquí produce. Reconstruir el contenido solo con lo que se supo leer
   * **borraría todo eso** en la primera escritura, sin aviso.
   */
  readonly raw: readonly RawRow[];
}

/**
 * Una fila del destino tal cual está escrita: sus celdas **por nombre de columna**, sin interpretar.
 *
 * Por nombre y no por posición para que reescribir una tabla a la que alguien le movió o le añadió
 * columnas no corra el contenido de sitio.
 */
export interface RawRow {
  /** Su id, o cadena vacía si no lo tiene. */
  readonly id: string;
  readonly cells: Readonly<Record<string, string>>;
}

export interface UnreadableRemoteRow {
  readonly index: number;
  readonly id: string | null;
  readonly column: string;
}

export interface RemoteSnapshot {
  readonly tables: readonly RemoteTable[];
  /** Con qué versión del esquema se escribió el destino. `null` si no lo dice. */
  readonly schemaVersion: number | null;
}

export interface RemoteRequest {
  /** Credencial del usuario. Nunca se registra ni se guarda. */
  readonly credential: string;
  readonly target: SyncTarget;
}

export interface ReadRequest extends RemoteRequest {
  readonly tables: readonly string[];
}

/**
 * Las escrituras de un ciclo. **Todas juntas**: el destino las agrupa en las menos peticiones que
 * pueda, y así hay un solo momento en el que el proceso puede morir dejando algo a medias.
 */
export type RemoteWrite =
  /**
   * El contenido de una tabla **entero y en su orden final**, columnas incluidas.
   *
   * Va entero y no «las filas que cambiaron» a propósito: así escribirlo es idempotente, y así el
   * destino no tiene que releer para fusionar —lo que obligaría a decidir con una lectura distinta de
   * la que usó quien decidió, que es como se pisan los cambios de otro dispositivo—. Quien manda esto
   * ya fusionó, con el mismo estado remoto sobre el que tomó la decisión.
   */
  | {
      readonly kind: 'upsert';
      readonly table: string;
      /** La cabecera: columnas de datos y, al final, las de servicio. */
      readonly columns: readonly string[];
      /** Las filas, con sus celdas **alineadas a `columns`**. */
      readonly rows: readonly (readonly string[])[];
    }
  /**
   * Algunas celdas de una fila que ya existe, **sin moverla de sitio**.
   *
   * Lleva sus propias `columns` porque puede ser lo único que se escriba en esa tabla: adoptar una
   * fila que alguien tecleó no sube nada —la fila ya está allí—, así que no hay ningún `upsert` del
   * que sacar la cabecera, y sin ella no se sabe en qué columna cae cada celda.
   */
  | {
      readonly kind: 'stamp';
      readonly table: string;
      readonly columns: readonly string[];
      readonly index: number;
      readonly cells: Readonly<Record<string, string>>;
    }
  /** Quitar filas del destino. Solo para lápidas viejas. */
  | { readonly kind: 'drop'; readonly table: string; readonly indexes: readonly number[] };

export interface WriteRequest extends RemoteRequest {
  readonly writes: readonly RemoteWrite[];
}

export interface WriteOutcome {
  /** Cuántas filas se escribieron, por tabla. Para dar parte al usuario. */
  readonly applied: Readonly<Record<string, number>>;
  /** En cuántas peticiones hizo falta partirlo. Más de una significa que **no fue atómico**. */
  readonly requests: number;
}

export abstract class RemoteRepository {
  abstract read(request: ReadRequest): Promise<RemoteSnapshot>;
  abstract write(request: WriteRequest): Promise<WriteOutcome>;
}
