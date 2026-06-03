import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MarcoDialogo } from '../marco-dialogo/marco-dialogo';
import { UI_FORMULARIOS } from '../ui/ui';

/**
 * Formulario de Nuevo presupuesto — rediseño Tailwind (tokens + directivas ui).
 * La lógica vanilla vive en gas/logica/NuevoPresupuestoForm.js y se adjunta al exportar.
 * Inputs `resaltar`/`valores` solo se usan en el juego-tutorial; ids intactos.
 */
@Component({
  selector: 'app-nuevo-presupuesto-form',
  imports: [MarcoDialogo, ...UI_FORMULARIOS],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  templateUrl: './nuevo-presupuesto-form.html',
})
export class NuevoPresupuestoForm {
  static readonly id = 'nuevo-presupuesto';
  static readonly archivoGas = 'NuevoPresupuestoForm';
  static readonly titulo = 'Nuevo presupuesto';

  readonly resaltar = input<string[]>([]);
  readonly valores = input<Record<string, string>>({});

  protected readonly icono =
    '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>';

  protected readonly marcas = computed(() => new Set(this.resaltar()));
  protected valor(id: string): string {
    return this.valores()[id] ?? '';
  }
}
