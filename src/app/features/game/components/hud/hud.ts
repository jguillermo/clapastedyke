import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { GameState } from '../../state/game-state';

/** Top bar of the game: global progress, link to the manual, and reset. */
@Component({
  selector: 'app-hud',
  imports: [RouterLink, TranslocoPipe],
  providers: [provideTranslocoScope('game')],
  templateUrl: './hud.html',
  styleUrl: './hud.scss',
})
export class Hud {
  protected readonly state = inject(GameState);
  private readonly router = inject(Router);

  protected readonly askingReset = signal(false);

  protected askReset(): void {
    this.askingReset.set(true);
  }

  protected cancelReset(): void {
    this.askingReset.set(false);
  }

  protected confirmReset(): void {
    this.state.reset();
    this.askingReset.set(false);
    this.router.navigateByUrl('/town');
  }
}
