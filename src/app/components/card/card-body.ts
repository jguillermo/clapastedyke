import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Cuerpo/contenido del card. Presentacional. */
@Component({
  selector: 'migo-card-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  // `first:pt-6` recupera el padding superior cuando el body es el primer hijo (card sin header).
  host: { class: 'block px-6 pb-5 text-body leading-body first:pt-6' },
})
export class CardBody {}
