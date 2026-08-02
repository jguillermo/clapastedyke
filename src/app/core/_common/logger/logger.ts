import { InjectionToken } from '@angular/core';

/**
 * Los cuatro niveles. **No son una escala configurable**: `error`, `warn` e `info` salen siempre, y
 * `debug` se ve o no según {@link LOG_DEBUG} (ver {@link Logger}). No hay un umbral que elegir ni
 * niveles intermedios que activar.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ¿Se emite `debug`? **La única decisión que hay sobre el registro**, y llega por DI.
 *
 * La pone `provideLogger(debug)` desde `app.config.ts`, con lo que dijo `public/config.json`. El
 * adaptador no sabe de dónde salió: no importa `AppConfig` ni conoce la forma del fichero, solo
 * recibe un booleano — así el registro se puede montar en un test, o mañana en otro contexto, sin
 * arrastrar la configuración entera.
 *
 * **Su defecto es `false`**, para que un `TestBed` que no lo declare no reviente y no llene la
 * salida de los tests con la traza del flujo.
 */
export const LOG_DEBUG = new InjectionToken<boolean>('migo.log.debug', { factory: () => false });

/**
 * El dato estructurado que acompaña al mensaje. **Siempre un objeto**, nunca interpolado en el
 * texto: así la consola lo pinta expandible y un adaptador futuro puede serializarlo.
 *
 * ```typescript
 * this.log.debug('receta guardada', { id: recipeId.value, ingredientes: lines.length });
 * ```
 */
export type LogContext = Readonly<Record<string, unknown>>;

/**
 * Puerto de registro. **El único sitio del proyecto autorizado a escribir en la consola es su
 * adaptador** (`ConsoleLogger`); en el resto del código `console.*` está prohibido por ESLint.
 *
 * Por qué un servicio y no `console` a pelo: un `console.log` suelto no se puede apagar, ni filtrar,
 * ni cambiar de destino (mañana, un panel dentro del juego o un fichero). Con un puerto, apagar
 * `debug` es una línea de configuración y no hay que peinar el código.
 *
 * Vive en el shared kernel, junto al `EventBus`, porque `core/` también registra y **no puede
 * importar de `platform/`**. Lo usan `core/`, `features/` y `platform/`; **`components/` no registra
 * nunca** —la librería de diseño no importa nada de la app—. Ver
 * [logging-conventions.md](../../../../../.claude/rules/logging-conventions.md).
 *
 * ## Una sola decisión, y está en `public/config.json`
 *
 * 1. **`error`, `warn` e `info` se ven siempre.** No hay nada que los apague.
 * 2. **`debug` se ve si `"debug": true`** en `public/config.json`. Es lo **único** configurable del
 *    registro: no hay umbral de nivel, ni interruptor de runtime, ni estado guardado en el navegador.
 *
 * **El build es uno solo**: se cambia el fichero servido y se recarga: ni recompilar, ni republicar,
 * ni un artefacto distinto por entorno.
 *
 * ## La firma es asimétrica a propósito
 *
 * `debug` lleva **datos**; `warn` y `error` llevan **la cosa que falló**, en su propia ranura, para
 * que la consola pinte la pila y la cadena `cause`. Meter el error dentro del objeto de contexto lo
 * degrada a una propiedad anidada y se pierden los frames pinchables.
 *
 * ```typescript
 * private readonly log = inject(Logger).scoped('recipe-book/save-recipe');
 *
 * this.log.debug('guardando receta', { id, ingredientes: lines.length });
 * this.log.warn('no se pudo sembrar la receta', error, { id });
 * ```
 */
export abstract class Logger {
  /** El detalle del flujo. **Se ve solo si `public/config.json` dice `"debug": true`.** */
  abstract debug(message: string, context?: LogContext): void;

  /**
   * Un hito del que hay que dejar constancia **también fuera de desarrollo**, sin que nada vaya mal:
   * la app arrancó, la sesión se cerró, la sincronización terminó. **Siempre visible.**
   *
   * No es «un `debug` importante»: si solo interesa mientras desarrollas, es `debug`. Y si el usuario
   * recibe menos de lo que pidió, es `warn`.
   */
  abstract info(message: string, context?: LogContext): void;

  /**
   * Algo no salió como se esperaba pero el sistema sigue: un dato legacy que se omite, un fallback
   * que se toma. **Siempre visible, también en producción.**
   *
   * Si vienes de un `catch`, el error capturado va en `cause`, nunca interpolado en el mensaje.
   */
  abstract warn(message: string, cause?: unknown, context?: LogContext): void;

  /** Algo falló. **Siempre visible, también en producción**, y siempre con pila. */
  abstract error(message: string, cause?: unknown, context?: LogContext): void;

  /** Un logger hijo que prefija todos sus mensajes con `[scope]`. Encadenable. */
  abstract scoped(scope: string): Logger;
}
