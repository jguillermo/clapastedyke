import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideViewport } from './viewport/viewport.providers';

/** Agrega los providers de la capa `platform/` (mecanismos técnicos transversales). */
export function providePlatform(): EnvironmentProviders {
  return makeEnvironmentProviders([provideViewport()]);
}
