import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Hud } from './features/game/components/hud/hud';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Hud],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * The town (`/town*`) is a full-screen world that IS its own background and
   * chrome. Elsewhere (the guided tutorial) we keep the sticky HUD and the
   * decorative backdrop. The root redirect lands on the town, so treat it as
   * immersive too to avoid a flash of the tutorial chrome on first paint.
   */
  protected readonly immersive = computed(() => {
    const u = this.url();
    return (
      u === '/' ||
      u === '' ||
      u === '/home' ||
      u.startsWith('/home/') ||
      u === '/town' ||
      u.startsWith('/town/')
    );
  });
}
