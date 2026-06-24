import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { MigoSwiperSlide } from './swiper-slide';

// Registra los web components de Swiper (<swiper-container>/<swiper-slide>) al cargar este
// módulo. `register()` es idempotente y no-op fuera del navegador (guardas internas de Swiper),
// así que Swiper queda **contenido aquí**, en su componente — nunca en main.ts ni en otra capa.
register();

/** El `<swiper-container>` expone su instancia de Swiper en la propiedad `swiper`. */
type SwiperContainer = HTMLElement & { swiper?: { slideTo(index: number): void } };

let uid = 0;

/**
 * Carrusel del design system: envuelve **Swiper Element** (web component) y aporta
 * una fila de **pestañas accesibles** sincronizada con el swipe. Los slides se
 * declaran con la directiva {@link MigoSwiperSlide} sobre `<ng-template>` (cada uno
 * con su `label`); este componente los proyecta dentro de `<swiper-slide>` y
 * mantiene `<swiper-container>` y el `CUSTOM_ELEMENTS_SCHEMA` **encapsulados aquí**.
 *
 * Swiper se registra una sola vez en `main.ts` (`register()` de
 * `swiper/element/bundle`); su CSS vive en el shadow DOM del web component, así que
 * no choca con Tailwind ni con el CSS global.
 */
@Component({
  selector: 'migo-swiper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './swiper.html',
})
export class MigoSwiper {
  /** Nombre accesible del grupo de pestañas (`aria-label` del tablist). */
  readonly ariaLabel = input('');

  /** Emite el índice del slide activo al deslizar o tocar una pestaña. */
  readonly indexChange = output<number>();

  protected readonly slides = contentChildren(MigoSwiperSlide);
  protected readonly activeIndex = signal(0);
  protected readonly uid = `migo-swiper-${uid++}`;

  private readonly container = viewChild<ElementRef<SwiperContainer>>('container');
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  /** Mueve el carrusel al índice dado (clamp al rango) y sincroniza la pestaña. */
  slideTo(index: number): void {
    const last = this.slides().length - 1;
    if (last < 0) return;
    const target = Math.max(0, Math.min(index, last));
    if (target !== this.activeIndex()) {
      this.activeIndex.set(target);
      this.indexChange.emit(target);
    }
    this.container()?.nativeElement.swiper?.slideTo(target);
  }

  /** Swipe → actualiza la pestaña activa desde el evento del web component. */
  protected onSlideChange(event: Event): void {
    const detail = (event as CustomEvent<[{ activeIndex: number }]>).detail;
    const index = detail?.[0]?.activeIndex ?? 0;
    if (index !== this.activeIndex()) {
      this.activeIndex.set(index);
      this.indexChange.emit(index);
    }
  }

  protected select(index: number): void {
    this.slideTo(index);
  }

  /** Teclado del patrón tabs: ←/→ ciclan, Home/End van a los extremos. */
  protected onTabKeydown(event: KeyboardEvent, index: number): void {
    const count = this.slides().length;
    if (count === 0) return;
    let next = index;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.slideTo(next);
    setTimeout(() => this.tabs()[next]?.nativeElement.focus());
  }
}
