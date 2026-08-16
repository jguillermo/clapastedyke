/**
 * Si en **este navegador** se conectó alguna vez una cuenta.
 *
 * ## Por qué es una pregunta aparte de «¿hay sesión ahora?»
 *
 * `CredentialsProvider.current()` contesta lo de **ahora**, y para contestarlo puede tener que hablar
 * con el proveedor de identidad: sin red devuelve `null` aunque este navegador lleve meses conectado.
 * Eso lo hace inservible para decidir cosas que dependen del pasado, porque diría «nunca hubo cuenta»
 * cada vez que el usuario abra la app en un avión.
 *
 * Esta pregunta se contesta **en local y sin red**, y su respuesta no cambia porque haya o no cobertura.
 *
 * ## Para qué se usa
 *
 * Para que la app no siembre datos de ejemplo encima de datos de verdad. Quien tiene una cuenta
 * conectada tiene su catálogo en otro sitio, y ese sitio es el que manda: meterle un recetario de
 * demostración sería añadirle basura que además viajaría a su hoja.
 *
 * Vive en el shared kernel porque la pregunta la hace un contexto y la contesta otro, y los dos no se
 * conocen: quien guarda de qué cuenta se trata es la autenticación; quien decide si sembrar es el
 * recetario.
 */
export abstract class AccountHistory {
  /**
   * `true` si alguna cuenta llegó a conectarse aquí, **aunque ahora no haya sesión abierta**.
   *
   * Cerrar sesión la devuelve a `false`: pedirlo explícitamente es decir «este navegador vuelve a ser
   * de nadie», y a partir de ahí la app puede volver a comportarse como recién instalada.
   */
  abstract everConnected(): Promise<boolean>;
}
