import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Cabecera del card: fila con icono opcional (`[card-icon]`), bloque de título/subtítulo
 * (contenido por defecto) y acciones opcionales (`[card-actions]`). Presentacional.
 */
@Component({
  selector: 'migo-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `contents` evita una caja vacía cuando el slot no recibe nada; el `[&>*]:` estiliza
  // el contenido proyectado (icono / acciones) sin perforar la encapsulación con ::ng-deep.
  template: `
    <span class="contents [&>*]:size-6 [&>*]:shrink-0 [&>*]:text-brand">
      <ng-content select="[card-icon]" />
    </span>
    <div class="flex flex-col gap-1 min-w-0">
      <ng-content />
    </div>
    <span class="contents [&>*]:ms-auto [&>*]:shrink-0">
      <ng-content select="[card-actions]" />
    </span>
  `,
  host: { class: 'flex items-center gap-3 px-6 pt-5 pb-3' },
})
export class CardHeader {}
