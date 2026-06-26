import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Combobox } from './combobox';

@Component({
  imports: [ReactiveFormsModule, Combobox],
  template: `<migo-combobox
    [formControl]="control"
    [suggestions]="suggestions"
    [invalid]="invalid"
    (selected)="picked.push($event)"
  />`,
})
class Host {
  readonly control = new FormControl('');
  invalid = false;
  readonly picked: string[] = [];
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

  it('accepts the ghost on Tab, completing with the suggestion casing and emitting selected', () => {
    const { fixture, input } = setup();
    type(input, 'hue');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Huevos');
    expect(fixture.componentInstance.picked).toEqual(['Huevos']); // → avanzar al siguiente campo
  });

  it('completing inline with ArrowRight fills but does NOT emit selected (no advance)', () => {
    const { fixture, input } = setup();
    type(input, 'hue');
    // caret al final para que → acepte
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Huevos');
    expect(fixture.componentInstance.picked).toEqual([]); // → solo completa, no avanza
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
    expect(fixture.componentInstance.picked).toEqual(['Harina integral']); // → avanzar al siguiente campo
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
    expect(fixture.componentInstance.picked).toEqual(['Harina integral']); // → avanzar al siguiente campo
  });

  it('single prefix match → ghost is rendered AFTER the input (paints on top)', () => {
    const { input } = setup();
    type(input, 'Hue');
    const ghostEl = ghost()!;
    // El fantasma debe ir después del input en el DOM para pintarse encima del fondo de foco.
    expect(input.compareDocumentPosition(ghostEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('with a dropdown open, ArrowDown is handled and does NOT bubble (grid keeps its cell)', () => {
    const { input } = setup();
    type(input, 'Har'); // 2 matches → dropdown
    let bubbledToHost = false;
    // Un ancestro (como el host de migo-table) escucha keydown por burbujeo.
    const spy = () => (bubbledToHost = true);
    document.addEventListener('keydown', spy);
    try {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(bubbledToHost).toBe(false);
    } finally {
      document.removeEventListener('keydown', spy);
    }
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
