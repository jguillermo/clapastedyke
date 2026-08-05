import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideEventHandlers } from '@core/_common/eventbus/event-bus.providers';
import { NotifyRecipeSaved } from './application/use-cases/notify-recipe-saved.use-case';
import { NotifySupplySaved } from './application/use-cases/notify-supply-saved.use-case';
import { SyncTargetRepository } from './domain/repositories/sync-target.repository';
import { DeviceIdentity } from './domain/services/device-identity';
import { SyncGateway } from './domain/services/sync.gateway';
import { SyncOutbox } from './domain/services/sync-outbox';
import { SyncStatus } from './domain/services/sync-status';
import { GoogleSheetsGateway } from './infrastructure/google-sheets.gateway';
import { IndexedDbDeviceIdentity } from './infrastructure/indexeddb-device-identity';
import { IndexedDbSyncTargetRepository } from './infrastructure/indexeddb-sync-target.repository';
import { IndexeddbSyncOutbox } from './infrastructure/indexeddb-sync-outbox';
import { InMemorySyncStatus } from './infrastructure/in-memory-sync-status';
import { AuthChangedSubscriber } from './infrastructure/auth-changed.subscriber';
import { RecipeBookChangedSubscriber } from './infrastructure/recipe-book-changed.subscriber';

/**
 * DI del contexto `external-sync`. **Aquí se decide el destino**: hoy, una hoja de cálculo en el
 * Drive del usuario, escrita por la propia app con las APIs de Sheets y Drive. Cambiarlo es escribir
 * otro `SyncGateway` y tocar esa línea.
 *
 * No hay nada que desplegar ni que instalar en la cuenta de nadie: el usuario concede un permiso
 * (`drive.file`, que solo alcanza los ficheros que la app crea) y la app hace el resto.
 *
 * El **origen** no se decide aquí: lo aporta quien posee los datos, implementando el contrato
 * `ExportableData` del shared kernel (hoy lo hace `recipe-book`). Así este contexto no conoce a
 * nadie: ni de dónde vienen las filas ni quién le manda los eventos.
 *
 * **Tres cosas se persisten**: la cola (trabajo pendiente, perderlo es perder cambios del usuario),
 * dónde tiene su hoja cada cuenta (sin eso, cada recarga crearía una hoja nueva en su Drive) y qué
 * dispositivo es este navegador (con el que se desempatan los conflictos simultáneos; si cambiara en
 * cada recarga, dos dispositivos podrían no converger nunca). El estado sí vive en memoria a
 * propósito — es de la sesión, y una sesión no sobrevive a la recarga.
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
    { provide: SyncGateway, useClass: GoogleSheetsGateway },
    { provide: SyncTargetRepository, useClass: IndexedDbSyncTargetRepository },
    { provide: SyncOutbox, useClass: IndexeddbSyncOutbox },
    { provide: SyncStatus, useClass: InMemorySyncStatus },
    { provide: DeviceIdentity, useClass: IndexedDbDeviceIdentity },
    provideAppInitializer(() => inject(RecipeBookChangedSubscriber).register()),
    provideAppInitializer(() => inject(AuthChangedSubscriber).register()),
    // Los casos de uso que reaccionan a un evento: aquí solo se registra la suscripción que cada uno
    // declaró con `@OnEvent`. Ninguno se construye hasta que llega su evento.
    provideEventHandlers(...EVENT_DRIVEN_USE_CASES),
  ]);
}
