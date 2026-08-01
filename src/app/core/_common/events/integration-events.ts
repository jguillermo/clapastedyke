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
  SUPPLY_SAVED: 'SupplySaved',
  RECIPE_SAVED: 'RecipeSaved',
  /**
   * El alta y la edición, por separado. `SupplySaved`/`RecipeSaved` siguen anunciando «esto cambió,
   * da igual cómo» —es lo que necesita quien solo tiene que volver a copiar el dato—; estos dos
   * distinguen **crear** de **editar** para quien sí reacciona distinto (dar la bienvenida a un
   * insumo nuevo no es lo mismo que enterarse de que subió de precio). Un guardado publica los dos:
   * el genérico y el específico.
   */
  SUPPLY_CREATED: 'SupplyCreated',
  SUPPLY_UPDATED: 'SupplyUpdated',
  RECIPE_CREATED: 'RecipeCreated',
  RECIPE_UPDATED: 'RecipeUpdated',
  RECIPE_CATEGORY_SAVED: 'RecipeCategorySaved',
  FLAVOR_SAVED: 'FlavorSaved',
  RECIPE_CAPACITY_SAVED: 'RecipeCapacitySaved',

  // ── Publica: auth ────────────────────────────────────────────────────────────
  AUTHENTICATION_SUCCEEDED: 'AuthenticationSucceeded',
  AUTHENTICATION_FAILED: 'AuthenticationFailed',
  SIGN_OUT_SUCCEEDED: 'SignOutSucceeded',
  SIGN_OUT_FAILED: 'SignOutFailed',

  // ── Publica: external-sync ───────────────────────────────────────────────────
  DATA_SYNCED: 'DataSynced',
  DATA_SYNC_FAILED: 'DataSyncFailed',
} as const;
