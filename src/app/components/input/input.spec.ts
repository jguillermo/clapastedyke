import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputField } from './input';

@Component({
  imports: [ReactiveFormsModule, InputField],
  template: `<app-input [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('');
}

describe('InputField (ControlValueAccessor)', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, input };
  }

  it('writes the control value into the native input', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.setValue('hola');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('hola');
  });

  it('propagates typing back into the control', () => {
    const { fixture, input } = setup();
    input.value = 'mundo';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('mundo');
  });

  it('reflects the disabled state coming from the control', async () => {
    const { fixture, input } = setup();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
