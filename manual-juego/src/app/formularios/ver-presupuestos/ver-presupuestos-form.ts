import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario Ver presupuestos — capa visual fiel a src/VerPresupuestosForm.html.
 * La lógica vanilla vive en gas/logica/VerPresupuestosForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-ver-presupuestos-form',
  imports: [MarcoDialogo],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './ver-presupuestos-form.html',
})
export class VerPresupuestosForm {
  static readonly id = 'ver-presupuestos';
  static readonly archivoGas = 'VerPresupuestosForm';
  static readonly titulo = 'Ver presupuestos';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M8 3h7l3 3v11H8z"/><path d="M5 7v13a1 1 0 0 0 1 1h9"/><path d="M11 9h4M11 13h4"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
