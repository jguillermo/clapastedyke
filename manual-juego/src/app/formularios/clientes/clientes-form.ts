import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Clientes — rediseño Tailwind (tokens + directivas ui).
 * Inputs `resaltar`/`valores` los usa el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-clientes-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './clientes-form.html',
})
export class ClientesForm {
  static readonly id = 'clientes';
  static readonly archivoGas = 'ClientesForm';
  static readonly titulo = 'Clientes';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
