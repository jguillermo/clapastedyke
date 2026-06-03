import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario Detalle de pedido — capa visual fiel a src/DetallePedidoForm.html.
 * La lógica vanilla vive en gas/logica/DetallePedidoForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-detalle-pedido-form',
  imports: [MarcoDialogo],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './detalle-pedido-form.html',
})
export class DetallePedidoForm {
  static readonly id = 'detalle-pedido';
  static readonly archivoGas = 'DetallePedidoForm';
  static readonly titulo = 'Pedido';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
