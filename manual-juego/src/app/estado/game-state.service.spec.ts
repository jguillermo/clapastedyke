import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PASOS_PLANOS, VERSION_CONTENIDO } from '../modelo/contenido';
import { GameStateService } from './game-state.service';

const CLAVE = 'misa.juego.progreso.v1';

function nuevoServicio(): GameStateService {
  TestBed.resetTestingModule();
  return TestBed.inject(GameStateService);
}

describe('GameStateService', () => {
  beforeEach(() => localStorage.clear());

  it('arranca en el primer paso, con solo ese desbloqueado', () => {
    const s = nuevoServicio();
    expect(s.pasoActual()?.id).toBe(PASOS_PLANOS[0].id);
    expect(s.estaDesbloqueado(PASOS_PLANOS[0].id)).toBe(true);
    expect(s.estaDesbloqueado(PASOS_PLANOS[1].id)).toBe(false);
    expect(s.estaDesbloqueado(PASOS_PLANOS.at(-1)!.id)).toBe(false);
  });

  it('completar avanza al siguiente paso y nunca permite saltar', () => {
    const s = nuevoServicio();
    // Intento de saltar: completar un paso futuro no hace nada.
    s.completar(PASOS_PLANOS[3].id);
    expect(s.estaCompletado(PASOS_PLANOS[3].id)).toBe(false);

    s.completar(PASOS_PLANOS[0].id);
    expect(s.pasoActual()?.id).toBe(PASOS_PLANOS[1].id);
    expect(s.estaDesbloqueado(PASOS_PLANOS[1].id)).toBe(true);
    expect(s.estaDesbloqueado(PASOS_PLANOS[2].id)).toBe(false);
    // El completado sigue accesible (volver atrás siempre se puede).
    expect(s.estaDesbloqueado(PASOS_PLANOS[0].id)).toBe(true);
  });

  it('persiste y recarga el progreso desde localStorage', () => {
    const s1 = nuevoServicio();
    s1.completar(PASOS_PLANOS[0].id);
    s1.completar(PASOS_PLANOS[1].id);
    TestBed.tick(); // dispara el effect de persistencia

    const s2 = nuevoServicio();
    expect(s2.estaCompletado(PASOS_PLANOS[0].id)).toBe(true);
    expect(s2.estaCompletado(PASOS_PLANOS[1].id)).toBe(true);
    expect(s2.pasoActual()?.id).toBe(PASOS_PLANOS[2].id);
  });

  it('descarta el progreso si la versión del contenido cambió', () => {
    localStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: VERSION_CONTENIDO - 1,
        pasosCompletados: [PASOS_PLANOS[0].id],
        ultimoPaso: null,
      }),
    );
    const s = nuevoServicio();
    expect(s.estaCompletado(PASOS_PLANOS[0].id)).toBe(false);
    expect(s.pasoActual()?.id).toBe(PASOS_PLANOS[0].id);
  });

  it('sobrevive a un JSON corrupto', () => {
    localStorage.setItem(CLAVE, '{esto no es json');
    const s = nuevoServicio();
    expect(s.pasoActual()?.id).toBe(PASOS_PLANOS[0].id);
  });

  it('reiniciar borra todo el progreso', () => {
    const s = nuevoServicio();
    s.completar(PASOS_PLANOS[0].id);
    s.reiniciar();
    expect(s.completadosTotal()).toBe(0);
    expect(s.pasoActual()?.id).toBe(PASOS_PLANOS[0].id);
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });

  it('calcula porcentajes y el último paso del nivel', () => {
    const s = nuevoServicio();
    expect(s.porcentajeGlobal()).toBe(0);
    expect(s.esUltimoDeNivel(PASOS_PLANOS[0].id)).toBe(false);
    expect(s.esUltimoDeNivel(PASOS_PLANOS.at(-1)!.id)).toBe(true);
    s.completar(PASOS_PLANOS[0].id);
    expect(s.porcentajeGlobal()).toBeGreaterThan(0);
  });
});
