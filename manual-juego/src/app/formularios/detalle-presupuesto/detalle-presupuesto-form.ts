import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario Detalle de presupuesto — capa visual fiel a src/DetallePresupuestoForm.html.
 * La lógica vanilla vive en gas/logica/DetallePresupuestoForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-detalle-presupuesto-form',
  imports: [MarcoDialogo],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './detalle-presupuesto-form.html',
})
export class DetallePresupuestoForm {
  static readonly id = 'detalle-presupuesto';
  static readonly archivoGas = 'DetallePresupuestoForm';
  static readonly titulo = 'Detalle';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M5 3h9l4 4v8"/><path d="M5 3v18h7"/><path d="M9 9h5M9 13h3"/><circle cx="16" cy="17" r="3"/><path d="M18.2 19.2L21 22"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
