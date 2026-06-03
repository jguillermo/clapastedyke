import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Chrome del diálogo: cabecera (chip de icono + título + X), cuerpo
 * scrolleable y pie de botones — todo con utilities de Tailwind sobre los
 * tokens. El host es display:contents: el layout columna lo da el contenedor
 * (visor `.ventana` / juego `.form-zona`), que debe ser flex-col con altura.
 *
 * El cuerpo va en <ng-content>; el pie en <ng-content select="[pie]">.
 */
@Component({
  selector: 'app-marco-dialogo',
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <div class="flex shrink-0 items-center justify-between gap-3 border-b border-linea bg-hoja/85 px-5 py-3.5 backdrop-blur">
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-acento-suave bg-acento-suave text-acento">
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            [innerHTML]="iconoSeguro()"
          ></svg>
        </span>
        <h3 class="m-0 truncate font-titulo text-lg font-semibold text-tinta" [attr.id]="idTitulo()">
          {{ titulo() }}
        </h3>
      </div>
      <!-- data-onclick: herencia del contrato GAS (hoy decorativo en el juego) -->
      <button
        class="cursor-pointer border-0 bg-transparent text-2xl leading-none text-apagado transition hover:rotate-90 hover:text-tinta"
        data-onclick="S.cerrar()"
        title="Cerrar"
      >&times;</button>
    </div>

    <div class="flex-1 overflow-auto bg-papel px-5 py-4 font-texto text-tinta antialiased">
      <div id="flash" class="mb-3.5 hidden rounded-campo px-3 py-2.5 text-[13px]"></div>
      <ng-content />
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2.5 border-t border-linea bg-hoja px-5 py-3" [attr.id]="idPie()">
      <ng-content select="[pie]" />
    </div>
  `,
})
export class MarcoDialogo {
  private readonly sanitizador = inject(DomSanitizer);

  readonly titulo = input.required<string>();
  /** Trazos SVG internos del icono (paths/circles), como string. */
  readonly icono = input.required<string>();
  /** Ids opcionales del chrome (los usan los formularios de detalle). */
  readonly idTitulo = input<string | null>(null);
  readonly idPie = input<string | null>(null);

  /** Los trazos son estáticos y propios (registro de formularios): seguros. */
  protected readonly iconoSeguro = computed<SafeHtml>(() =>
    this.sanitizador.bypassSecurityTrustHtml(this.icono()),
  );
}
