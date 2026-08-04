/**
 * Un trozo de texto que el usuario tiene que **llevarse a otro sitio** para poner en marcha el
 * destino: pegarlo en un editor, en una propiedad de configuración o en un formulario.
 *
 * El dominio no sabe qué es cada uno ni dónde se pega —eso lo cuenta la pantalla—; solo que hay un
 * puñado de valores que el destino necesita y que salen de la configuración del despliegue.
 */
export interface SetupSnippet {
  /** Identidad estable con la que la pantalla lo coloca en su paso. */
  id: SetupSnippetId;
  /** El texto, listo para copiar. Vacío = no se pudo resolver (fichero ausente, dato sin poner). */
  value: string;
}

/**
 * Lo que el destino necesita para quedar montado. Son identidades del **proceso de puesta en
 * marcha**, no de la tecnología: quien cambie de destino traerá los suyos y la pantalla se ajusta.
 */
export type SetupSnippetId =
  /** El código que hay que pegar en el editor del destino. */
  | 'script'
  /** El manifiesto que acompaña a ese código. */
  | 'manifest'
  /** El identificador de la app, que el destino tiene que aceptar. */
  | 'clientId'
  /** El origen desde el que se sirve esta app, que el proveedor tiene que autorizar. */
  | 'origin'
  /** La dirección del destino ya desplegado; vacía mientras no se haya configurado. */
  | 'endpoint';

export interface SyncSetup {
  snippets: readonly SetupSnippet[];
  /**
   * `true` cuando no queda nada por configurar en el despliegue. No dice que funcione —eso solo lo
   * demuestra la comprobación de ida y vuelta—, solo que ya se puede intentar.
   */
  configured: boolean;
}
