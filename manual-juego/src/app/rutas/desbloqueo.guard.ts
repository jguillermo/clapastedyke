import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameStateService } from '../estado/game-state.service';

/**
 * Nunca se puede saltar a un paso futuro; siempre se puede volver a uno
 * completado. Un paso bloqueado redirige al paso actual del juego.
 */
export const desbloqueoGuard: CanActivateFn = route => {
  const estado = inject(GameStateService);
  const router = inject(Router);

  const pasoId = route.paramMap.get('pasoId') ?? '';
  if (estado.estaDesbloqueado(pasoId)) return true;

  const actual = estado.pasoActual();
  if (!actual) return router.parseUrl('/mapa');
  const mision = estado.misionDe(actual.id);
  return router.parseUrl(`/mision/${mision?.id}/${actual.id}`);
};

/** `mision/:misionId` redirige al primer paso pendiente de esa misión. */
export const redirigirMisionGuard: CanActivateFn = route => {
  const estado = inject(GameStateService);
  const router = inject(Router);

  const misionId = route.paramMap.get('misionId') ?? '';
  const destino = estado.pasoDestinoDeMision(misionId);
  if (destino && estado.estaDesbloqueado(destino.id)) {
    return router.parseUrl(`/mision/${misionId}/${destino.id}`);
  }
  return router.parseUrl('/mapa');
};
