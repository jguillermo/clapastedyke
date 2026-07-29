import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Select, SelectOption } from './select';

const OPTIONS: SelectOption[] = [
  { value: 'vanilla', label: 'Vainilla' },
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'lucuma', label: 'Lúcuma' },
  { value: 'red-velvet', label: 'Red velvet', disabled: true },
];

const meta: Meta<Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-select` es el desplegable de selección única del design system. El disparador es ' +
          'un `<button>` con `aria-haspopup="listbox"` y `aria-expanded`; el panel se abre en un ' +
          '**CDK Overlay** y es un **`cdkListbox`**, que aporta el teclado completo (↑/↓, Home/End, ' +
          'type-ahead), los roles ARIA (`listbox`/`option`) y el foco atrapado. Esc y el clic fuera ' +
          'cierran.\n\n' +
          'Detalle de diseño propio: una vez elegida una opción, su label se pinta como una ' +
          '**píldora/tag** dentro del disparador en lugar de texto plano — es la señal de que la ' +
          'selección "quedó puesta". Sin selección se ve el `placeholder`.\n\n' +
          'Implementa `ControlValueAccessor` (valor `string | null`) y se integra con ' +
          '`<migo-form-field>` por DI opcional. El panel se monta **fuera** del componente (en el ' +
          'overlay del CDK), así que en los tests se busca en `document` y siempre por rol.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-select
        [options]="options"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        [invalid]="invalid"
        [disabled]="disabled"
      />
    `,
  }),
  argTypes: {
    options: {
      control: 'object',
      description:
        'Opciones del panel: `{ value, label, disabled? }`. El `value` es lo que viaja al ' +
        '`FormControl`; el `label` es lo que se ve (y lo que se pinta como píldora al elegirlo). ' +
        'Una opción con `disabled: true` se muestra atenuada con `aria-disabled` y no se puede ' +
        'elegir ni con teclado.',
      table: { defaultValue: { summary: '[]' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto del disparador mientras no hay selección.',
      table: { defaultValue: { summary: 'Selecciona…' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible del disparador para el uso **standalone**. Se ignora dentro de un ' +
        '`migo-form-field` (manda su `<label>`).',
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
        'Deshabilita el disparador: no abre el panel. Con Reactive Forms usa `control.disable()`.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    options: OPTIONS,
    placeholder: 'Elige un sabor',
    ariaLabel: 'Sabor de la receta',
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Select>;

/**
 * Único story: abre el panel y elige una opción; `Red velvet` está deshabilitada a propósito para
 * ver ese estado. Recorre `placeholder`, `invalid` y `disabled` desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Sabor de la receta' });

    // Estado inicial: cerrado, sin selección → se ve el placeholder.
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Elige un sabor')).toBeVisible();

    // Interacción real: abrir el panel (vive en el overlay del CDK, fuera del canvas).
    await userEvent.click(trigger);
    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    await expect(options).toHaveLength(4);
    await expect(options[3]).toHaveAttribute('aria-disabled', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Elegir una opción cierra el panel y deja el label como píldora en el disparador.
    await userEvent.click(within(listbox).getByRole('option', { name: 'Chocolate' }));
    await waitFor(async () => {
      await expect(screen.queryByRole('listbox')).toBeNull();
    });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(within(trigger).getByText('Chocolate')).toBeVisible();
  },
};
