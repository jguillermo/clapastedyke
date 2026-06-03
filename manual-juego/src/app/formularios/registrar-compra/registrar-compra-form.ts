import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Registrar compra — rediseño Tailwind (tokens + directivas ui).
 * La lógica vanilla vive en gas/logica/RegistrarCompraForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-registrar-compra-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './registrar-compra-form.html',
})
export class RegistrarCompraForm {
  static readonly id = 'registrar-compra';
  static readonly archivoGas = 'RegistrarCompraForm';
  static readonly titulo = 'Registrar compra';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M3 4h2l2.2 11h10l1.8-8H6"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/><path d="M11 8l1.6 1.6L16 6"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
