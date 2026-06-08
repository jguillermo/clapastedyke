import { TestBed } from '@angular/core/testing';
import { FormField } from './form-field';

describe('FormField', () => {
  it('renders the label and exposes a unique control id', () => {
    const fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('label', 'Email');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Email');
    expect(label.getAttribute('for')).toBe(fixture.componentInstance.controlId);
  });

  it('shows the error with role=alert and points describedBy to it', () => {
    const fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('error', 'Requerido');
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.migo-field__msg--error') as HTMLElement;
    expect(error.getAttribute('role')).toBe('alert');
    expect(fixture.componentInstance.invalid()).toBe(true);
    expect(fixture.componentInstance.describedBy()).toBe(fixture.componentInstance.errorId);
  });

  it('shows the hint when there is no error and describedBy points to it', () => {
    const fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('hint', 'Pista');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.migo-field__msg--hint')).toBeTruthy();
    expect(fixture.componentInstance.describedBy()).toBe(fixture.componentInstance.hintId);
  });
});
