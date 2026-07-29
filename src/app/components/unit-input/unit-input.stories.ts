import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnitInput } from './unit-input';

/** Espía de la salida `unitToken`; el `play` lo limpia antes de ejercer el control. */
const onUnitToken = fn();

const meta: Meta<UnitInput> = {
  title: 'Components/UnitInput',
  component: UnitInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-unit-input` es el campo numérico que muestra la **unidad dentro del input, pegada ' +
          'al número** (no a un lado): el número crece con el contenido y la unidad lo sigue, así ' +
          '`8` porciones se lee `8u` y no `8   u`. La unidad solo aparece cuando hay valor.\n\n' +
          'Es **presentacional**: la unidad la calcula el consumidor a partir del dominio y llega ' +
          'por `unit`; el componente no interpreta ni convierte nada. El **valor del CVA es solo ' +
          'el número** (`string`): las letras nunca se escriben — teclear `k`, `g` o `u` emite ' +
          '`unitToken` para que el consumidor fije la unidad, y cualquier otra letra se bloquea. ' +
          'Al pegar texto se sanea a dígitos con un único separador decimal.\n\n' +
          'Variantes de incrustación: **`seamless`** (sin borde, para una celda de `migo-table`) y ' +
          '**`paper`** (renglón inferior + realce cálido, para integrarse a una hoja del libro).',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onUnitToken },
    template: `
      <migo-unit-input
        [unit]="unit"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        [invalid]="invalid"
        [disabled]="disabled"
        [seamless]="seamless"
        [paper]="paper"
        (unitToken)="onUnitToken($event)"
      />
    `,
  }),
  argTypes: {
    unit: {
      control: 'text',
      description:
        'Unidad mostrada junto al número (`kg`, `g`, `u`…). La resuelve el **consumidor** desde el ' +
        'dominio; el componente solo la pinta, y únicamente cuando el campo tiene valor.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de ejemplo mientras el campo está vacío (con el campo vacío no hay unidad).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible para el uso **standalone**. Se ignora dentro de un `migo-form-field` ' +
        '(manda su `<label>`). Nota: la unidad es `aria-hidden`, así que conviene que el nombre ' +
        'diga qué se mide.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Fuerza el estado inválido (borde y anillo de foco en rojo + `aria-invalid`) sin un ' +
        '`migo-form-field` que lo provea.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description:
        'Deshabilita el control en uso standalone. Con Reactive Forms usa `control.disable()`.',
      table: { defaultValue: { summary: 'false' } },
    },
    seamless: {
      control: 'boolean',
      description:
        'Variante sin borde ni fondo, para incrustarse en una **celda de grilla** ' +
        '(`migo-table`): el realce aparece solo al enfocar.',
      table: { defaultValue: { summary: 'false' } },
    },
    paper: {
      control: 'boolean',
      description:
        'Variante "papel": renglón inferior y realce cálido (`surface-warm`) al enfocar, para ' +
        'integrarse a una hoja del libro. **Gana a `seamless`** si se activan ambas.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    unit: 'kg',
    placeholder: '1',
    ariaLabel: 'Cantidad',
    invalid: false,
    disabled: false,
    seamless: false,
    paper: false,
  },
};
export default meta;

type Story = StoryObj<UnitInput>;

/**
 * Único story: recorre `unit`, las variantes (`seamless`, `paper`) y los estados desde
 * **Controls**. El `play` comprueba lo que define a este control: las letras no se escriben.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Cantidad' });
    onUnitToken.mockClear();

    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');

    // Interacción real: escribir el número. La unidad aparece solo cuando hay valor.
    await userEvent.type(input, '250');
    await expect(input).toHaveValue('250');
    await expect(canvas.getByText('kg')).toBeVisible();

    // Teclear la inicial de una unidad NO escribe la letra: emite el token para el consumidor.
    await userEvent.type(input, 'g');
    await expect(input).toHaveValue('250');
    await expect(onUnitToken).toHaveBeenCalledWith('g');

    // Cualquier otra letra se bloquea sin emitir nada.
    await userEvent.type(input, 'x');
    await expect(input).toHaveValue('250');
    await expect(onUnitToken).toHaveBeenCalledTimes(1);
  },
};
