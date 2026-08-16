import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SyncBadge } from '@features/sync-badge/sync-badge';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SyncBadge],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('misaevol');
}
