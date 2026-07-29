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

  it('removing a chip frees its type up again for selection', () => {
    const { input } = setup();
    open(input);
    optionByText('Vainilla')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ sabor: 'Vainilla' });

    const removeButton = document.querySelector('button[aria-label*="Quitar"]') as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({});
    open(input);
    expect(optionByText('Vainilla')).toBeTruthy(); // vuelve a ofrecerse
  });

  it('losing focus (e.g. Tab to another field) closes the panel, not just an outside click', () => {
    vi.useFakeTimers();
    try {
      const { input } = setup();
      open(input);
      expect(document.querySelector('[role="listbox"]')).toBeTruthy();

      input.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(document.querySelector('[role="listbox"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

@Component({
  imports: [SelectTag],
  template: `<migo-select-tag [types]="types" (valueChange)="last = $event" (created)="createdEvents.push($event)" />`,
})
class ExtraFieldHost {
  readonly types: SelectTagType[] = [
    // Porciones: valores ya numéricos (p.ej. "20") — no deben pedir el factor por separado.
    {
      key: 'portions',
      label: 'Porciones',
      values: ['20'],
      allowCreate: true,
      extraField: { label: 'Factor de escalado' },
    },
    // Molde: valores de texto — sí piden el factor, con las capacidades existentes como referencia.
    {
      key: 'mold',
      label: 'Molde',
      values: ['Pequeño', 'Mediano', 'Grande'],
      allowCreate: true,
      extraField: {
        label: 'Factor de escalado',
        reference: [
          { label: 'Pequeño', extra: 0.5 },
          { label: 'Mediano', extra: 1 },
          { label: 'Grande', extra: 3 },
        ],
      },
    },
  ];
  last: Record<string, string> = {};
  createdEvents: Array<{ typeKey: string; value: string; extra: number }> = [];
}

describe('SelectTag (extraField / factor capture)', () => {
  let fixture: ComponentFixture<ExtraFieldHost>;

  afterEach(() => fixture?.destroy());

  function setup() {
    fixture = TestBed.createComponent(ExtraFieldHost);
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

  function extraInput(): HTMLInputElement {
    return document.querySelector('input[type="number"]') as HTMLInputElement;
  }

  it('creating a plain-number value (portions) skips the factor prompt entirely', () => {
    const { input } = setup();
    type(input, '33');
    options().find((o) => o.textContent?.includes('Añadir «33»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Porciones')!.click();
    fixture.detectChanges();

    // Se confirma directo: no hay paso de "pedir factor".
    expect(extraInput()).toBeNull();
    expect(fixture.componentInstance.last).toEqual({ portions: '33' });
    expect(fixture.componentInstance.createdEvents).toEqual([{ typeKey: 'portions', value: '33', extra: 33 }]);
  });

  it('asks for the extra field when the new value is text (mold), without committing yet', () => {
    const { input } = setup();
    type(input, 'Extra grande');
    options().find((o) => o.textContent?.includes('Añadir «Extra grande»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({}); // aún no confirmado
    expect(extraInput()).toBeTruthy();
    expect(document.querySelector('[role="option"]')).toBeNull(); // el panel ya no muestra opciones
  });

  it('shows the existing values of that group as reference while asking for the factor', () => {
    const { input } = setup();
    type(input, 'Extra grande');
    options().find((o) => o.textContent?.includes('Añadir «Extra grande»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    const text = document.querySelector('[role="listbox"]')?.textContent ?? '';
    expect(text).toContain('Pequeño = 0.5');
    expect(text).toContain('Mediano = 1');
    expect(text).toContain('Grande = 3');
  });

  it('confirming the extra field (Enter) commits the chip and emits created with the numeric value', () => {
    const { input } = setup();
    type(input, 'Extra grande');
    options().find((o) => o.textContent?.includes('Añadir «Extra grande»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    extraInput().value = '4';
    extraInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({ mold: 'Extra grande' });
    expect(fixture.componentInstance.createdEvents).toEqual([{ typeKey: 'mold', value: 'Extra grande', extra: 4 }]);
  });

  it('accepts a fraction (e.g. "1/8") as the factor and converts it to a plain number', () => {
    const { input } = setup();
    type(input, 'Mini');
    options().find((o) => o.textContent?.includes('Añadir «Mini»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    extraInput().value = '1/8';
    extraInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.createdEvents).toEqual([{ typeKey: 'mold', value: 'Mini', extra: 0.125 }]);
  });

  it('rejects an invalid fraction (division by zero) without committing', () => {
    const { input } = setup();
    type(input, 'Mini');
    options().find((o) => o.textContent?.includes('Añadir «Mini»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    extraInput().value = '1/0';
    extraInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({});
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('número');
  });

  it('rejects a non-positive extra value without committing', () => {
    const { input } = setup();
    type(input, 'Grande extra');
    options().find((o) => o.textContent?.includes('Añadir «Grande extra»'))!.click();
    fixture.detectChanges();
    options().find((o) => o.textContent?.trim() === 'Molde')!.click();
    fixture.detectChanges();

    extraInput().value = '0';
    extraInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({});
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('mayor que 0');
  });

  it('holds one chip per group at the same time (portions + mold simultaneously)', () => {
    const { input } = setup();
    open(input);
    options().find((o) => o.textContent?.includes('20'))!.click();
    fixture.detectChanges();

    open(input);
    options().find((o) => o.textContent?.includes('Pequeño'))!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({ portions: '20', mold: 'Pequeño' });
  });

  it('picking the last pending type closes the panel with a transient hint instead of an empty list', () => {
    const { input } = setup();
    open(input);
    options().find((o) => o.textContent?.includes('20'))!.click();
    fixture.detectChanges();
    open(input);
    options().find((o) => o.textContent?.includes('Pequeño'))!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.last).toEqual({ portions: '20', mold: 'Pequeño' });
    expect(document.querySelector('[role="listbox"]')).toBeNull(); // no queda un panel vacío abierto
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Ya elegiste todas');
  });

  it('focusing again once everything is picked shows the hint instead of reopening an empty panel', () => {
    const { input } = setup();
    open(input);
    options().find((o) => o.textContent?.includes('20'))!.click();
    fixture.detectChanges();
    open(input);
    options().find((o) => o.textContent?.includes('Pequeño'))!.click();
    fixture.detectChanges();

    open(input); // todo ya elegido → no debe abrir un listbox vacío
    fixture.detectChanges();

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Ya elegiste todas');
  });

  it('the hint disappears on its own after a while', () => {
    vi.useFakeTimers();
    try {
      const { input } = setup();
      open(input);
      options().find((o) => o.textContent?.includes('20'))!.click();
      fixture.detectChanges();
      open(input);
      options().find((o) => o.textContent?.includes('Pequeño'))!.click();
      fixture.detectChanges();

      expect(document.querySelector('[role="status"]')).toBeTruthy();

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(document.querySelector('[role="status"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
