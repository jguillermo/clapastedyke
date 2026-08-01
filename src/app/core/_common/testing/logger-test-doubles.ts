import { Provider } from '@angular/core';
import { Logger, LogLevel, LogSetting } from '../logger/logger';

/** Una línea registrada, tal como la recibió el logger. */
export interface LoggedEntry {
  level: LogLevel;
  message: string;
  context?: unknown;
}

/**
 * Logger de test: **no escribe en ninguna parte**, solo apunta lo que le piden registrar.
 *
 * Doble por partida doble: silencia la salida de los tests (que si no se llenarían de trazas del
 * seed y del bus) y deja comprobar **qué** se registró sin espiar `console`, que es un global.
 */
export class RecordingLogger extends Logger {
  readonly entries: LoggedEntry[] = [];
  private current: LogSetting = 'debug';

  get level(): LogSetting {
    return this.current;
  }

  setLevel(level: LogSetting): void {
    this.current = level;
  }

  debug(message: string, context?: unknown): void {
    this.record('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.record('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.record('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.record('error', message, context);
  }

  scoped(scope: string): Logger {
    return new ScopedRecordingLogger(this, `[${scope}]`);
  }

  /** Los mensajes registrados, en orden. Atajo para el aserto más común. */
  messages(): string[] {
    return this.entries.map((entry) => entry.message);
  }

  record(level: LogLevel, message: string, context?: unknown): void {
    this.entries.push(context === undefined ? { level, message } : { level, message, context });
  }
}

/** El hijo con prefijo: apunta en el mismo sitio que su padre. */
class ScopedRecordingLogger extends Logger {
  constructor(
    private readonly parent: RecordingLogger,
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
    this.parent.record('debug', `${this.prefix} ${message}`, context);
  }

  info(message: string, context?: unknown): void {
    this.parent.record('info', `${this.prefix} ${message}`, context);
  }

  warn(message: string, context?: unknown): void {
    this.parent.record('warn', `${this.prefix} ${message}`, context);
  }

  error(message: string, context?: unknown): void {
    this.parent.record('error', `${this.prefix} ${message}`, context);
  }

  scoped(scope: string): Logger {
    return new ScopedRecordingLogger(this.parent, `${this.prefix}[${scope}]`);
  }
}

/** Enchufa el logger de test. Lo necesita todo `TestBed` que instancie algo que registre. */
export function provideTestLogger(): Provider[] {
  return [{ provide: Logger, useClass: RecordingLogger }];
}
