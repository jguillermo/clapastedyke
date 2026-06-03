import { Directive, computed, input } from '@angular/core';

/**
 * Recetas de diseño de los formularios: directivas de atributo que aplican
 * utilities de Tailwind (sobre los tokens de tokens-formularios.css) al host.
 * DOM plano: no envuelven nada, así que los ids y la estructura quedan
 * intactos para el juego (validación, cursor-guía, resaltado).
 */

/** Tarjeta de sección. */
@Directive({
  selector: '[uiTarjeta]',
  host: {
    class:
      'block bg-hoja border border-linea rounded-tarjeta p-5 shadow-tarjeta mb-3.5 transition-shadow hover:shadow-flotante',
  },
})
export class UiTarjeta {}

/** Título de grupo (mono, mayúsculas, acento). */
@Directive({
  selector: '[uiTituloGrupo]',
  host: {
    class: 'block font-mono text-[11px] tracking-[.12em] uppercase text-acento mb-3.5',
  },
})
export class UiTituloGrupo {}

/** Subtexto explicativo bajo un título. */
@Directive({
  selector: '[uiSub]',
  host: { class: 'block text-xs text-apagado mb-3' },
})
export class UiSub {}

/** Fila de etiqueta de un campo. */
@Directive({
  selector: '[uiEtiqueta]',
  host: { class: 'flex flex-wrap items-center gap-2 mb-1.5 text-[13px] font-semibold text-tinta' },
})
export class UiEtiqueta {}

/** Asterisco de campo obligatorio. */
@Directive({
  selector: '[uiReq]',
  host: { class: 'text-acento font-bold' },
})
export class UiReq {}

/** Marca de campo opcional. */
@Directive({
  selector: '[uiOpt]',
  host: { class: 'text-[11px] font-normal text-apagado' },
})
export class UiOpt {}

/** Píldora de tipo de dato (Texto, Número…). */
@Directive({
  selector: '[uiPildora]',
  host: {
    class:
      'font-mono text-[9.5px] uppercase tracking-wide text-apagado border border-linea rounded-pildora px-2 py-px ml-auto',
  },
})
export class UiPildora {}

/** Campo de captura (input/select/textarea). Variantes: calc, ro. */
@Directive({
  selector: '[uiCampo]',
  host: { '[class]': 'clases()' },
})
export class UiCampo {
  readonly uiCampo = input<'' | 'calc' | 'ro'>('');

  protected readonly clases = computed(() => {
    const base =
      'w-full font-texto text-[13.5px] text-tinta bg-hoja border border-linea rounded-campo px-3 py-2.5 outline-none transition ' +
      'focus:border-acento focus:ring-2 focus:ring-acento/20 placeholder:text-apagado/70';
    switch (this.uiCampo()) {
      case 'calc':
        return `${base} bg-acento-suave border-acento-suave text-acento-profundo font-mono font-bold`;
      case 'ro':
        return `${base} bg-papel text-apagado`;
      default:
        return base;
    }
  });
}

/** Rejilla responsiva de campos. */
@Directive({
  selector: '[uiGrid]',
  host: { '[class]': 'clases()' },
})
export class UiGrid {
  readonly uiGrid = input<'two' | 'three'>('two');

  protected readonly clases = computed(() =>
    this.uiGrid() === 'three'
      ? 'grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-2.5'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  );
}

/** Botón. Variantes: primario, mini, peligro, fantasma; default = secundario. */
@Directive({
  selector: '[uiBoton]',
  host: { '[class]': 'clases()' },
})
export class UiBoton {
  readonly uiBoton = input<'' | 'primario' | 'mini' | 'peligro' | 'fantasma'>('');

  protected readonly clases = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-1.5 font-texto font-semibold cursor-pointer transition select-none ' +
      'active:translate-y-px disabled:opacity-55 disabled:cursor-default';
    switch (this.uiBoton()) {
      case 'primario':
        return `${base} text-[13.5px] px-4.5 py-2.5 rounded-[9px] bg-acento border border-acento text-white hover:bg-acento-profundo shadow-tarjeta`;
      case 'mini':
        return `${base} text-[11px] px-2.5 py-1 rounded-[7px] bg-hoja border border-linea text-[#5d544b] hover:border-acento hover:text-acento`;
      case 'peligro':
        return `${base} text-[11px] px-2.5 py-1 rounded-[7px] bg-hoja border border-rojo text-rojo hover:bg-rojo-suave`;
      case 'fantasma':
        return `${base} text-[13.5px] px-1.5 py-2 bg-transparent border-0 text-acento hover:text-acento-profundo`;
      default:
        return `${base} text-[13.5px] px-4.5 py-2.5 rounded-[9px] bg-hoja border border-linea text-[#5d544b] hover:border-apagado`;
    }
  });
}

/** Barra superior de una tarjeta (título h4 + acción). */
@Directive({
  selector: '[uiToolbar]',
  host: { class: 'flex items-center justify-between gap-2.5 mb-3' },
})
export class UiToolbar {}

/** Título dentro del toolbar. */
@Directive({
  selector: '[uiToolbarTitulo]',
  host: { class: 'm-0 font-titulo text-base font-semibold text-tinta' },
})
export class UiToolbarTitulo {}

/** Estado vacío («Aún no hay…», «Cargando…»). */
@Directive({
  selector: '[uiVacio]',
  host: { class: 'block p-4 text-center text-apagado text-[13px]' },
})
export class UiVacio {}

/** Nota al pie con fondo crema y borde punteado. */
@Directive({
  selector: '[uiNota]',
  host: {
    class:
      'block text-xs text-apagado mt-1.5 px-3 py-2.5 bg-crema rounded-campo border border-dashed border-linea',
  },
})
export class UiNota {}

/** Aviso flash (lo muestra/oculta el JS GAS; aquí es decorativo y va oculto). */
@Directive({
  selector: '[uiFlash]',
  host: { class: 'hidden mb-3.5 px-3 py-2.5 rounded-campo text-[13px]' },
})
export class UiFlash {}

/** Punto de semáforo de stock. */
@Directive({
  selector: '[uiPunto]',
  host: { '[class]': 'clases()' },
})
export class UiPunto {
  readonly uiPunto = input<'rojo' | 'amarillo' | 'verde'>('verde');

  protected readonly clases = computed(() => {
    const color =
      this.uiPunto() === 'rojo' ? 'bg-rojo' : this.uiPunto() === 'amarillo' ? 'bg-ambar' : 'bg-verde';
    return `inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${color}`;
  });
}

/** Todas las recetas, para importarlas de una vez en cada formulario. */
export const UI_FORMULARIOS = [
  UiTarjeta,
  UiTituloGrupo,
  UiSub,
  UiEtiqueta,
  UiReq,
  UiOpt,
  UiPildora,
  UiCampo,
  UiGrid,
  UiBoton,
  UiToolbar,
  UiToolbarTitulo,
  UiVacio,
  UiNota,
  UiFlash,
  UiPunto,
] as const;
