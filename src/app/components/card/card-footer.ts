import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pie del card: fila de acciones alineadas a la derecha. Presentacional. */
@Component({
  selector: 'migo-card-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'flex flex-wrap items-center justify-end gap-3 px-6 pt-3 pb-5 border-t border-border-subtle',
  },
})
export class CardFooter {}
