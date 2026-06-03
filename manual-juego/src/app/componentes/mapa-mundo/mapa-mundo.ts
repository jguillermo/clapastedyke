import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../estado/game-state.service';
import { CONTENIDO } from '../../modelo/contenido';
import { ICONOS, ICONOS_NIVEL } from '../../svg/iconos';
import { Mapa3d } from '../mapa-3d/mapa-3d';
import { IslaEstado } from '../../three/motor-mundo';

/**
 * Mapa del mundo: el lienzo 3D (Three.js) arriba y, debajo, los niveles como
 * tarjetas con sus misiones — la vía accesible y el fallback sin WebGL.
 * Solo se puede entrar a lo desbloqueado.
 */
@Component({
  selector: 'app-mapa-mundo',
  imports: [Mapa3d],
  templateUrl: './mapa-mundo.html',
  styleUrl: './mapa-mundo.scss',
})
export class MapaMundo {
  protected readonly estado = inject(GameStateService);
  private readonly router = inject(Router);

  protected readonly niveles = CONTENIDO;
  protected readonly ICONOS = ICONOS;
  protected readonly ICONOS_NIVEL = ICONOS_NIVEL;
  protected iconoDe(misionId: string): string {
    return ICONOS[misionId] || ICONOS['_def'];
  }

  protected readonly CANDADO =
    '<svg viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7"/><circle cx="12" cy="15.2" r="1.4"/></svg>';

  /** Misión a la que pertenece el paso actual (para el botón Continuar). */
  protected readonly misionActual = computed(() => {
    const paso = this.estado.pasoActual();
    return paso ? this.estado.misionDe(paso.id) : null;
  });

  /** Snapshot del progreso que dibuja el mundo 3D. */
  protected readonly islas3d = computed<IslaEstado[]>(() => {
    const actual = this.misionActual();
    return this.niveles.map(nivel => ({
      id: nivel.id,
      misiones: nivel.misiones.map(mision => ({
        id: mision.id,
        estado:
          this.estado.porcentajeMision(mision.id) === 100
            ? ('completa' as const)
            : this.estado.misionDesbloqueada(mision.id)
              ? ('desbloqueada' as const)
              : ('bloqueada' as const),
        actual: actual?.id === mision.id,
      })),
    }));
  });

  protected continuar(): void {
    const paso = this.estado.pasoActual();
    if (!paso) return;
    const mision = this.estado.misionDe(paso.id);
    this.router.navigateByUrl(`/mision/${mision?.id}/${paso.id}`);
  }

  protected irAMision(misionId: string): void {
    if (!this.estado.misionDesbloqueada(misionId)) return;
    this.router.navigateByUrl(`/mision/${misionId}`);
  }
}
