import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Comprar materiales — rediseño Tailwind (tokens + directivas ui).
 * La lógica vanilla vive en gas/logica/ComprarMaterialesForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-comprar-materiales-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './comprar-materiales-form.html',
})
export class ComprarMaterialesForm {
  static readonly id = 'comprar-materiales';
  static readonly archivoGas = 'ComprarMaterialesForm';
  static readonly titulo = 'Comprar materiales';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M3 4h2l2.2 11h10l1.8-8H6"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
