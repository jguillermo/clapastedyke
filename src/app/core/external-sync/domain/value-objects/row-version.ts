/**
 * La versión de una fila: un **reloj lógico híbrido** (HLC) que decide quién gana cuando el mismo
 * dato cambió en dos sitios.
 *
 * ## Por qué no basta con `Date.now()`
 *
 * Los datos se editan desde varios dispositivos —un móvil, un portátil, la propia hoja— y **cada uno
 * tiene su propio reloj**. Con marcas de tiempo a secas, un teléfono con la hora atrasada media hora
 * perdería *siempre*: cada cosa que escribiera nacería «vieja» y la sobrescribiría cualquier otro
 * dispositivo. Un HLC arregla eso leyendo lo que ya hay escrito: el reloj local nunca va por detrás de
 * la versión más alta que haya visto, así que un dispositivo desfasado se pone al día en cuanto lee.
 *
 * ## La forma es un `string`, y es a propósito
 *
 * `millis-contador-dispositivo`, con las dos primeras partes **acolchadas con ceros a un ancho fijo**.
 * Eso hace que comparar versiones sea comparar cadenas, y que la columna se ordene bien en la hoja si
 * alguien la ordena a mano. El `contador` desempata dos escrituras dentro del mismo milisegundo; el
 * `dispositivo` desempata dos dispositivos en el mismo milisegundo y contador, para que la decisión sea
 * la misma en todas las máquinas (si no, dos dispositivos podrían creerse ganadores a la vez y no
 * converger nunca).
 *
 * ## Por qué hay un tope de desfase
 *
 * La columna `version` está **visible y sin proteger** en la hoja del usuario: es un dato que puede
 * teclear, arrastrar al ordenar o pegar sin querer. Y una versión con el año 3000 no solo gana esa
 * fila para siempre — al entrar en el reloj lo **envenenaría**, y a partir de ahí *todo* lo que
 * escribiera este dispositivo nacería en el año 3000, contagiando a los demás en cuanto leyeran. No
 * habría vuelta atrás.
 *
 * Por eso `merge()` **no acepta** una versión remota que venga del futuro más allá de `SKEW_TOLERANCE`:
 * no adelanta el reloj, y quien la lea la tratará como sospechosa y le pondrá una sana. El desfase
 * real entre relojes de verdad es de segundos; cinco minutos deja sitio de sobra para eso y ninguno
 * para un año 3000.
 *
 * Un valor ilegible **nunca lanza**: se devuelve `null` y quien pregunta decide (y decide re-estampar).
 * Una excepción aquí atascaría la sincronización entera por una celda mal escrita.
 */

/** Cuánto se le tolera a un reloj ajeno ir por delante del propio. */
export const SKEW_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Ancho de la parte física. 13 dígitos aguantan hasta el año 2286 en milisegundos de epoch, así que el
 * acolchado no se desborda y el orden lexicográfico coincide con el numérico durante toda la vida útil
 * de esto.
 */
const MILLIS_WIDTH = 13;

/** Ancho del contador. Son escrituras dentro de un mismo milisegundo: 9999 es un techo generoso. */
const COUNTER_WIDTH = 4;

/**
 * Identificador de dispositivo para lo que se **adopta** de una hoja que todavía no tenía versiones
 * (ver la migración de esquema). No es ningún dispositivo real; solo hace falta para que la versión
 * mínima tenga las tres partes y se pueda leer como cualquier otra.
 */
const ADOPTED_DEVICE = '0';

export class RowVersion {
  private constructor(
    readonly millis: number,
    readonly counter: number,
    readonly deviceId: string,
  ) {}

  /**
   * Lee una versión escrita. `null` si no se puede: vacía, con otra forma, con letras donde van
   * números o con partes negativas. **No lanza**: una celda que un humano estropeó no puede parar la
   * sincronización de todo lo demás.
   */
  static parse(raw: string): RowVersion | null {
    const parts = raw.trim().split('-');
    if (parts.length !== 3) {
      return null;
    }

    const [millis, counter, deviceId] = parts;
    if (!/^\d+$/.test(millis) || !/^\d+$/.test(counter) || deviceId.length === 0) {
      return null;
    }

    const parsedMillis = Number(millis);
    const parsedCounter = Number(counter);
    if (!Number.isSafeInteger(parsedMillis) || !Number.isSafeInteger(parsedCounter)) {
      return null;
    }
    return new RowVersion(parsedMillis, parsedCounter, deviceId);
  }

  static of(millis: number, counter: number, deviceId: string): RowVersion {
    return new RowVersion(millis, counter, deviceId);
  }

  /** La primera versión de un dispositivo en un instante dado. */
  static first(millis: number, deviceId: string): RowVersion {
    return new RowVersion(millis, 0, deviceId);
  }

  /**
   * La versión más baja que existe. Se le pone a cada fila que ya estaba en la hoja antes de que
   * hubiera columna de versión: así el diagnóstico normal decide qué hacer con ella, en vez de tratar
   * el catálogo entero como recién editado a mano.
   */
  static adopted(): RowVersion {
    return new RowVersion(0, 0, ADOPTED_DEVICE);
  }

  /**
   * `true` si esta versión viene de un futuro que ningún reloj real justifica, y por tanto **no debe
   * adelantar el reloj local** ni ganar por su marca.
   */
  isFromTheFuture(now: number): boolean {
    return this.millis > now + SKEW_TOLERANCE_MS;
  }

  /**
   * Orden total: negativo si esta es anterior, positivo si es posterior, `0` solo si son la misma.
   * El `deviceId` entra al final para que **todos los dispositivos decidan igual** ante un empate.
   */
  compareTo(other: RowVersion): number {
    if (this.millis !== other.millis) {
      return this.millis < other.millis ? -1 : 1;
    }
    if (this.counter !== other.counter) {
      return this.counter < other.counter ? -1 : 1;
    }
    if (this.deviceId === other.deviceId) {
      return 0;
    }
    return this.deviceId < other.deviceId ? -1 : 1;
  }

  isAfter(other: RowVersion): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: RowVersion): boolean {
    return this.compareTo(other) === 0;
  }

  /** La forma que se escribe en la hoja, comparable como cadena. */
  toString(): string {
    const millis = String(this.millis).padStart(MILLIS_WIDTH, '0');
    const counter = String(this.counter).padStart(COUNTER_WIDTH, '0');
    return `${millis}-${counter}-${this.deviceId}`;
  }
}

/**
 * El reloj de **este** dispositivo. Emite versiones que nunca van hacia atrás, ni siquiera si el
 * reloj del sistema se ajusta a una hora anterior a mitad de sesión.
 *
 * No es un value object: tiene estado que avanza. Vive en el dominio porque la regla que aplica —cómo
 * se ordena una escritura frente a otra— es de negocio, no de transporte.
 */
export class RowClock {
  private millis = 0;
  private counter = 0;

  constructor(private readonly deviceId: string) {}

  /**
   * Pone el reloj al día con algo que se acaba de leer de la hoja.
   *
   * Una versión **del futuro** se ignora a este efecto: es lo que impide que una celda envenenada se
   * lleve por delante el reloj de este dispositivo y, a través de él, el de todos los demás.
   */
  observe(version: RowVersion, now: number): void {
    if (version.isFromTheFuture(now)) {
      return;
    }
    if (version.millis > this.millis) {
      this.millis = version.millis;
      this.counter = version.counter;
      return;
    }
    if (version.millis === this.millis && version.counter > this.counter) {
      this.counter = version.counter;
    }
  }

  /**
   * La siguiente versión de este dispositivo, estrictamente posterior a todo lo emitido y a todo lo
   * observado. Si el tiempo físico avanzó, se reinicia el contador; si no —mismo milisegundo, o un
   * reloj que retrocedió—, se incrementa.
   */
  next(now: number): RowVersion {
    if (now > this.millis) {
      this.millis = now;
      this.counter = 0;
    } else {
      this.counter += 1;
    }
    return RowVersion.of(this.millis, this.counter, this.deviceId);
  }
}
