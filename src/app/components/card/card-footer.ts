import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pie del card: fila de acciones alineadas a la derecha. Presentacional. */
@Component({
  selector: 'migo-card-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './card-footer.css',
})
export class CardFooter {}
