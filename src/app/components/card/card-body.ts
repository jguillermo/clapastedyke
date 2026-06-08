import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Cuerpo/contenido del card. Presentacional. */
@Component({
  selector: 'migo-card-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './card-body.css',
})
export class CardBody {}
