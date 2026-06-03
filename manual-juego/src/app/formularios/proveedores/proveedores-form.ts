import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Proveedores — rediseño Tailwind (tokens + directivas ui).
 * Inputs `resaltar`/`valores` los usa el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-proveedores-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './proveedores-form.html',
})
export class ProveedoresForm {
  static readonly id = 'proveedores';
  static readonly archivoGas = 'ProveedoresForm';
  static readonly titulo = 'Proveedores';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M2 6h13v9H2z"/><path d="M15 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
