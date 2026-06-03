import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario Ver pedidos — capa visual fiel a src/VerPedidosForm.html.
 * La lógica vanilla vive en gas/logica/VerPedidosForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-ver-pedidos-form',
  imports: [MarcoDialogo],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './ver-pedidos-form.html',
})
export class VerPedidosForm {
  static readonly id = 'ver-pedidos';
  static readonly archivoGas = 'VerPedidosForm';
  static readonly titulo = 'Ver pedidos';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M9 12h6"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
