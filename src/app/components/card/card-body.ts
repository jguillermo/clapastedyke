import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Card } from './card';

/** Cuerpo/contenido del card. Presentacional. */
@Component({
  selector: 'migo-card-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'hostClasses()' },
})
export class CardBody {
  // El card es opcional: el body siempre se usa dentro de un `migo-card`, pero la DI opcional
  // evita acoplarlo y permite usarlo aislado en tests.
  private readonly card = inject(Card, { optional: true });

  protected readonly hostClasses = computed(() => {
    // `first:pt-6` recupera el padding superior cuando el body es el primer hijo (card sin header).
    const base = 'block px-4 sm:px-6 pb-5 text-body leading-body first:pt-6';
    // Cuando el card llena (`fill`, p.ej. diálogo full-bleed en móvil) el body es la única zona
    // scrollable; header/footer quedan fijos. Ver mobile-first-conventions.md.
    return this.card?.fill() ? `${base} flex-1 overflow-y-auto min-h-0` : base;
  });
}
