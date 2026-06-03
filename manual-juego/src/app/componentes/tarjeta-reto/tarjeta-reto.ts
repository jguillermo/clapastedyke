import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../estado/game-state.service';
import { buscarMision } from '../../modelo/contenido';
import { ICONOS } from '../../svg/iconos';
import { Escena } from '../escena/escena';

/**
 * El reto actual: SOLO lo que hay que hacer ahora en el software real,
 * con su escena instructiva y el botón «Ya lo completé».
 */
@Component({
  selector: 'app-tarjeta-reto',
  imports: [Escena],
  templateUrl: './tarjeta-reto.html',
  styleUrl: './tarjeta-reto.scss',
})
export class TarjetaReto {
  protected readonly estado = inject(GameStateService);
  private readonly router = inject(Router);

  // Parámetros de la ruta (withComponentInputBinding).
  readonly misionId = input.required<string>();
  readonly pasoId = input.required<string>();

  protected readonly mision = computed(() => buscarMision(this.misionId()));
  protected readonly paso = computed(
    () => this.mision()?.pasos.find(p => p.id === this.pasoId()) ?? null,
  );
  protected readonly indicePaso = computed(() =>
    Math.max(0, (this.mision()?.pasos ?? []).findIndex(p => p.id === this.pasoId())),
  );
  protected readonly nivel = computed(() => this.estado.nivelDe(this.misionId()));
  protected readonly icono = computed(() => ICONOS[this.misionId()] ?? ICONOS['_def']);

  protected readonly yaCompletado = computed(() => this.estado.estaCompletado(this.pasoId()));

  protected readonly mostrandoPista = signal(false);
  /** Tras completar, si el paso tiene «qué pasa», se muestra antes de avanzar. */
  protected readonly mostrandoQuePasa = signal(false);

  protected completar(): void {
    const paso = this.paso();
    if (!paso) return;
    this.estado.completar(paso.id);
    if (paso.quePasa) {
      this.mostrandoQuePasa.set(true);
      return;
    }
    this.avanzar();
  }

  protected avanzar(): void {
    const paso = this.paso();
    if (!paso) return;
    this.mostrandoQuePasa.set(false);

    if (this.estado.esUltimoDeNivel(paso.id)) {
      const nivel = this.nivel();
      this.router.navigateByUrl(`/nivel/${nivel?.id}/completado`);
      return;
    }
    const siguiente = this.estado.pasoSiguiente(paso.id);
    if (!siguiente) {
      this.router.navigateByUrl('/mapa');
      return;
    }
    const mision = this.estado.misionDe(siguiente.id);
    this.router.navigateByUrl(`/mision/${mision?.id}/${siguiente.id}`);
  }

  protected volver(): void {
    const anterior = this.estado.pasoAnterior(this.pasoId());
    if (!anterior) {
      this.router.navigateByUrl('/mapa');
      return;
    }
    const mision = this.estado.misionDe(anterior.id);
    this.router.navigateByUrl(`/mision/${mision?.id}/${anterior.id}`);
  }
}
