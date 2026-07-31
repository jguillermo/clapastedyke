import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAppConfig } from '@core/_common/infrastructure/config/app-config.providers';
import { provideEventBus } from '@core/_common/eventbus/event-bus.providers';
import { provideRecipeBook } from '@core/recipe-book/recipe-book.providers';
import { provideAuth } from '@core/auth/auth.providers';
import { provideExternalSync } from '@core/external-sync/external-sync.providers';
import { providePlatform } from '@platform/platform.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // La configuración va primero: la autenticación y la sincronización leen de ella.
    provideAppConfig(),
    provideEventBus(),
    provideRecipeBook(),
    provideAuth(),
    provideExternalSync(),
    providePlatform(),
  ],
};
