import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameStateService } from '../estado/game-state.service';
import { PASOS_PLANOS } from '../modelo/contenido';
import { desbloqueoGuard } from './desbloqueo.guard';

function snapshotCon(pasoId: string): ActivatedRouteSnapshot {
  return { paramMap: new Map([['pasoId', pasoId]]) } as unknown as ActivatedRouteSnapshot;
}

function ejecutarGuard(pasoId: string): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    desbloqueoGuard(snapshotCon(pasoId), {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('desbloqueoGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('deja pasar al primer paso y bloquea los futuros', () => {
    expect(ejecutarGuard(PASOS_PLANOS[0].id)).toBe(true);

    const redirigido = ejecutarGuard(PASOS_PLANOS[5].id);
    expect(redirigido).toBeInstanceOf(UrlTree);
    // Redirige al paso actual del juego (el primero, aún sin completar).
    expect(redirigido.toString()).toContain(PASOS_PLANOS[0].id);
  });

  it('tras completar, desbloquea el siguiente y mantiene el anterior accesible', () => {
    const estado = TestBed.inject(GameStateService);
    estado.completar(PASOS_PLANOS[0].id);

    expect(ejecutarGuard(PASOS_PLANOS[1].id)).toBe(true);
    expect(ejecutarGuard(PASOS_PLANOS[0].id)).toBe(true); // volver atrás, siempre
    expect(ejecutarGuard(PASOS_PLANOS[2].id)).toBeInstanceOf(UrlTree); // saltar, nunca
  });

  it('un paso inexistente redirige', () => {
    expect(ejecutarGuard('no-existe')).toBeInstanceOf(UrlTree);
  });
});
