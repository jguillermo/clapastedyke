import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select, SelectOption } from './select';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `<app-select [options]="options" [formControl]="control" />`,
})
class Host {
  readonly options: SelectOption[] = [
    { value: 'pe', label: 'Perú' },
    { value: 'es', label: 'España' },
    { value: 'de', label: 'Alemania' },
  ];
  readonly control = new FormControl<string | null>(null);
}

describe('Select (ControlValueAccessor)', () => {
  let fixture: ComponentFixture<Host>;

  function triggerButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.app-select__trigger') as HTMLButtonElement;
  }

  async function open(): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    triggerButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => fixture?.destroy());

  it('opens a listbox panel with one option per item', async () => {
    await open();
    const panel = document.querySelector('.app-select__panel');
    expect(panel?.getAttribute('role')).toBe('listbox');
    expect(document.querySelectorAll('.app-select__option').length).toBe(3);
  });

  it('selecting an option updates the control and closes the panel', async () => {
    await open();
    const options = document.querySelectorAll<HTMLElement>('.app-select__option');
    options[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('es');
    expect(document.querySelector('.app-select__panel')).toBeNull();
  });

  it('shows the selected label in the trigger when the control has a value', async () => {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.control.setValue('de');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(triggerButton().textContent).toContain('Alemania');
  });
});
