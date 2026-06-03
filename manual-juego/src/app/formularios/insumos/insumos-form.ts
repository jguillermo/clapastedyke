import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Insumos — rediseño Tailwind (tokens + directivas ui).
 * Inputs `resaltar`/`valores` los usa el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-insumos-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './insumos-form.html',
})
export class InsumosForm {
  static readonly id = 'insumos';
  static readonly archivoGas = 'InsumosForm';
  static readonly titulo = 'Insumos';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
