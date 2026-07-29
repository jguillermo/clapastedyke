import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Autocomplete } from './autocomplete';

const SUGGESTIONS: string[] = [
  'Harina de trigo',
  'Harina de maíz',
  'Harina sin gluten',
  'Azúcar rubia',
  'Mantequilla sin sal',
  'Esencia de vainilla',
];

const meta: Meta<Autocomplete> = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-autocomplete` es un campo de texto con **completado fantasma en línea**: al ' +
          'escribir, el resto de la primera sugerencia que **empieza por** lo tecleado aparece ' +
          'tenue dentro del propio campo. Se acepta con **Tab**, **Enter** o **→** (con el cursor ' +
          'al final) y respeta la capitalización de la sugerencia. **No tiene desplegable ni ' +
          'overlay**: si necesitas elegir entre varias coincidencias, ese es ' +
          '[Combobox](?path=/docs/components-combobox--docs).\n\n' +
          'El fantasma es decorativo (`aria-hidden`) y se pinta con una copia invisible de lo ' +
          'tecleado, para quedar alineado exactamente con el texto real. El campo declara ' +
          '`aria-autocomplete="inline"`.\n\n' +
          'Es **presentacional**: las sugerencias llegan por `suggestions` (el consumidor las saca ' +
          'del dominio) y el componente no sabe de dónde vienen ni las ordena. Implementa ' +
          '`ControlValueAccessor` (valor `string`) y tiene las variantes **`seamless`** (celda de ' +
          'grilla) y **`paper`** (hoja del libro).',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-autocomplete
        [suggestions]="suggestions"
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
    suggestions: {
      control: 'object',
      description:
        'Lista de sugerencias. Se completa **por prefijo** (case-insensitive) y gana la **primera** ' +
        'coincidencia del array — el orden lo decide el consumidor, aquí no se reordena.',
      table: { defaultValue: { summary: '[]' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de ejemplo mientras el campo está vacío.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible para el uso **standalone**. Se ignora dentro de un `migo-form-field` ' +
        '(manda su `<label>`).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Fuerza el estado inválido (borde/anillo en rojo + `aria-invalid`) sin un ' +
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
        'Variante sin borde ni fondo para incrustarse en una **celda de grilla**. El fantasma ' +
        'ajusta su padding para seguir alineado.',
      table: { defaultValue: { summary: 'false' } },
    },
    paper: {
      control: 'boolean',
      description:
        'Variante "papel": renglón inferior y realce cálido al enfocar. **Gana a `seamless`** si ' +
        'se activan ambas.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    suggestions: SUGGESTIONS,
    placeholder: 'Harina',
    ariaLabel: 'Insumo',
    invalid: false,
    disabled: false,
    seamless: false,
    paper: false,
  },
};
export default meta;

type Story = StoryObj<Autocomplete>;

/**
 * Único story: escribe `har` en el campo para ver el fantasma y acéptalo con Tab / Enter / →.
 * Recorre las variantes y los estados desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Insumo' });

    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('aria-autocomplete', 'inline');

    // Interacción real: al teclear un prefijo aparece el sufijo fantasma de la 1ª coincidencia.
    await userEvent.type(input, 'har');
    await expect(canvas.getByText('ina de trigo')).toBeVisible();

    // Tab acepta la sugerencia completa (con su capitalización) sin salir del campo.
    await userEvent.keyboard('{Tab}');
    await expect(input).toHaveValue('Harina de trigo');

    // Aceptada la sugerencia exacta, ya no hay nada que completar.
    await expect(canvas.queryByText('ina de trigo')).toBeNull();
  },
};
