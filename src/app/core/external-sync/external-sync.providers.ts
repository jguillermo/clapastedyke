import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideEventHandlers } from '@core/_common/eventbus/event-bus.providers';
import { NotifyRecipeSaved } from './application/use-cases/notify-recipe-saved.use-case';
import { NotifySupplySaved } from './application/use-cases/notify-supply-saved.use-case';
import { SyncGateway } from './domain/services/sync.gateway';
import { SyncOutbox } from './domain/services/sync-outbox';
import { SyncSetupSource } from './domain/services/sync-setup-source';
import { SyncStatus } from './domain/services/sync-status';
import { AppsScriptSetupSource } from './infrastructure/apps-script-setup-source';
import { AppsScriptSyncGateway } from './infrastructure/apps-script-sync.gateway';
import { IndexeddbSyncOutbox } from './infrastructure/indexeddb-sync-outbox';
import { InMemorySyncStatus } from './infrastructure/in-memory-sync-status';
import { AuthChangedSubscriber } from './infrastructure/auth-changed.subscriber';
import { RecipeBookChangedSubscriber } from './infrastructure/recipe-book-changed.subscriber';

/**
 * DI del contexto `external-sync`. **Aquí se decide el destino**: hoy una hoja de cálculo vía Apps
 * Script; cambiarlo es escribir otro `SyncGateway` y tocar esa línea.
 *
 * El **origen** no se decide aquí: lo aporta quien posee los datos, implementando el contrato
 * `ExportableData` del shared kernel (hoy lo hace `recipe-book`). Así este contexto no conoce a
 * nadie: ni de dónde vienen las filas ni quién le manda los eventos.
 *
 * **La cola es lo único de este contexto que se persiste**, en su propio store de IndexedDB: es
 * trabajo pendiente, y perderlo al recargar significa perder cambios del usuario. El estado sí vive
 * en memoria a propósito — es de la sesión, y una sesión no sobrevive a la recarga.
 *
 * Los dos app-initializers registran las suscripciones al arrancar; sin ellos la app funciona igual,
 * solo que sin sincronizar — la integración es un añadido desacoplado, no una dependencia del
 * recetario.
 */
/**
 * Los casos de uso de este contexto que se disparan con un evento. Se exporta para que el test de
 * integración enganche **exactamente esta lista**: si alguien añade uno aquí y se olvida del test —o
 * al revés— el test deja de demostrar lo que dice demostrar.
 */
export const EVENT_DRIVEN_USE_CASES = [NotifyRecipeSaved, NotifySupplySaved];

export function provideExternalSync(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SyncGateway, useClass: AppsScriptSyncGateway },
    // La ceremonia de puesta en marcha del mismo destino: qué hay que pegar y dónde. Va aparte
    // porque es la conversación de ANTES, la que tiene una persona con la consola de su proveedor.
    { provide: SyncSetupSource, useClass: AppsScriptSetupSource },
    { provide: SyncOutbox, useClass: IndexeddbSyncOutbox },
    { provide: SyncStatus, useClass: InMemorySyncStatus },
    provideAppInitializer(() => inject(RecipeBookChangedSubscriber).register()),
    provideAppInitializer(() => inject(AuthChangedSubscriber).register()),
    // Los casos de uso que reaccionan a un evento: aquí solo se registra la suscripción que cada uno
    // declaró con `@OnEvent`. Ninguno se construye hasta que llega su evento.
    provideEventHandlers(...EVENT_DRIVEN_USE_CASES),
  ]);
}
