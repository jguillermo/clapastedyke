import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';

/**
 * Formulario de Reglas de empaque — capa visual fiel a src/ReglasEmpaqueForm.html.
 * La lógica vanilla vive en gas/logica/ReglasEmpaqueForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial.
 */
@Component({
  selector: 'app-reglas-empaque-form',
  imports: [MarcoDialogo],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './reglas-empaque-form.html',
})
export class ReglasEmpaqueForm {
  static readonly id = 'reglas-empaque';
  static readonly archivoGas = 'ReglasEmpaqueForm';
  static readonly titulo = 'Reglas de empaque';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
