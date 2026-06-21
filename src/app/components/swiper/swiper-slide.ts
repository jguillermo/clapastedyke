import { Directive, inject, input, TemplateRef } from '@angular/core';

/**
 * Marca un `<ng-template>` como un slide del {@link MigoSwiper}. Lleva el texto de
 * su pestaña (`label`); su `TemplateRef` lo renderiza el carrusel dentro de un
 * `<swiper-slide>`. Sin lógica: solo transporta plantilla + etiqueta.
 *
 * ```html
 * <migo-swiper>
 *   <ng-template migoSwiperSlide label="Queques">…</ng-template>
 * </migo-swiper>
 * ```
 */
@Directive({
  selector: 'ng-template[migoSwiperSlide]',
})
export class MigoSwiperSlide {
  /** Texto de la pestaña que controla este slide. */
  readonly label = input('');

  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}
