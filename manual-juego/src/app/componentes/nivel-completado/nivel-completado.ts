import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStateService } from '../../estado/game-state.service';
import { CONTENIDO } from '../../modelo/contenido';
import { ICONOS_NIVEL } from '../../svg/iconos';
import { Dificultad } from '../../modelo/tutorial.types';

/** Hito de nivel completado, con celebración. */
@Component({
  selector: 'app-nivel-completado',
  imports: [RouterLink],
  templateUrl: './nivel-completado.html',
  styleUrl: './nivel-completado.scss',
})
export class NivelCompletado {
  protected readonly estado = inject(GameStateService);
  private readonly router = inject(Router);

  readonly nivelId = input.required<string>();

  protected readonly nivel = computed(() =>
    CONTENIDO.find(n => n.id === (this.nivelId() as Dificultad)),
  );
  protected readonly icono = computed(() => ICONOS_NIVEL[this.nivelId()] ?? '');

  protected readonly siguienteNivel = computed(() => {
    const actual = this.nivel();
    return actual ? CONTENIDO.find(n => n.orden === actual.orden + 1) ?? null : null;
  });

  /** 18 piezas de confeti con posiciones/retrasos deterministas. */
  protected readonly confeti = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 137) % 100,
    retraso: (i % 6) * 120,
    giro: i % 2 ? 1 : -1,
    color: ['#bb5530', '#e08a52', '#4f8a5b', '#cf9a32'][i % 4],
  }));

  protected continuar(): void {
    const siguiente = this.siguienteNivel();
    if (!siguiente) {
      this.router.navigateByUrl('/mapa');
      return;
    }
    const mision = siguiente.misiones[0];
    this.router.navigateByUrl(`/mision/${mision.id}/${mision.pasos[0].id}`);
  }
}
