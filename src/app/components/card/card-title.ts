import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Título del card: heading real. Presentacional. */
@Component({
  selector: 'migo-card-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3 class="migo-card__title"><ng-content /></h3>`,
  styleUrl: './card-title.css',
})
export class CardTitle {}
