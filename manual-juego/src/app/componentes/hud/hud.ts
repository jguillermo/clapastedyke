import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStateService } from '../../estado/game-state.service';

/** Barra superior del juego: progreso global, enlace al manual y reinicio. */
@Component({
  selector: 'app-hud',
  imports: [RouterLink],
  templateUrl: './hud.html',
  styleUrl: './hud.scss',
})
export class Hud {
  protected readonly estado = inject(GameStateService);
  private readonly router = inject(Router);

  protected readonly pidiendoReinicio = signal(false);

  protected pedirReinicio(): void {
    this.pidiendoReinicio.set(true);
  }

  protected cancelarReinicio(): void {
    this.pidiendoReinicio.set(false);
  }

  protected confirmarReinicio(): void {
    this.estado.reiniciar();
    this.pidiendoReinicio.set(false);
    this.router.navigateByUrl('/mapa');
  }
}
