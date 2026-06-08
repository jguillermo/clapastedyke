import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `<button
    migo-button
    [variant]="variant()"
    [loading]="loading()"
    [disabled]="disabled()"
  >
    Go
  </button>`,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly loading = signal(false);
  readonly disabled = signal(false);
}

describe('Button', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  it('applies base, variant and default size classes', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();
    expect(button.classList).toContain('migo-btn');
    expect(button.classList).toContain('migo-btn--danger');
    expect(button.classList).toContain('migo-btn--md');
  });

  it('disables the native button and marks it busy while loading', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.classList).toContain('migo-btn--loading');
  });

  it('disables via the disabled input', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
  });
});
