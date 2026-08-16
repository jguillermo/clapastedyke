/**
 * La versión de un registro: un **reloj lógico híbrido** (HLC) que decide quién gana cuando el mismo
 * dato cambió en dos sitios.
 *
 * ## Por qué no basta con `Date.now()`
 *
 * Los datos se editan desde varios orígenes —un móvil, un portátil, el propio destino— y **cada uno
 * tiene su propio reloj**. Con marcas de tiempo a secas, un dispositivo con la hora atrasada perdería
 * *siempre*: cada cosa que escribiera nacería «vieja» y la sobrescribiría cualquier otro origen. Un
 * HLC arregla eso leyendo lo que ya hay escrito: el reloj local nunca va por detrás de la versión más
 * alta que haya visto, así que un origen desfasado se pone al día en cuanto lee.
 *
 * ## La forma es un `string`, y es a propósito
 *
 * `millis-contador-origen`, con las dos primeras partes **acolchadas con ceros a un ancho fijo**. Eso
 * hace que comparar versiones sea comparar cadenas — útil si el destino es algo que un humano puede
 * ordenar (una hoja de cálculo), y trivial de persistir en cualquier otro. El `contador` desempata dos
 * escrituras dentro del mismo milisegundo; el `origen` desempata dos orígenes en el mismo milisegundo y
 * contador, para que la decisión sea la misma en todas las réplicas (si no, dos orígenes podrían
 * creerse ganadores a la vez y no converger nunca).
 *
 * ## Por qué hay un tope de desfase
 *
 * Si el destino expone la versión de forma editable (una columna visible en una hoja, por ejemplo), un
 * valor corrupto —tecleado, arrastrado al ordenar, pegado sin querer— no solo ganaría esa fila para
 * siempre: al entrar en el reloj lo **envenenaría**, y a partir de ahí *todo* lo que emitiera este
 * origen nacería en el futuro, contagiando a los demás en cuanto lo leyeran. No habría vuelta atrás.
 *
 * Por eso el reloj **no acepta** una versión que venga del futuro más allá de `SKEW_TOLERANCE_MS`: no
 * adelanta el reloj, y quien la lea la tratará como sospechosa y le pondrá una sana. El desfase real
 * entre relojes de verdad es de segundos; cinco minutos deja sitio de sobra para eso y ninguno para un
 * valor absurdo.
 *
 * Un valor ilegible **nunca lanza**: se devuelve `null` y quien pregunta decide (y decide
 * re-estampar). Una excepción aquí atascaría la sincronización entera por un dato mal escrito.
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

/** El mayor valor que cabe en cada parte sin ensanchar su acolchado. */
const MILLIS_MAX = 10 ** MILLIS_WIDTH - 1;
const COUNTER_MAX = 10 ** COUNTER_WIDTH - 1;

/**
 * Qué puede ser un origen: **no vacío y sin guiones**. La versión se lee partiendo por guiones, así
 * que un origen que lleve uno (un UUID entero, por ejemplo) produce una cadena que este mismo módulo
 * no puede volver a leer — y una versión ilegible pierde siempre contra el destino, en silencio.
 */
function assertUsableOrigin(originId: string): void {
  if (originId.length === 0 || originId.includes('-')) {
    throw new Error(
      `originId inservible para una versión: ${JSON.stringify(originId)} (no puede estar vacío ni llevar guiones)`,
    );
  }
}

export class LogicalVersion {
  private constructor(
    readonly millis: number,
    readonly counter: number,
    readonly originId: string,
  ) {}

  /**
   * Lee una versión escrita. `null` si no se puede: vacía, con otra forma, con letras donde van
   * números, con partes negativas o con un valor que no cabe en el ancho de su parte. **No lanza**:
   * un dato que alguien estropeó no puede parar la sincronización de todo lo demás.
   *
   * El acolchado sí se perdona (`100-0-x` se lee y sale normalizado): lo que no se perdona es un
   * valor que no cabe, porque `toString()` lo escribiría con más dígitos de los que tiene su parte y
   * el orden de texto dejaría de coincidir con el real — que es lo único para lo que existe el ancho
   * fijo. Un valor así se trata como ilegible y quien lo reciba le pondrá una versión sana.
   */
  static parse(raw: string): LogicalVersion | null {
    const parts = raw.trim().split('-');
    if (parts.length !== 3) {
      return null;
    }

    const [millis, counter, originId] = parts;
    if (!/^\d+$/.test(millis) || !/^\d+$/.test(counter) || originId.length === 0) {
      return null;
    }

    const parsedMillis = Number(millis);
    const parsedCounter = Number(counter);
    if (parsedMillis > MILLIS_MAX || parsedCounter > COUNTER_MAX) {
      return null;
    }
    return new LogicalVersion(parsedMillis, parsedCounter, originId);
  }

  /**
   * Construye una versión nueva. **Lanza** si alguna parte rompe el formato — al revés que `parse`, y
   * a propósito: `parse` lee datos ajenos, que pueden venir estropeados; `of` la llama código de
   * este lado, así que una parte inválida aquí es un error de programación y tiene que doler.
   */
  static of(millis: number, counter: number, originId: string): LogicalVersion {
    assertUsableOrigin(originId);
    if (!Number.isInteger(millis) || millis < 0 || millis > MILLIS_MAX) {
      throw new Error(`instante fuera de rango para una versión: ${millis}`);
    }
    if (!Number.isInteger(counter) || counter < 0 || counter > COUNTER_MAX) {
      throw new Error(`contador fuera de rango para una versión: ${counter}`);
    }
    return new LogicalVersion(millis, counter, originId);
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
   * El `originId` entra al final para que **todas las réplicas decidan igual** ante un empate.
   */
  compareTo(other: LogicalVersion): number {
    if (this.millis !== other.millis) {
      return this.millis < other.millis ? -1 : 1;
    }
    if (this.counter !== other.counter) {
      return this.counter < other.counter ? -1 : 1;
    }
    if (this.originId === other.originId) {
      return 0;
    }
    return this.originId < other.originId ? -1 : 1;
  }

  isAfter(other: LogicalVersion): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: LogicalVersion): boolean {
    return this.compareTo(other) === 0;
  }

  /** La forma que se persiste, comparable como cadena. */
  toString(): string {
    const millis = String(this.millis).padStart(MILLIS_WIDTH, '0');
    const counter = String(this.counter).padStart(COUNTER_WIDTH, '0');
    return `${millis}-${counter}-${this.originId}`;
  }
}

/**
 * El reloj de **este** origen. Emite versiones que nunca van hacia atrás, ni siquiera si el reloj del
 * sistema se ajusta a un instante anterior a mitad de sesión.
 *
 * No es un value object: tiene estado que avanza. Vive junto al motor porque la regla que aplica —cómo
 * se ordena una escritura frente a otra— es la misma pieza de negocio que decide quién gana un
 * conflicto, no un detalle de transporte.
 */
export class HybridClock {
  private millis = 0;
  private counter = 0;

  constructor(private readonly originId: string) {
    // En la puerta de entrada: un origen inservible se detecta al construir el reloj, no en la
    // primera versión que emita —que puede ser mucho después y en otro sitio.
    assertUsableOrigin(originId);
  }

  /**
   * Pone el reloj al día con algo que se acaba de leer.
   *
   * Una versión **del futuro** se ignora a este efecto: es lo que impide que un valor envenenado se
   * lleve por delante el reloj de este origen y, a través de él, el de todos los demás.
   */
  observe(version: LogicalVersion, now: number): void {
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
   * La siguiente versión de este origen, estrictamente posterior a todo lo emitido y a todo lo
   * observado. Si el tiempo físico avanzó, se reinicia el contador; si no —mismo milisegundo, o un
   * reloj que retrocedió—, se incrementa.
   *
   * Al llegar al techo del contador **se avanza el instante** en vez de ensancharlo: un contador de
   * cinco dígitos se escribiría más largo que su acolchado y el orden de texto dejaría de coincidir
   * con el real, que es justo lo que el ancho fijo existe para garantizar. Avanzar un milisegundo
   * mantiene las dos cosas: la versión sigue siendo estrictamente posterior y sigue cabiendo.
   * (Hace falta un ciclo con más de 9999 escrituras dentro del mismo milisegundo, o un contador
   * heredado ya en el techo, para llegar aquí.)
   */
  next(now: number): LogicalVersion {
    if (now > this.millis) {
      this.millis = now;
      this.counter = 0;
    } else if (this.counter >= COUNTER_MAX) {
      this.millis += 1;
      this.counter = 0;
    } else {
      this.counter += 1;
    }
    return LogicalVersion.of(this.millis, this.counter, this.originId);
  }
}
