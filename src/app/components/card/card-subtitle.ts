import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Subtítulo del card: texto secundario bajo el título. Presentacional. */
@Component({
  selector: 'migo-card-subtitle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="migo-card__subtitle"><ng-content /></p>`,
  styleUrl: './card-subtitle.css',
})
export class CardSubtitle {}
