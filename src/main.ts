import { bootstrapApplication } from '@angular/platform-browser';
import { logBootstrapFailure } from '@core/_common/logger/console-logger';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// No se inyecta el `Logger`: si el arranque falla, el inyector no llegó a existir.
bootstrapApplication(App, appConfig).catch(logBootstrapFailure);
