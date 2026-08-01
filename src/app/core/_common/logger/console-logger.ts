// ESTE es el único fichero del proyecto autorizado a usar `console`: la excepción a `no-console`
// está declarada por ruta en `eslint.config.mjs`, para que no se pueda copiar con un disable suelto.
import { Injectable, isDevMode } from '@angular/core';
import { Logger, LOG_LEVELS, LogLevel, LogSetting } from './logger';

/** Dónde se recuerda el nivel entre recargas. */
const STORAGE_KEY = 'migo:log';

/** El interruptor que se publica en `window` durante el desarrollo. */
const GLOBAL_KEY = 'migoLog';

/** Qué método de consola usa cada nivel. */
const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

function isLogSetting(value: string | null): value is LogSetting {
  return value === 'silent' || (LOG_LEVELS as readonly string[]).includes(value ?? '');
}

/** Lee el nivel recordado. El almacenamiento puede fallar (modo privado): entonces, silencio. */
function storedLevel(): LogSetting | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLogSetting(stored) ? stored : null;
  } catch {
    return null;
  }
}

function remember(level: LogSetting): void {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Sin almacenamiento el nivel dura lo que la sesión; no es motivo para romper nada.
  }
}

/**
 * Adaptador de {@link Logger} sobre la consola del navegador. **Único fichero con `console.*`.**
 *
 * **Callado por defecto y solo en desarrollo.** En un build de producción no escribe nunca, hagas lo
 * que hagas; en desarrollo arranca en `silent` y se enciende **a pedido**, desde la consola del
 * navegador:
 *
 * ```js
 * migoLog.on()        // todo: debug, info, warn y error
 * migoLog.on('warn')  // solo warn y error
 * migoLog.off()       // silencio
 * migoLog.level()     // qué hay puesto ahora
 * ```
 *
 * El nivel se recuerda en `localStorage`, así que sobrevive a la recarga: enciendes el modo
 * depuración una vez y sigues viendo el arranque, el seed y los eventos en las siguientes.
 */
@Injectable()
export class ConsoleLogger extends Logger {
  /** En producción nunca registra: el interruptor solo existe en desarrollo. */
  private readonly enabled = isDevMode();
  private current: LogSetting = this.enabled ? (storedLevel() ?? 'silent') : 'silent';

  constructor() {
    super();
    if (this.enabled) {
      this.installGlobalSwitch();
    }
  }

  get level(): LogSetting {
    return this.current;
  }

  setLevel(level: LogSetting): void {
    this.current = level;
    remember(level);
  }

  debug(message: string, context?: unknown): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.write('error', message, context);
  }

  scoped(scope: string): Logger {
    return new ScopedLogger(this, `[${scope}]`);
  }

  /** Escribe si el nivel lo permite. `context` va como argumento aparte para que se pueda expandir. */
  write(level: LogLevel, message: string, context?: unknown): void {
    if (!this.allows(level)) {
      return;
    }
    const method = CONSOLE_METHOD[level];
    if (context === undefined) {
      console[method](message);
    } else {
      console[method](message, context);
    }
  }

  private allows(level: LogLevel): boolean {
    if (!this.enabled || this.current === 'silent') {
      return false;
    }
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.current);
  }

  /**
   * Publica `window.migoLog` para poder encender el modo depuración sin recompilar. Solo en
   * desarrollo: en producción esta rama no se ejecuta.
   */
  private installGlobalSwitch(): void {
    const target = globalThis as unknown as Record<string, unknown>;
    target[GLOBAL_KEY] = {
      on: (level: LogSetting = 'debug') => {
        this.setLevel(level);
        console.info(`[logger] nivel: ${level}`);
      },
      off: () => {
        console.info('[logger] silenciado');
        this.setLevel('silent');
      },
      level: () => this.current,
    };
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

  get level(): LogSetting {
    return this.parent.level;
  }

  setLevel(level: LogSetting): void {
    this.parent.setLevel(level);
  }

  debug(message: string, context?: unknown): void {
    this.parent.write('debug', `${this.prefix} ${message}`, context);
  }

  info(message: string, context?: unknown): void {
    this.parent.write('info', `${this.prefix} ${message}`, context);
  }

  warn(message: string, context?: unknown): void {
    this.parent.write('warn', `${this.prefix} ${message}`, context);
  }

  error(message: string, context?: unknown): void {
    this.parent.write('error', `${this.prefix} ${message}`, context);
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
  console.error('[bootstrap] la aplicación no pudo arrancar', error);
}
