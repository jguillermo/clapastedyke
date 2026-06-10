import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectTag, type SelectTagType } from './select-tag';

@Component({
  imports: [SelectTag],
  template: `<migo-select-tag [types]="types" (valueChange)="last = $event" />`,
})
class Host {
  readonly types: SelectTagType[] = [
    { key: 'sabor', label: 'Sabor', values: ['Vainilla', 'Chocolate'], allowCreate: true },
    { key: 'peso', label: 'Peso', values: ['1 kg', '2 kg'], allowCreate: true },
    {
      key: 'porciones',
      label: 'Porciones',
      values: ['8', '10'],
      allowCreate: true,
      validate: (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? null : 'Las porciones deben ser un entero.'),
    },
  ];
  last: Record<string, string> = {};
}

describe('SelectTag (Select2)', () => {
  let fixture: ComponentFixture<Host>;

  afterEach(() => fixture?.destroy());

  function setup() {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { input };
  }

  function open(input: HTMLInputElement) {
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function options() {
    return [...document.querySelectorAll('[role="option"]')] as HTMLElement[];
  }

  function optionByText(text: string) {
    return options().find((o) => o.textContent?.includes(text));
  }

  function groupOption(label: string) {
    return options().find((o) => o.textContent?.trim() === label)!;
  }

  it('hides a type from the options once it has a value', () => {
    const { input } = setup();
    open(input);
    expect(optionByText('Vainilla')).toBeTruthy();
    optionByText('Vainilla')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ sabor: 'Vainilla' });
    expect(optionByText('Vainilla')).toBeFalsy();
    expect(optionByText('1 kg')).toBeTruthy();
  });

  it('adding a new value asks for the group, then commits to the chosen one', () => {
    const { input } = setup();
    type(input, '1.5 kg');
    const adds = options().filter((o) => o.textContent?.includes('Añadir «1.5 kg»'));
    expect(adds).toHaveLength(1);

    adds[0].click(); // paso 1: preguntar grupo
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({}); // todavía no se añade

    groupOption('Peso').click(); // paso 2: elegir grupo
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ peso: '1.5 kg' });
  });

  it('validates per group: rejects an invalid value and accepts it elsewhere', () => {
    const { input } = setup();
    type(input, 'familiar');
    optionByText('Añadir «familiar»')!.click();
    fixture.detectChanges();

    groupOption('Porciones').click(); // 'familiar' no es entero → rechazado
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({});
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('entero');

    groupOption('Sabor').click(); // sabor no tiene validación → aceptado
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ sabor: 'familiar' });
  });

  it('deduplicates values case-insensitively (Vainilla vs vainilla → one)', () => {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.types[0] = {
      key: 'sabor',
      label: 'Sabor',
      values: ['Vainilla', 'vainilla', 'Chocolate'],
      allowCreate: true,
    };
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    open(input);
    const vainillas = options().filter((o) => o.textContent?.toLowerCase().includes('vainilla'));
    expect(vainillas).toHaveLength(1);
  });

  it('emits the raw value and shows the chip prefixed with its category', () => {
    const { input } = setup();
    open(input);
    optionByText('10')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ porciones: '10' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Porciones: 10');
  });
});
