import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpacerSize = 'sm' | 'md' | 'lg';

/**
 * Mapa de tamaño → ancho del tema Migo (escala 4px nativa de Tailwind).
 * Literales: Tailwind solo emite las clases que aparecen escritas, no se construye `w-${n}`.
 */
const SIZES: Record<SpacerSize, string> = {
  sm: 'w-1', // 4px
  md: 'w-2', // 8px
  lg: 'w-3', // 12px
};

/**
 * Espaciador horizontal presentacional del design system. Caja vacía sin nada visible: solo
 * añade hueco horizontal (`w-*` del tema) allí donde lo coloques — p.ej. entre el icono y el
 * texto de un botón, o entre cualquier par de elementos en línea.
 *
 * Es `inline-block` para que el ancho aplique aunque no tenga contenido. Decorativo (`aria-hidden`).
 * Con `hideOnMobile` desaparece en móvil y reaparece en `sm+` (útil para botones que en móvil
 * ocultan el texto y dejan solo el icono).
 *
 * Uso: `<migo-spacer />` · `<migo-spacer size="lg" />` · `<migo-spacer hideOnMobile />`
 */
@Component({
  selector: 'migo-spacer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    'aria-hidden': 'true',
    '[class]': 'hostClasses()',
  },
})
export class Spacer {
  readonly size = input<SpacerSize>('md');
  readonly hideOnMobile = input(false, { transform: booleanAttribute });

  protected readonly hostClasses = computed(() =>
    [
      'shrink-0',
      this.hideOnMobile() ? 'hidden sm:inline-block' : 'inline-block',
      SIZES[this.size()],
    ].join(' '),
  );
}
