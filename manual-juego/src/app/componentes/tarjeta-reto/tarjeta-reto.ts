import { NgComponentOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../estado/game-state.service';
import { buscarFormulario } from '../../formularios/registro-formularios';
import { buscarMision } from '../../modelo/contenido';
import { ICONOS } from '../../svg/iconos';
import { Ayudante } from '../ayudante/ayudante';
import { CursorGuia } from '../cursor-guia/cursor-guia';
import { Escena } from '../escena/escena';

/**
 * El reto actual. Dos modos:
 * - FORMULARIO: el formulario REAL a pantalla completa; la usuaria escribe
 *   siguiendo el ejemplo, la chef 3D la guía y el botón se enciende al acertar.
 * - ESCENA: maqueta animada (menús, hoja) en tarjeta, como antes.
 */
@Component({
  selector: 'app-tarjeta-reto',
  imports: [Escena, Ayudante, CursorGuia, NgComponentOutlet],
  templateUrl: './tarjeta-reto.html',
  styleUrl: './tarjeta-reto.scss',
  host: { '[class.full]': 'esFormulario()' },
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

  /* ---------- Modo formulario real a pantalla completa ---------- */

  protected readonly componenteFormulario = computed(() => {
    const id = this.paso()?.escena.formulario;
    return id ? (buscarFormulario(id)?.componente ?? null) : null;
  });

  protected readonly esFormulario = computed(() => this.componenteFormulario() !== null);

  /** La usuaria escribe ella misma: el formulario arranca vacío. */
  protected readonly entradasFormulario = computed(() => ({
    resaltar: this.paso()?.escena.resaltarIds ?? [],
    valores: {} as Record<string, string>,
  }));

  /** Campos que hay que escribir en este reto: id → valor de ejemplo. */
  protected readonly objetivos = computed(() => {
    const escena = this.paso()?.escena;
    if (!escena?.formulario) return [];
    const ejemplos = escena.valoresEjemplo ?? {};
    return (escena.resaltarIds ?? [])
      .filter(id => ejemplos[id] !== undefined)
      .map(id => ({ id, esperado: ejemplos[id] }));
  });

  /** Ids ya escritos correctamente en este paso. */
  protected readonly correctos = signal<ReadonlySet<string>>(new Set());

  /** Todos los campos del reto están bien (o el reto no exige escribir). */
  protected readonly todoCorrecto = computed(() =>
    this.objetivos().every(o => this.correctos().has(o.id)),
  );

  /** Valor que falta por escribir (para la burbuja de la chef). */
  protected readonly esperadoPendiente = computed(() => {
    const pendiente = this.objetivos().find(o => !this.correctos().has(o.id));
    return pendiente && !this.yaCompletado() ? pendiente.esperado : null;
  });

  /** A qué elemento viaja el cursor-guía: el campo pendiente o el primer resaltado. */
  protected readonly objetivoCursor = computed(() => {
    const pendiente = this.objetivos().find(o => !this.correctos().has(o.id));
    if (pendiente) return pendiente.id;
    return this.paso()?.escena.resaltarIds?.[0] ?? null;
  });

  constructor() {
    // Cambio de paso: se reinician la escritura y la pista.
    effect(() => {
      this.pasoId();
      this.correctos.set(new Set());
      this.mostrandoPista.set(false);
      this.mostrandoQuePasa.set(false);
    });
  }

  /** Escucha delegada de los inputs del formulario real. */
  protected alEscribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!campo?.id) return;
    const objetivo = this.objetivos().find(o => o.id === campo.id);
    if (!objetivo) return;

    const bien = this.normalizar(campo.value) === this.normalizar(objetivo.esperado);
    const actuales = new Set(this.correctos());
    const cambia = bien !== actuales.has(objetivo.id);
    if (!cambia) return;
    if (bien) actuales.add(objetivo.id);
    else actuales.delete(objetivo.id);
    this.correctos.set(actuales);
  }

  private normalizar(s: string): string {
    return s.trim().toLowerCase();
  }

  /* ---------- Avance ---------- */

  protected completar(): void {
    const paso = this.paso();
    if (!paso || !this.todoCorrecto()) return;
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
