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
export const DISABLE_WEBGL_SCRIPT = (): void => {
  const original = HTMLCanvasElement.prototype.getContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: any, ...rest: any[]) {
    if (typeof type === 'string' && type.toLowerCase().includes('webgl')) {
      return null;
    }
    return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};
