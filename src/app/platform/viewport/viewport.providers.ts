import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { ViewportService } from './viewport.service';

/** Arranca el seguimiento del visual viewport al bootstrap (variables `--vvh`/`--vvt` en `:root`). */
export function provideViewport(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => inject(ViewportService).start()),
  ]);
}
