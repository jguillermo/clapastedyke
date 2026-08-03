// ESTE es el único fichero del proyecto autorizado a usar `console`: la excepción a `no-console`
// está declarada por ruta en `eslint.config.mjs`, para que no se pueda copiar con un disable suelto.
import { Injectable, inject } from '@angular/core';
import { LOG_DEBUG, Logger, LogContext, LogLevel } from './logger';

/**
 * Qué método de consola usa cada nivel. **`debug` sale por `console.log`, no por `console.debug`**:
 * Chrome clasifica `console.debug` como nivel *Verbose* y lo **oculta por defecto** en devtools, así
 * que las trazas no se veían aunque el logger las emitiera. Un segundo interruptor escondido en el
 * navegador es justo lo que este diseño quiere evitar.
 */
const CONSOLE_METHOD: Record<LogLevel, 'log' | 'info' | 'warn' | 'error'> = {
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

/** Un texto corto para lo que se lanzó y no era un `Error`. */
function describe(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * **Garantiza que siempre haya una pila.** Lo que no es un `Error` se envuelve en uno conservando el
 * valor original en `cause`: la pila apunta aquí y no al `throw`, pero es infinitamente mejor que un
 * `[object Object]` sin nada. Pasa de verdad: `provideBrowserGlobalErrorListeners()` entrega el
 * `reason` de una promesa rechazada tal cual, y eso puede ser cualquier cosa.
 */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown;
  }
  return new Error(`Se lanzó algo que no es un Error: ${describe(thrown)}`, { cause: thrown });
}

/**
 * Adaptador de {@link Logger} sobre la consola del navegador. **Único fichero con `console.*`.**
 *
 * ## Hay una sola decisión, y está en el fichero de configuración
 *
 * | Nivel | Se ve |
 * |---|---|
 * | `error` · `warn` · `info` | **siempre** |
 * | `debug` | si `public/config.json` dice `"debug": true` ({@link LOG_DEBUG}) |
 *
 * Eso es todo. **No hay niveles configurables, ni interruptor de runtime, ni estado guardado en el
 * navegador.** Y el **build es uno solo**: para dejar de ver el detalle del flujo en un despliegue se
 * edita su `config.json` y se recarga — sin recompilar, sin republicar y sin que el artefacto que
 * corre deje de ser el que se probó.
 *
 * `debug` es la única llave porque es el único nivel que sobra fuera de desarrollo: es el detalle
 * del flujo. Los otros tres cuentan algo que hay que saber igual en la máquina de un usuario, así
 * que no se apagan.
 *
 * ## Por qué no un interruptor en la consola
 *
 * Hubo una versión con un `migoLog` en `window` y la posición guardada en `localStorage`. Con eso, el
 * registro que ves depende del navegador en el que estás: uno lo tiene encendido, otro no, y el que
 * acaba de clonar el proyecto no ve ninguna de las trazas que la regla obliga a poner. «Esto no
 * registra» y «no lo he encendido» se ven exactamente igual — que es justo lo que el registro venía a
 * evitar. Ahora la respuesta a «¿por qué no veo trazas?» es un fichero que se abre y se lee.
 */
@Injectable()
export class ConsoleLogger extends Logger {
  /** Lo que dijo `config.json`. Se resuelve una vez: cambiarlo en caliente no es un caso de uso. */
  private readonly debugVisible = inject(LOG_DEBUG);

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, undefined, context);
  }

  warn(message: string, cause?: unknown, context?: LogContext): void {
    this.write('warn', message, cause, context);
  }

  error(message: string, cause?: unknown, context?: LogContext): void {
    // Sin causa no habría pila y el mensaje quedaría huérfano: se sintetiza una para localizar
    // la llamada.
    this.write('error', message, cause ?? new Error(message), context);
  }

  scoped(scope: string): Logger {
    return new ScopedLogger(this, `[${scope}]`);
  }

  /**
   * Escribe. **Aquí está la única compuerta del registro** —`debug`, si la configuración lo apaga—,
   * y está en un solo sitio para que el logger con prefijo no tenga que repetirla.
   *
   * El `Error` va como argumento propio —no dentro del contexto— para que devtools lo pinte con la
   * pila desplegable y la cadena `cause`. La cadena **no se aplana**: el navegador ya la muestra al
   * expandir, y aplanarla perdería los frames pinchables.
   */
  write(level: LogLevel, message: string, cause?: unknown, context?: LogContext): void {
    if (level === 'debug' && !this.debugVisible) {
      return;
    }
    const args: unknown[] = [message];
    if (cause !== undefined) {
      args.push(toError(cause));
    }
    if (context !== undefined) {
      args.push(context);
    }
    console[CONSOLE_METHOD[level]](...args);
  }
}

/** Un logger con prefijo. No tiene estado propio: delega todo en su padre. */
class ScopedLogger extends Logger {
  constructor(
    private readonly parent: ConsoleLogger,
    private readonly prefix: string,
  ) {
    super();
  }

  debug(message: string, context?: LogContext): void {
    this.parent.write('debug', `${this.prefix} ${message}`, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.parent.write('info', `${this.prefix} ${message}`, undefined, context);
  }

  warn(message: string, cause?: unknown, context?: LogContext): void {
    this.parent.write('warn', `${this.prefix} ${message}`, cause, context);
  }

  error(message: string, cause?: unknown, context?: LogContext): void {
    this.parent.write('error', `${this.prefix} ${message}`, cause ?? new Error(message), context);
  }

  scoped(scope: string): Logger {
    return new ScopedLogger(this.parent, `${this.prefix}[${scope}]`);
  }
}

/**
 * El fallo de arranque, que ocurre **antes de que exista el inyector** y por tanto antes de que haya
 * ningún `Logger`. Se registra siempre, también en producción: si esto pasa, no hay aplicación.
 */
export function logBootstrapFailure(error: unknown): void {
  console.error('[bootstrap] la aplicación no pudo arrancar', toError(error));
}
