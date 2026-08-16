import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { BootSync } from './application/use-cases/boot-sync.use-case';
import { SyncTargetRepository } from './domain/repositories/sync-target.repository';
import { DeviceIdentity } from './domain/services/device-identity';
import { SyncCoordinator } from './domain/services/sync-coordinator';
import { SyncGateway } from './domain/services/sync.gateway';
import { SyncOutbox } from './domain/services/sync-outbox';
import { LocalRepository } from './domain/repositories/local.repository';
import { RemoteRepository } from './domain/repositories/remote.repository';
import { SyncShadow } from './domain/services/sync-shadow';
import { SyncStatus } from './domain/services/sync-status';
import { GoogleSheetsGateway } from './infrastructure/google-sheets.gateway';
import { IndexedDbLocalRepository } from './infrastructure/indexeddb-local.repository';
import { GoogleSheetsRemoteRepository } from './infrastructure/sheets/google-sheets-remote.repository';
import { IndexedDbDeviceIdentity } from './infrastructure/indexeddb-device-identity';
import { IndexedDbSyncShadow } from './infrastructure/indexeddb-sync-shadow';
import { IndexedDbSyncTargetRepository } from './infrastructure/indexeddb-sync-target.repository';
import { IndexeddbSyncOutbox } from './infrastructure/indexeddb-sync-outbox';
import { InMemorySyncStatus } from './infrastructure/in-memory-sync-status';
import { SyncScheduler } from './infrastructure/sync-scheduler';
import { WebLocksSyncCoordinator } from './infrastructure/web-locks-sync-coordinator';
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
export function provideExternalSync(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SyncGateway, useClass: GoogleSheetsGateway },
    // Leer es un puerto aparte del de escribir: hay código que solo lee, y le viene bien no poder
    // escribir ni por accidente. Ver `sync-reader.ts`.
    { provide: LocalRepository, useClass: IndexedDbLocalRepository },
    { provide: RemoteRepository, useClass: GoogleSheetsRemoteRepository },
    { provide: SyncShadow, useClass: IndexedDbSyncShadow },
    { provide: SyncTargetRepository, useClass: IndexedDbSyncTargetRepository },
    { provide: SyncOutbox, useClass: IndexeddbSyncOutbox },
    { provide: SyncStatus, useClass: InMemorySyncStatus },
    { provide: DeviceIdentity, useClass: IndexedDbDeviceIdentity },
    { provide: SyncCoordinator, useClass: WebLocksSyncCoordinator },
    provideAppInitializer(() => inject(RecipeBookChangedSubscriber).register()),
    provideAppInitializer(() => inject(AuthChangedSubscriber).register()),
    // El planificador decide CUÁNDO se sincroniza. Se arranca aquí y no se espera: pide su turno entre
    // pestañas y programa sus disparadores, pero el arranque de la app no depende de la red.
    provideAppInitializer(() => inject(SyncScheduler).start()),
    // La puerta de arranque SÍ se espera: es lo que hace que, con conexión, se trabaje sobre lo que hay
    // en la hoja y no sobre lo de la última vez. Trae su propio plazo, así que no puede colgar el
    // arranque, y nunca lanza. Ver `BootSync`.
    provideAppInitializer(() => inject(BootSync).execute()),
  ]);
}
