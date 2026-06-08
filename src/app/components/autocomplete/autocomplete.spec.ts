import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Autocomplete } from './autocomplete';

@Component({
  imports: [ReactiveFormsModule, Autocomplete],
  template: `<migo-autocomplete [formControl]="control" [suggestions]="suggestions" />`,
})
class Host {
  readonly control = new FormControl('');
  readonly suggestions = ['Harina', 'Huevos', 'Hojaldre'];
}

describe('Autocomplete (ghost completion)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, input };
  }

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('shows the remaining suffix of the first matching suggestion', () => {
    const { fixture, input } = setup();
    type(input, 'Har');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ina');
  });

  it('does not show a ghost when nothing matches', () => {
    const { fixture, input } = setup();
    type(input, 'xyz');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('accepts the suggestion on Tab, completing with the suggestion casing', () => {
    const { fixture, input } = setup();
    type(input, 'hue');
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Huevos');
  });

  it('leaves the typed value untouched when there is no match to accept', () => {
    const { fixture, input } = setup();
    type(input, 'Queque');
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true }));
    expect(fixture.componentInstance.control.value).toBe('Queque');
  });
});
