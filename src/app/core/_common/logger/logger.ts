/** Qué se registra, de menos a más grave. `silent` no registra nada. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Los niveles ordenados: registrar en nivel N muestra N y todo lo más grave. */
export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

/** El nivel configurado, que además puede apagarlo todo. */
export type LogSetting = LogLevel | 'silent';

/**
 * Puerto de registro. **El único sitio del proyecto autorizado a escribir en la consola es su
 * adaptador** (`ConsoleLogger`); en el resto del código `console.*` está prohibido por ESLint.
 *
 * Por qué un servicio y no `console` a pelo: un `console.log` suelto no se puede apagar, ni filtrar,
 * ni cambiar de destino (mañana, un panel dentro del juego o un fichero). Con un puerto, el modo
 * depuración es un interruptor y no hay que peinar el código para silenciarlo.
 *
 * Vive en el shared kernel, junto al `EventBus`, porque `core/` también registra y **no puede
 * importar de `platform/`**.
 *
 * `context` es el dato que acompaña al mensaje (un objeto, el error capturado, un id). Se pasa como
 * argumento y no interpolado en el texto: así la consola lo muestra expandible en vez de como
 * `[object Object]`.
 */
export abstract class Logger {
  /** El detalle del funcionamiento interno: solo interesa cuando estás depurando. */
  abstract debug(message: string, context?: unknown): void;
  /** Un hecho normal que merece rastro (algo se guardó, alguien entró). */
  abstract info(message: string, context?: unknown): void;
  /** Algo no salió como se esperaba pero el sistema sigue (un dato legacy que se omite). */
  abstract warn(message: string, context?: unknown): void;
  /** Algo falló. */
  abstract error(message: string, context?: unknown): void;

  /** Un logger hijo que prefija todos sus mensajes con `[scope]`. Comparte el nivel del padre. */
  abstract scoped(scope: string): Logger;

  /** Qué se registra a partir de ahora. Se recuerda entre recargas. */
  abstract setLevel(level: LogSetting): void;

  /** El nivel vigente. */
  abstract get level(): LogSetting;
}
