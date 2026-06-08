import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Cabecera del card: fila con icono opcional (`[card-icon]`), bloque de título/subtítulo
 * (contenido por defecto) y acciones opcionales (`[card-actions]`). Presentacional.
 */
@Component({
  selector: 'migo-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content select="[card-icon]" />
    <div class="migo-card__heading">
      <ng-content />
    </div>
    <ng-content select="[card-actions]" />
  `,
  styleUrl: './card-header.css',
})
export class CardHeader {}
