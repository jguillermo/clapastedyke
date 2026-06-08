import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select, SelectOption } from './select';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `<migo-select [options]="options" [formControl]="control" />`,
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
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
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
    const panel = document.querySelector('[role="listbox"]');
    expect(panel).toBeTruthy();
    expect(document.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('selecting an option updates the control and closes the panel', async () => {
    await open();
    const options = document.querySelectorAll<HTMLElement>('[role="option"]');
    options[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('es');
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  it('shows the selected label in the trigger when the control has a value', async () => {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.control.setValue('de');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(triggerButton().textContent).toContain('Alemania');
  });
});
