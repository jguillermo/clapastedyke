import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAppConfig } from '@core/_common/infrastructure/config/app-config.providers';
import { provideLogger } from '@core/_common/logger/logger.providers';
import { provideEventBus, provideEventTracing } from '@core/_common/eventbus/event-bus.providers';
import { provideRecipeBook } from '@core/recipe-book/recipe-book.providers';
import { provideAuth } from '@core/auth/auth.providers';
import { provideExternalSync } from '@core/external-sync/external-sync.providers';
import { providePlatform } from '@platform/platform.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // El registro va el primero de todos: cualquier otra cosa puede querer registrar al arrancar.
    // Está callado salvo que se encienda a pedido en desarrollo (`migoLog.on()`).
    provideLogger(),
    // La configuración va primero: la autenticación y la sincronización leen de ella.
    provideAppConfig(),
    provideEventBus(),
    // Diagnóstico: deja en consola todos los eventos que se reparten. Quitar esta línea lo apaga.
    provideEventTracing(),
    provideRecipeBook(),
    provideAuth(),
    provideExternalSync(),
    providePlatform(),
  ],
};
