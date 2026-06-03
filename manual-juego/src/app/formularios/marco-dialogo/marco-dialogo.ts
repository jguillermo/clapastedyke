import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Chrome del diálogo GAS: dlg-head (icono + título + X) y dlg-foot.
 * ViewEncapsulation.None + selector que se renderiza a DOM plano: en el
 * export el markup queda exactamente como el de src/Estilos.html.
 *
 * El cuerpo va en <ng-content>; el pie en <ng-content select="[pie]">.
 */
@Component({
  selector: 'app-marco-dialogo',
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <div class="dlg-head">
      <div class="dlg-title">
        <svg
          class="dlg-ico draw"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          [innerHTML]="iconoSeguro()"
        ></svg>
        <h3 [attr.id]="idTitulo()">{{ titulo() }}</h3>
      </div>
      <!-- data-onclick: el export lo convierte a onclick= (Angular prohibe on* estatico) -->
      <button class="x" data-onclick="S.cerrar()" title="Cerrar">&times;</button>
    </div>

    <div class="dlg-body">
      <div id="flash" class="flash"></div>
      <ng-content />
    </div>

    <div class="dlg-foot" [attr.id]="idPie()">
      <ng-content select="[pie]" />
    </div>
  `,
})
export class MarcoDialogo {
  private readonly sanitizador = inject(DomSanitizer);

  readonly titulo = input.required<string>();
  /** Trazos SVG internos del icono (paths/circles), como string. */
  readonly icono = input.required<string>();
  /** Ids opcionales del chrome: los formularios de detalle hacen
   *  getElementById('titulo')/('pie') para reescribir título y botones. */
  readonly idTitulo = input<string | null>(null);
  readonly idPie = input<string | null>(null);

  /** Los trazos son estáticos y propios (registro de formularios): seguros. */
  protected readonly iconoSeguro = computed<SafeHtml>(() =>
    this.sanitizador.bypassSecurityTrustHtml(this.icono()),
  );
}
