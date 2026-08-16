/**
 * La única excepción a «guardar es cambiar el dato».
 *
 * Toda escritura en la base local deja **fecha de actualización**, y es el repositorio quien la pone
 * al guardar: por ahí pasan todas, así que ni el caso de uso ni el agregado tienen que acordarse. Esa
 * fecha es lo que permite decidir quién gana cuando el mismo dato cambió aquí y en la hoja.
 *
 * El **seed** es lo único que no encaja en esa frase. Sembrar no es un cambio del usuario: son los
 * datos que vienen con la app, y nadie los ha tocado. Ponerles la hora de arranque sería mentir, y la
 * mentira tiene consecuencias — al ser la fecha más reciente del sistema, la fábrica de un navegador
 * recién abierto **le ganaba a la hoja** y pisaba el trabajo de quien la había estado usando.
 *
 * Así que el seed guarda **sin fecha**, y la ausencia pasa a significar algo:
 *
 * > una fila sin fecha de actualización es dato de fábrica que nadie ha tocado, y se considera
 * > anterior a cualquier otra.
 *
 * El motor de sincronización ya lee eso así sin que haya que enseñarle nada: una versión que no se
 * puede interpretar es `null`, y frente a un lado con fecha **gana el que la tiene**. En cuanto los
 * dos lados se ponen de acuerdo sobre esa fila, el ciclo le escribe la fecha acordada y deja de ser
 * de fábrica para siempre.
 */
export interface SaveOptions {
  /**
   * `false` → se guarda **sin** fecha de actualización. Solo lo usa el seed.
   *
   * Omitirlo es lo normal y estampa la hora: cualquier guardado que venga de una acción del usuario
   * tiene que dejar constancia de cuándo ocurrió.
   */
  readonly stamp?: boolean;
}
