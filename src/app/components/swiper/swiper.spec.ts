import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MigoSwiper } from './swiper';
import { MigoSwiperSlide } from './swiper-slide';

@Component({
  imports: [MigoSwiper, MigoSwiperSlide],
  template: `
    <migo-swiper ariaLabel="Tipos" (indexChange)="lastIndex = $event">
      <ng-template migoSwiperSlide label="Uno">A</ng-template>
      <ng-template migoSwiperSlide label="Dos">B</ng-template>
      <ng-template migoSwiperSlide label="Tres">C</ng-template>
    </migo-swiper>
  `,
})
class Host {
  lastIndex = -1;
}

describe('MigoSwiper', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const tabs = (): HTMLButtonElement[] => [...fixture.nativeElement.querySelectorAll('[role="tab"]')];
    return { fixture, tabs };
  }

  it('renderiza una pestaña por slide con su label', () => {
    const { tabs } = setup();
    expect(tabs().map((t) => t.textContent?.trim())).toEqual(['Uno', 'Dos', 'Tres']);
  });

  it('arranca con la primera pestaña seleccionada (roving tabindex)', () => {
    const { tabs } = setup();
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0].tabIndex).toBe(0);
    expect(tabs()[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs()[1].tabIndex).toBe(-1);
  });

  it('tocar una pestaña la activa y emite indexChange', () => {
    const { fixture, tabs } = setup();
    tabs()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastIndex).toBe(2);
    expect(tabs()[2].getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0].getAttribute('aria-selected')).toBe('false');
  });

  it('flecha derecha mueve a la siguiente pestaña', () => {
    const { fixture, tabs } = setup();
    tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastIndex).toBe(1);
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
  });

  it('un panel (tabpanel) por slide, etiquetado por su pestaña', () => {
    const { fixture } = setup();
    const panels = [...fixture.nativeElement.querySelectorAll('[role="tabpanel"]')] as HTMLElement[];
    expect(panels).toHaveLength(3);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(panels[0].getAttribute('aria-labelledby'));
    expect(panels[0].textContent?.trim()).toBe('A');
  });
});
