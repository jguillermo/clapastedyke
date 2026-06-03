import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario de Clientes — capa visual fiel a src/ClientesForm.html.
 * La lógica vanilla vive en gas/logica/ClientesForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-clientes-form',
  imports: [MarcoDialogo],
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
