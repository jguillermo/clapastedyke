import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideEventBus } from '@core/_common/event-bus.providers';
import { provideRecipeBook } from '@core/recipe-book/recipe-book.providers';
import { provideProgression } from '@core/progression/progression.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideEventBus(),
    provideRecipeBook(),
    provideProgression()
  ]
};
