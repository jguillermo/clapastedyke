import { Injectable, computed, effect, signal } from '@angular/core';
import {
  CONTENIDO,
  MISION_DE_PASO,
  NIVEL_DE_MISION,
  PASOS_PLANOS,
  VERSION_CONTENIDO,
} from '../modelo/contenido';
import { Dificultad, Nivel, Paso } from '../modelo/tutorial.types';

interface ProgresoGuardado {
  version: number;
  pasosCompletados: string[];
  ultimoPaso: string | null;
}

const CLAVE_PROGRESO = 'misa.juego.progreso.v1';

/** Índice global de cada paso, para calcular desbloqueos y porcentajes. */
const INDICE_DE_PASO = new Map<string, number>(PASOS_PLANOS.map((p, i) => [p.id, i]));

@Injectable({ providedIn: 'root' })
export class GameStateService {
  /** Ids de pasos completados. Único estado persistido. */
  private readonly completados = signal<ReadonlySet<string>>(this.cargar());

  /** Primer paso del orden global aún no completado; null si el juego está al 100%. */
  readonly pasoActual = computed<Paso | null>(() => {
    const hechos = this.completados();
    return PASOS_PLANOS.find(p => !hechos.has(p.id)) ?? null;
  });

  readonly totalPasos = PASOS_PLANOS.length;

  readonly completadosTotal = computed(() => this.completados().size);

  readonly porcentajeGlobal = computed(() =>
    Math.round((this.completados().size / this.totalPasos) * 100),
  );

  readonly juegoTerminado = computed(() => this.pasoActual() === null);

  constructor() {
    // Persistencia: cada cambio de progreso se escribe en localStorage.
    effect(() => {
      const datos: ProgresoGuardado = {
        version: VERSION_CONTENIDO,
        pasosCompletados: [...this.completados()],
        ultimoPaso: this.pasoActual()?.id ?? null,
      };
      try {
        localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(datos));
      } catch {
        // Modo incógnito o almacenamiento lleno: el juego sigue, sin persistir.
      }
    });
  }

  estaCompletado(pasoId: string): boolean {
    return this.completados().has(pasoId);
  }

  /**
   * Un paso está desbloqueado si todos los anteriores del orden global están
   * completados. Los completados quedan desbloqueados para siempre: se puede
   * volver atrás, nunca saltar adelante.
   */
  estaDesbloqueado(pasoId: string): boolean {
    const indice = INDICE_DE_PASO.get(pasoId);
    if (indice === undefined) return false;
    const hechos = this.completados();
    for (let i = 0; i < indice; i++) {
      if (!hechos.has(PASOS_PLANOS[i].id)) return false;
    }
    return true;
  }

  /** Marca un paso como completado. Solo se permite sobre pasos desbloqueados. */
  completar(pasoId: string): void {
    if (!this.estaDesbloqueado(pasoId) || this.estaCompletado(pasoId)) return;
    const nuevos = new Set(this.completados());
    nuevos.add(pasoId);
    this.completados.set(nuevos);
  }

  /** Borra todo el progreso (botón Reiniciar, con confirmación previa en la UI). */
  reiniciar(): void {
    this.completados.set(new Set());
    try {
      localStorage.removeItem(CLAVE_PROGRESO);
    } catch {
      /* sin almacenamiento, nada que borrar */
    }
  }

  /* ---------- Navegación entre pasos ---------- */

  pasoAnterior(pasoId: string): Paso | null {
    const indice = INDICE_DE_PASO.get(pasoId);
    return indice !== undefined && indice > 0 ? PASOS_PLANOS[indice - 1] : null;
  }

  pasoSiguiente(pasoId: string): Paso | null {
    const indice = INDICE_DE_PASO.get(pasoId);
    return indice !== undefined && indice < PASOS_PLANOS.length - 1
      ? PASOS_PLANOS[indice + 1]
      : null;
  }

  misionDe(pasoId: string) {
    return MISION_DE_PASO.get(pasoId);
  }

  nivelDe(misionId: string): Nivel | undefined {
    return NIVEL_DE_MISION.get(misionId);
  }

  /** ¿Este paso es el último de su nivel? (para celebrar el nivel completado) */
  esUltimoDeNivel(pasoId: string): boolean {
    const mision = MISION_DE_PASO.get(pasoId);
    if (!mision) return false;
    const nivel = NIVEL_DE_MISION.get(mision.id);
    if (!nivel) return false;
    const pasosDelNivel = nivel.misiones.flatMap(m => m.pasos);
    return pasosDelNivel[pasosDelNivel.length - 1]?.id === pasoId;
  }

  porcentajeNivel(nivelId: Dificultad): number {
    const nivel = CONTENIDO.find(n => n.id === nivelId);
    if (!nivel) return 0;
    const pasos = nivel.misiones.flatMap(m => m.pasos);
    if (!pasos.length) return 0;
    const hechos = this.completados();
    const completos = pasos.filter(p => hechos.has(p.id)).length;
    return Math.round((completos / pasos.length) * 100);
  }

  porcentajeMision(misionId: string): number {
    const mision = CONTENIDO.flatMap(n => n.misiones).find(m => m.id === misionId);
    if (!mision?.pasos.length) return 0;
    const hechos = this.completados();
    const completos = mision.pasos.filter(p => hechos.has(p.id)).length;
    return Math.round((completos / mision.pasos.length) * 100);
  }

  misionDesbloqueada(misionId: string): boolean {
    const mision = CONTENIDO.flatMap(n => n.misiones).find(m => m.id === misionId);
    return !!mision && this.estaDesbloqueado(mision.pasos[0].id);
  }

  /** Primer paso pendiente de una misión; si está completa, su primer paso. */
  pasoDestinoDeMision(misionId: string): Paso | null {
    const mision = CONTENIDO.flatMap(n => n.misiones).find(m => m.id === misionId);
    if (!mision) return null;
    const hechos = this.completados();
    return mision.pasos.find(p => !hechos.has(p.id)) ?? mision.pasos[0];
  }

  /* ---------- Carga inicial ---------- */

  private cargar(): ReadonlySet<string> {
    try {
      const crudo = localStorage.getItem(CLAVE_PROGRESO);
      if (!crudo) return new Set();
      const datos = JSON.parse(crudo) as ProgresoGuardado;
      // Contenido nuevo: el progreso viejo ya no significa lo mismo. Se descarta.
      if (datos.version !== VERSION_CONTENIDO || !Array.isArray(datos.pasosCompletados)) {
        return new Set();
      }
      // Solo ids que sigan existiendo en el contenido.
      return new Set(datos.pasosCompletados.filter(id => INDICE_DE_PASO.has(id)));
    } catch {
      return new Set();
    }
  }
}
