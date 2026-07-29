import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CurrencyInput } from './currency-input';

const meta: Meta<CurrencyInput> = {
  title: 'Components/CurrencyInput',
  component: CurrencyInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-currency-input` es el campo monetario: muestra el **símbolo de moneda como ' +
          'prefijo fijo** dentro de la caja (siempre visible, atenuado y `aria-hidden`) y a ' +
          'continuación el número, que crece con el contenido.\n\n' +
          'Solo admite **dígitos y un único separador decimal** (`,` o `.`): el resto de teclas se ' +
          'bloquean en `keydown` y lo que se pega se sanea. El valor del CVA es el `string` ' +
          'numérico **sin el símbolo** — la moneda es del dominio, no del texto; formatear y ' +
          'convertir es trabajo del consumidor, aquí no hay lógica de negocio.\n\n' +
          'Igual que el resto de campos, se integra con `<migo-form-field>` por DI opcional y tiene ' +
          'las variantes **`seamless`** (celda de grilla) y **`paper`** (hoja del libro).',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-currency-input
        [symbol]="symbol"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        [invalid]="invalid"
        [disabled]="disabled"
        [seamless]="seamless"
        [paper]="paper"
      />
    `,
  }),
  argTypes: {
    symbol: {
      control: 'text',
      description:
        'Símbolo de moneda pintado como prefijo (`S/`, `€`, `$`…). Es decorativo (`aria-hidden`) y ' +
        '**no forma parte del valor**. Vacío = sin prefijo.',
      table: { defaultValue: { summary: 'S/' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de ejemplo mientras el campo está vacío (el símbolo se ve igualmente).',
      table: { defaultValue: { summary: '0.00' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible para el uso **standalone**. Se ignora dentro de un `migo-form-field`. ' +
        'Como el símbolo no se anuncia, conviene que el nombre mencione la moneda si importa.',
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
        'Variante sin borde ni fondo, para incrustarse en una **celda de grilla** (`migo-table`).',
      table: { defaultValue: { summary: 'false' } },
    },
    paper: {
      control: 'boolean',
      description:
        'Variante "papel": renglón inferior y realce cálido (`surface-warm`) al enfocar. **Gana a ' +
        '`seamless`** si se activan ambas.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    symbol: 'S/',
    placeholder: '0.00',
    ariaLabel: 'Precio de compra',
    invalid: false,
    disabled: false,
    seamless: false,
    paper: false,
  },
};
export default meta;

type Story = StoryObj<CurrencyInput>;

/**
 * Único story: recorre `symbol`, las variantes y los estados desde **Controls**. El `play`
 * comprueba lo que define a este control: solo pasan dígitos y un separador.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Precio de compra' });

    await expect(input).toBeVisible();
    await expect(canvas.getByText('S/')).toBeVisible();

    // Interacción real: escribir un importe con separador decimal.
    await userEvent.type(input, '12.50');
    await expect(input).toHaveValue('12.50');

    // Las letras se bloquean y el segundo separador se descarta: el valor queda intacto.
    await userEvent.type(input, 'abc.');
    await expect(input).toHaveValue('12.50');
  },
};
