import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buscarFormulario } from '../registro-formularios';

/** /formularios/:id — muestra un formulario real dentro del marco de diálogo GAS. */
@Component({
  selector: 'app-visor-formulario',
  imports: [NgComponentOutlet, RouterLink],
  template: `
    @if (definicion(); as def) {
      <p class="miga"><a routerLink="/formularios">← Formularios</a> / {{ def.titulo }}</p>
      <div class="ventana gas-form">
        <ng-container *ngComponentOutlet="def.componente" />
      </div>
    } @else {
      <p class="miga">Formulario «{{ id() }}» no encontrado. <a routerLink="/formularios">Volver</a></p>
    }
  `,
  styles: `
    :host { display: block; max-width: 760px; margin: 0 auto; padding: 22px 18px 60px; }
    .miga { font-size: 13.5px; color: var(--muted); margin: 0 0 12px; }
    .miga a { color: var(--accent); font-weight: 600; text-decoration: none; }
    .ventana {
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow);
      min-height: 420px;
      max-height: 78vh;
    }
  `,
})
export class VisorFormulario {
  readonly id = input.required<string>();
  protected readonly definicion = computed(() => buscarFormulario(this.id()));
}
