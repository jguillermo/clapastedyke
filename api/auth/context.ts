/** Lo que cada ruta necesita saber de la petición más allá de su cuerpo. */
export interface RouteContext {
  /**
   * Si la cookie de sesión debe llevar `Secure`.
   *
   * En producción siempre, porque Hosting sirve por HTTPS. En el emulador sobre `http://localhost`
   * no, o Safari se negaría a guardarla y el ciclo entero sería imposible de probar en local.
   */
  secure: boolean;
}
