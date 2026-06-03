import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Ajustar inventario — rediseño Tailwind (tokens + directivas ui).
 * Inputs `resaltar`/`valores` los usa el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-ajustar-inventario-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './ajustar-inventario-form.html',
})
export class AjustarInventarioForm {
  static readonly id = 'ajustar-inventario';
  static readonly archivoGas = 'AjustarInventarioForm';
  static readonly titulo = 'Ajustar inventario';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="12" r="2.2"/><circle cx="8" cy="17" r="2.2"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
