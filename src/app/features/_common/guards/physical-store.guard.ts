import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GetProgress } from '../../../core/progression/application/get-progress/get-progress';
import { Feature } from '../../../core/progression/domain/feature';

/**
 * Protege el mundo del pueblo (`/town`): solo accesible cuando la tienda física
 * está desbloqueada (Fase 4). Si no, redirige a la cocina (`/home`).
 */
export const physicalStoreGuard: CanActivateFn = async () => {
  const progress = inject(GetProgress);
  const router = inject(Router);
  const snapshot = await progress.execute();
  return snapshot.unlockedFeatures.includes(Feature.PHYSICAL_STORE)
    ? true
    : router.createUrlTree(['/home']);
};
