/**
 * Catálogo de **eventos de integración**: los nombres de evento que cruzan la frontera de un
 * bounded context.
 *
 * Existe porque **ningún contexto puede importar de otro** (ver `core-conventions.md` → «Los
 * contextos no se conocen»). Un suscriptor necesita el nombre exacto del evento al que se engancha;
 * si lo tomara del contexto que lo publica, ya habría dependencia. Al vivir aquí, en el shared
 * kernel, ambos lados dependen del contrato y ninguno del otro.
 *
 * Es el **Published Language** del sistema. Añadir un nombre aquí es un acto deliberado: significa
 * «este hecho es público y otros pueden reaccionar a él». Los eventos que un contexto usa solo para
 * sí mismo NO se ponen aquí, se quedan en su carpeta `domain/events/`.
 *
 * La forma del payload la documenta cada factoría, en el contexto que publica.
 */
export const IntegrationEventName = {
  // ── Publica: recipe-book ─────────────────────────────────────────────────────
  /**
   * Un hecho por agregado: **se guardó**. No hay `*Created`/`*Updated` porque en este sistema no
   * existe crear ni actualizar, solo **persistir**: si el agregado no estaba se crea, si estaba se
   * actualiza, y por fuera no hay ninguna diferencia. Distinguirlas obligaría a quien publica a
   * mirar el estado anterior para contar algo que nadie necesita.
   */
  SUPPLY_SAVED: 'SupplySaved',
  RECIPE_SAVED: 'RecipeSaved',
  RECIPE_CATEGORY_SAVED: 'RecipeCategorySaved',
  FLAVOR_SAVED: 'FlavorSaved',
  RECIPE_CAPACITY_SAVED: 'RecipeCapacitySaved',

  // ── Publica: auth ────────────────────────────────────────────────────────────
  AUTHENTICATION_SUCCEEDED: 'AuthenticationSucceeded',
  /**
   * La misma cuenta de siempre ha vuelto sin que nadie pulse nada (una recarga, típicamente). **No
   * es lo mismo que entrar**: quien escuche no debe tirar lo que quedara pendiente, porque es de esta
   * misma persona.
   */
  SESSION_RESUMED: 'SessionResumed',
  AUTHENTICATION_FAILED: 'AuthenticationFailed',
  /**
   * El único final de salir. No hay `SignOutFailed`: la sesión local solo se cierra cuando el
   * servicio de sesión ha confirmado que cerró la suya, así que «salió a medias» no existe.
   */
  SIGN_OUT_SUCCEEDED: 'SignOutSucceeded',

  // ── Publica: external-sync ───────────────────────────────────────────────────
  DATA_SYNCED: 'DataSynced',
  DATA_SYNC_FAILED: 'DataSyncFailed',
} as const;
