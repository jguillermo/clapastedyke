/**
 * Anulación de WebGL para los tests que ejercitan la **ruta accesible en DOM**.
 *
 * Tanto `Home3d` como `RecipeBook3d` detectan el soporte con una prueba ligera
 * (`document.createElement('canvas').getContext('webgl2' | 'webgl')`). Devolviendo
 * `null` para cualquier contexto WebGL, la detección falla y ambas vistas
 * renderizan su fallback DOM — que es lo que queremos para los flujos de negocio:
 * determinista, sin GPU y muchísimo más rápido.
 *
 * Los contextos 2D siguen funcionando (los usa la textura del libro), así que la
 * anulación no rompe nada más.
 */
/**
 * Firma real de `getContext`. Está **sobrecargada** (una por tipo de contexto), así que un único
 * reemplazo no puede satisfacerla: se escribe con parámetros `unknown[]` y se reintroduce el tipo
 * original con un doble cast. Antes esto se resolvía con `any` + un `eslint-disable`, pero el
 * directive dependía de que la firma cupiera en una línea — al reformatear, dejaba de cubrirla.
 */
type GetContext = typeof HTMLCanvasElement.prototype.getContext;

export const DISABLE_WEBGL_SCRIPT = (): void => {
  const original = HTMLCanvasElement.prototype.getContext as (
    this: HTMLCanvasElement,
    ...args: unknown[]
  ) => unknown;

  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    ...args: unknown[]
  ): unknown {
    const [type] = args;
    if (typeof type === 'string' && type.toLowerCase().includes('webgl')) {
      return null;
    }
    return original.apply(this, args);
  } as unknown as GetContext;
};
