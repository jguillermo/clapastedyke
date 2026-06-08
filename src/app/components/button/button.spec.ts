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
    // El estilo es Tailwind del tema Migo: base (rounded-full), variante (bg-error) y tamaño md (min-h-11).
    expect(button.classList).toContain('rounded-full');
    expect(button.classList).toContain('bg-error');
    expect(button.classList).toContain('min-h-11');
  });

  it('disables the native button and marks it busy while loading', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    // El estado de carga muestra el spinner animado.
    expect(button.querySelector('.animate-spin')).toBeTruthy();
  });

  it('disables via the disabled input', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
  });
});
