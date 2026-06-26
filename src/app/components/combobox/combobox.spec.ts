import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Combobox } from './combobox';

@Component({
  imports: [ReactiveFormsModule, Combobox],
  template: `<migo-combobox [formControl]="control" [suggestions]="suggestions" [invalid]="invalid" />`,
})
class Host {
  readonly control = new FormControl('');
  invalid = false;
  readonly suggestions = ['Harina', 'Harina integral', 'Huevos', 'Hojaldre', 'Azúcar'];
}

describe('Combobox (ghost + dropdown)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>> | null = null;

  afterEach(() => {
    fixture?.destroy();
    fixture = null;
  });

  function setup() {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, input };
  }

  function type(input: HTMLInputElement, value: string) {
    input.dispatchEvent(new Event('focus'));
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture!.detectChanges();
  }

  const ghost = () => document.querySelector('span[aria-hidden="true"]');
  const options = () => Array.from(document.querySelectorAll('[role="option"]'));

  it('writes the model value into the input (CVA)', () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.setValue('Harina');
    fixture.detectChanges();
    expect(input.value).toBe('Harina');
  });

  it('emits the typed value to the model (CVA)', () => {
    const { fixture, input } = setup();
    type(input, 'Hue');
    expect(fixture.componentInstance.control.value).toBe('Hue');
  });

  it('single prefix match → inline ghost, no dropdown', () => {
    const { input } = setup();
    type(input, 'Hue'); // only "Huevos" contains "Hue"
    expect(ghost()?.textContent).toBe('Huevos');
    expect(options()).toHaveLength(0);
  });

  it('accepts the ghost on Tab, completing with the suggestion casing', () => {
    const { fixture, input } = setup();
    type(input, 'hue');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Huevos');
  });

  it('two+ matches → dropdown (no ghost); clicking an option commits it', () => {
    const { fixture, input } = setup();
    type(input, 'Har'); // "Harina" + "Harina integral"
    expect(ghost()).toBeNull();
    const opts = options();
    expect(opts.map((o) => o.textContent?.trim())).toEqual(['Harina', 'Harina integral']);
    (opts[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('Harina integral');
  });

  it('single contains-only match (not a prefix) → 1-item dropdown, no ghost', () => {
    const { input } = setup();
    type(input, 'zúc'); // "Azúcar" contains but does not start with "zúc"
    expect(ghost()).toBeNull();
    expect(options().map((o) => o.textContent?.trim())).toEqual(['Azúcar']);
  });

  it('no matches → neither ghost nor dropdown', () => {
    const { input } = setup();
    type(input, 'xyz');
    expect(ghost()).toBeNull();
    expect(options()).toHaveLength(0);
  });

  it('Enter picks the active option in the dropdown', () => {
    const { fixture, input } = setup();
    type(input, 'Har');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Harina integral');
  });

  it('reflects invalid state on the input', () => {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.invalid = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('reflects the disabled state on the input', () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
