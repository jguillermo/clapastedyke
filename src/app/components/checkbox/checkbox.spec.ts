import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Checkbox } from './checkbox';

@Component({
  imports: [ReactiveFormsModule, Checkbox],
  template: `<app-checkbox [formControl]="control">Acepto los términos</app-checkbox>`,
})
class Host {
  readonly control = new FormControl(false);
}

describe('Checkbox (ControlValueAccessor)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, input };
  }

  it('reflects the control value as checked', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.checked).toBe(true);
  });

  it('propagates toggling back into the control', () => {
    const { fixture, input } = setup();
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('reflects the disabled state coming from the control', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
