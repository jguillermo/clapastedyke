import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { BaseUnit } from '@core/_common/quantity';
import type { CapacityGroup } from '../entities/recipe-capacity';
import { SupplyUsage } from '../value-objects/supply-usage';

/**
 * Catálogo de eventos de dominio del contexto recipe-book (§6.2). Nombres en pasado y payload de
 * **solo primitivos** (Published Language).
 *
 * **Los graba el propio agregado** en su factoría `create(...)`, no el caso de uso: el hecho «esta
 * receta se guardó» es del agregado, así que es él quien lo cuenta. El caso de uso solo persiste y
 * después saca la cola con `pullEvents()` para publicarla por el `EventBus`. La vía muda de
 * rehidratación es `restore(...)`, que **no** graba nada — por eso los mapeadores usan `restore` y
 * nunca `create` (si no, cada lectura de IndexedDB encolaría un evento falso).
 *
 * Hay **un solo evento por agregado**: `*Saved`. No existe crear-vs-actualizar (ver
 * `integration-events.ts`), así que tampoco existe `isNew` en el payload.
 *
 * **El payload lleva el estado completo del agregado**, aplanado a primitivos: quien reacciona tiene
 * ahí todo lo que necesita y no tiene que volver a preguntar. Es una decisión deliberada y tiene un
 * precio: un suscriptor puede reconstruir el modelo del recetario desde el evento, así que este
 * payload **es contrato público** — cambiar o quitar un campo rompe a quien lo consuma, igual que
 * cambiar una firma. El `aggregateId` sigue siendo el id del agregado que cambió y no se repite
 * dentro del payload.
 *
 * Los tipos de payload se exportan para que el agregado los construya con el compilador de su lado;
 * **un suscriptor de otro contexto no puede importarlos** (ver `core-conventions.md` → «Los contextos
 * no se conocen»), lee `event.data['campo']` contra este contrato documentado.
 *
 * Los nombres viven en el shared kernel porque **cruzan la frontera**: quien se suscribe no puede
 * importar de aquí.
 */

/** Un ingrediente tal y como viaja en el evento: insumo por id y cuánto, en su unidad base. */
export interface RecipeIngredientData {
  supplyId: string;
  quantity: number;
  unit: BaseUnit;
}

export interface RecipeSavedData {
  categoryId: string;
  name: string;
  ingredients: readonly RecipeIngredientData[];
  flavorId: string | null;
  portionsCapacityId: string | null;
  moldCapacityId: string | null;
}

export interface SupplySavedData {
  name: string;
  baseUnit: BaseUnit;
  usage: SupplyUsage;
  purchasePrice: {
    amount: number;
    currency: string;
    per: { value: number; unit: BaseUnit };
  };
}

export interface RecipeCategorySavedData {
  name: string;
}

export interface FlavorSavedData {
  label: string;
}

export interface RecipeCapacitySavedData {
  group: CapacityGroup;
  label: string;
  factor: number;
}

export const RecipeBookEvents = {
  supplySaved: (supplyId: string, data: SupplySavedData): DomainEvent =>
    domainEvent(IntegrationEventName.SUPPLY_SAVED, supplyId, data),
  recipeSaved: (recipeId: string, data: RecipeSavedData): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_SAVED, recipeId, data),
  recipeCategorySaved: (categoryId: string, data: RecipeCategorySavedData): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CATEGORY_SAVED, categoryId, data),
  flavorSaved: (flavorId: string, data: FlavorSavedData): DomainEvent =>
    domainEvent(IntegrationEventName.FLAVOR_SAVED, flavorId, data),
  recipeCapacitySaved: (capacityId: string, data: RecipeCapacitySavedData): DomainEvent =>
    domainEvent(IntegrationEventName.RECIPE_CAPACITY_SAVED, capacityId, data),
};
