import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Píldora presentacional para una característica corta (p.ej. el sabor de una receta). Contenido
 * proyectado, sin lógica ni CVA (no es un control de formulario). Variante única neutral.
 *
 * Uso: `<migo-badge>Vainilla</migo-badge>`
 */
@Component({
  selector: 'migo-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class:
      'inline-flex w-fit items-center rounded-full bg-surface-sunken px-3 py-1 font-body text-xs font-medium text-muted',
  },
})
export class Badge {}
