import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Subtítulo del card: texto secundario bajo el título. Presentacional. */
@Component({
  selector: 'migo-card-subtitle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="m-0 text-sm text-muted leading-snug"><ng-content /></p>`,
  host: { class: 'block' },
})
export class CardSubtitle {}
