import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UnitInput, type UnitToken } from './unit-input';

@Component({
  imports: [ReactiveFormsModule, UnitInput],
  template: `<migo-unit-input [formControl]="control" [unit]="unit()" (unitToken)="token = $event" />`,
})
class Host {
  readonly control = new FormControl('');
  readonly unit = signal('kg');
  token: UnitToken | null = null;
}

describe('UnitInput (ControlValueAccessor)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, input };
  }

  it('writes the control value into the native input', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.setValue('250');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('250');
  });

  it('keeps only the number when typing, never letters (pasted text is sanitized)', () => {
    const { fixture, input } = setup();
    input.value = '8u';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('8');
    expect(input.value).toBe('8');
  });

  it('emits a unit token when the user types its initial, without inserting the letter', () => {
    const { fixture, input } = setup();
    const prevented = !input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'u', cancelable: true, bubbles: true }),
    );
    expect(prevented).toBe(true);
    expect(fixture.componentInstance.token).toBe('u');
  });

  it('shows the unit next to the number only when there is a value', () => {
    const { fixture, input } = setup();
    // Vacío: no se muestra unidad (no confunde como placeholder).
    expect(fixture.nativeElement.textContent).not.toContain('kg');
    input.value = '8';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('kg');
    fixture.componentInstance.unit.set('g');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('g');
  });

  it('reflects the disabled state coming from the control', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
