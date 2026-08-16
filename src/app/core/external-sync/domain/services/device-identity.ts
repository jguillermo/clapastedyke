/**
 * Quién es **este** navegador, para poder desempatar conflictos.
 *
 * ## Por qué hace falta
 *
 * Cuando dos dispositivos cambian la misma fila en el mismo milisegundo, la marca de tiempo no decide.
 * Alguien tiene que, y la decisión debe ser **la misma en las dos máquinas**: si cada una se creyera
 * ganadora, se escribirían encima la una de la otra sin converger nunca. Comparar los identificadores
 * de dispositivo resuelve el empate de forma idéntica en todas partes.
 *
 * ## Lo que NO es
 *
 * No identifica a la persona ni sirve para reconocerla. Es un número aleatorio del navegador, sin
 * relación con la cuenta: se regenera al borrar los datos del sitio, y lo único que sale de aquí es su
 * aparición dentro de la versión de cada fila. Por eso vive en este contexto y no en `auth`.
 *
 * ## La forma importa
 *
 * **No puede contener guiones.** La versión de una fila es `instante-contador-dispositivo` y se lee
 * partiendo por guiones, así que un UUID entero (que los lleva) rompería el formato. Además se escribe
 * en una columna que el usuario ve, así que conviene que sea corto.
 */
export abstract class DeviceIdentity {
  /**
   * El identificador de este navegador, creándolo la primera vez. Estable entre recargas y pestañas
   * mientras no se borren los datos del sitio.
   */
  abstract current(): Promise<string>;
}
