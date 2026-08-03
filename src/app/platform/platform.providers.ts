import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideErrorHandling } from './error/error.providers';
import { provideViewport } from './viewport/viewport.providers';

/** Agrega los providers de la capa `platform/` (mecanismos técnicos transversales). */
export function providePlatform(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // El primero: recoge por el puerto `Logger` todo lo que nadie capturó.
    provideErrorHandling(),
    provideViewport(),
  ]);
}
