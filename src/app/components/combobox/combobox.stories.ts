import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Combobox } from './combobox';

const SUGGESTIONS: string[] = [
  'Harina de trigo',
  'Harina de maíz',
  'Harina sin gluten',
  'Azúcar rubia',
  'Mantequilla sin sal',
];

/** Espía de la salida `selected`; el `play` lo limpia antes de ejercer el control. */
const onSelected = fn();

const meta: Meta<Combobox> = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-combobox` es el campo de texto con sugerencias que **cambia de modo según cuántas ' +
          'coincidencias haya**:\n\n' +
          '- **1 coincidencia que empieza por** lo escrito → **fantasma en línea** (el resto ' +
          'aparece tenue dentro del campo; se acepta con Tab / Enter / →), con el scroll ' +
          'sincronizado para que no se desalinee con nombres largos.\n' +
          '- **2+ coincidencias**, o **1 que solo contiene** lo escrito → **desplegable** debajo ' +
          '(CDK Overlay + `role="listbox"`), navegable con ↑/↓, Enter, Tab y Esc.\n\n' +
          'Ojo a la asimetría: el desplegable busca **por contenido** (substring), el fantasma solo ' +
          'puede completar **por prefijo**. El panel se monta en un overlay **fuera** del ' +
          'componente, así que en los tests se busca en `document`, no en el canvas.\n\n' +
          'La salida **`selected`** se emite solo cuando la selección **termina** (Tab / Enter o ' +
          'clic en el desplegable), **no** al completar en línea con →: así el consumidor puede ' +
          'avanzar el foco al siguiente campo (es lo que hace la grilla de insumos al pasar a la ' +
          'columna de cantidad). Implementa `ControlValueAccessor` (valor `string`).',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onSelected },
    template: `
      <migo-combobox
        [suggestions]="suggestions"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        [invalid]="invalid"
        [disabled]="disabled"
        [seamless]="seamless"
        [paper]="paper"
        (selected)="onSelected($event)"
      />
    `,
  }),
  argTypes: {
    suggestions: {
      control: 'object',
      description:
        'Lista de sugerencias. El desplegable filtra **por contenido** (substring, ' +
        'case-insensitive) y excluye la coincidencia exacta; el orden del array es el orden del ' +
        'panel.',
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
        'Variante sin borde ni fondo para incrustarse en una **celda de grilla** — es así como lo ' +
        'usa `migo-table` en la grilla de insumos.',
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
    ariaLabel: 'Ingrediente',
    invalid: false,
    disabled: false,
    seamless: false,
    paper: false,
  },
};
export default meta;

type Story = StoryObj<Combobox>;

/**
 * Único story: escribe `harina` para ver el **desplegable** (3 coincidencias) y `azú` para ver el
 * **fantasma** (1 coincidencia por prefijo). Recorre variantes y estados desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Ingrediente' });
    onSelected.mockClear();

    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    // Interacción real: 3 coincidencias → modo desplegable. El panel vive en un overlay del CDK,
    // fuera del canvas, así que se busca en `document` y por rol.
    await userEvent.type(input, 'harina');
    const listbox = await screen.findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(3);
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // Teclado: ↓ mueve el activo y Enter lo elige — eso **termina** la selección.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(input).toHaveValue('Harina de maíz');
    await expect(onSelected).toHaveBeenCalledWith('Harina de maíz');

    // Elegida la opción, el panel se cierra.
    await waitFor(async () => {
      await expect(screen.queryByRole('listbox')).toBeNull();
    });
  },
};
