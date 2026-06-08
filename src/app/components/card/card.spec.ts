import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card, CardElevation, CardVariant } from './card';
import { CardBody } from './card-body';
import { CardFooter } from './card-footer';
import { CardHeader } from './card-header';
import { CardTitle } from './card-title';

@Component({
  imports: [Card, CardHeader, CardTitle, CardBody, CardFooter],
  template: `
    <migo-card [variant]="variant()" [elevation]="elevation()" [interactive]="interactive()">
      <migo-card-header><migo-card-title>Título</migo-card-title></migo-card-header>
      <migo-card-body>Cuerpo</migo-card-body>
      <migo-card-footer>Pie</migo-card-footer>
    </migo-card>
  `,
})
class Host {
  readonly variant = signal<CardVariant>('elevated');
  readonly elevation = signal<CardElevation>('md');
  readonly interactive = signal(false);
}

describe('Card', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('migo-card') as HTMLElement;
    return { fixture, card };
  }

  it('applies variant and elevation classes', () => {
    const { fixture, card } = setup();
    fixture.componentInstance.variant.set('outlined');
    fixture.componentInstance.elevation.set('lg');
    fixture.detectChanges();
    expect(card.classList).toContain('migo-card');
    expect(card.classList).toContain('migo-card--outlined');
    expect(card.classList).toContain('migo-card--lg');
  });

  it('renders the projected header, body and footer parts', () => {
    const { card } = setup();
    expect(card.querySelector('migo-card-title')?.textContent).toContain('Título');
    expect(card.querySelector('migo-card-body')?.textContent).toContain('Cuerpo');
    expect(card.querySelector('migo-card-footer')?.textContent).toContain('Pie');
  });

  it('becomes focusable only when interactive', () => {
    const { fixture, card } = setup();
    expect(card.getAttribute('tabindex')).toBeNull();
    fixture.componentInstance.interactive.set(true);
    fixture.detectChanges();
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.classList).toContain('migo-card--interactive');
  });
});
