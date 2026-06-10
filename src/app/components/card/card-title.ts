import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Título del card: heading real. Presentacional. */
@Component({
  selector: 'migo-card-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3 class="m-0 font-display text-h4 text-heading leading-snug"><ng-content /></h3>`,
  host: { class: 'block' },
})
export class CardTitle {}
