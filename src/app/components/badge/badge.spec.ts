import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge } from './badge';

@Component({
  imports: [Badge],
  template: `<migo-badge>Vainilla</migo-badge>`,
})
class Host {}

describe('Badge', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('migo-badge') as HTMLElement;
    return { fixture, badge };
  }

  it('renders its projected content as an inline pill', () => {
    const { badge } = setup();
    expect(badge.textContent?.trim()).toBe('Vainilla');
    expect(badge.classList).toContain('inline-flex');
    expect(badge.classList).toContain('rounded-full');
  });
});
