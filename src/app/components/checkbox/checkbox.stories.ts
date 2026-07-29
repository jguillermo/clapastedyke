import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Checkbox } from './checkbox';

const meta: Meta<Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-checkbox` es el control booleano del design system. Implementa ' +
          '**`ControlValueAccessor`** (valor `boolean`), así que enchufa con Reactive Forms o ' +
          '`ngModel`. La etiqueta es el **contenido proyectado** y va dentro de un `<label>` real, ' +
          'de modo que el texto es zona clicable y da el nombre accesible sin ARIA extra.\n\n' +
          'Por dentro es un `<input type="checkbox">` nativo `sr-only` con la caja pintada por ' +
          'variantes `peer-*`: el estado, el foco y el teclado (Espacio) son los del navegador, no ' +
          'una reimplementación. El objetivo táctil es la fila completa (`min-h-11`).\n\n' +
          'Como ya trae su propia etiqueta, dentro de un `<migo-form-field>` se usa **sin `label`** ' +
          '— el campo actúa solo de contenedor de error/hint. Y `indeterminate` es **puramente ' +
          'visual**: pinta la barra de estado parcial pero no cambia el valor del control; el ' +
          'siguiente clic lo pone en `true`.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-checkbox [indeterminate]="indeterminate" [invalid]="invalid" [disabled]="disabled">
        Acepto los términos
      </migo-checkbox>
    `,
  }),
  argTypes: {
    indeterminate: {
      control: 'boolean',
      description:
        'Estado parcial (la barra en vez del check), para un "selecciona todo" con hijos mixtos. ' +
        'Es solo presentación: **no altera el valor** que emite el CVA.',
      table: { defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Fuerza el estado inválido (borde rojo + `aria-invalid`) sin un `migo-form-field` que lo ' +
        'provea. Dentro de un campo, basta con darle `error` al campo.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description:
        'Deshabilita el control en uso standalone (además atenúa la etiqueta y quita el cursor). ' +
        'Con Reactive Forms usa `control.disable()`.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    indeterminate: false,
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Checkbox>;

/** Único story: recorre `indeterminate`, `invalid` y `disabled` desde **Controls**. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // El nombre accesible sale del contenido proyectado, envuelto en un <label> real.
    const checkbox = canvas.getByRole('checkbox', { name: 'Acepto los términos' });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // Interacción real de teclado: el <input> nativo responde a Espacio.
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();

    // Y el texto de la etiqueta también alterna, por ser parte del <label>.
    await userEvent.click(canvas.getByText('Acepto los términos'));
    await expect(checkbox).not.toBeChecked();
  },
};
