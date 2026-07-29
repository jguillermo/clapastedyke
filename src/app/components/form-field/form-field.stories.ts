import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { InputField } from '@components/input/input';
import { FormField } from './form-field';

const meta: Meta<FormField> = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [FormField, InputField] })],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-form-field` es el contenedor de **label + hint + error** de un campo. No es un ' +
          'control: su trabajo es generar el `id`, cablear la relación ARIA (`<label for>` y ' +
          '`aria-describedby`) y reservar la región del mensaje.\n\n' +
          'El control hijo (`migo-input`, `migo-checkbox`, `migo-select`, `migo-combobox`…) se ' +
          'engancha **por DI opcional**: toma del campo su `id`, su `aria-describedby` y el estado ' +
          'inválido, sin acoplarse a él. Fuera de un `migo-form-field` los controles siguen ' +
          'funcionando y usan su propio `ariaLabel`.\n\n' +
          'Dos detalles que suelen sorprender: el `<label>` **solo se pinta si hay `label`** (así ' +
          'sirve de contenedor solo-error para controles que ya traen su etiqueta, como el ' +
          'checkbox), y **`error` gana a `hint`** — con error hay un `role="alert"` y el hint ' +
          'desaparece. Escribe algo en `error` desde **Controls** para verlo.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-form-field
        [label]="label"
        [hint]="hint"
        [error]="error"
        [required]="required"
        [reserveMessage]="reserveMessage"
      >
        <migo-input type="email" placeholder="hola@migo.com" />
      </migo-form-field>
    `,
  }),
  argTypes: {
    label: {
      control: 'text',
      description:
        'Texto del `<label>`, asociado al control hijo por `for`/`id`. **Vacío = sin `<label>`**: ' +
        'el campo queda como contenedor de solo error/hint (el caso del checkbox, que ya lleva su ' +
        'propia etiqueta).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    hint: {
      control: 'text',
      description:
        'Pista bajo el control. Se expone como `aria-describedby` del control, así que el lector ' +
        'de pantalla la lee tras el label. Se **oculta** en cuanto hay `error`.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    error: {
      control: 'text',
      description:
        'Mensaje de error. Con texto: se pinta con `role="alert"`, pasa a ser el ' +
        '`aria-describedby` del control, oculta el `hint` y marca el campo como inválido — el ' +
        'control hijo lo lee por DI y tiñe su borde. El mensaje lo decide el consumidor (aquí no ' +
        'hay validación).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    required: {
      control: 'boolean',
      description:
        'Añade el asterisco decorativo (`aria-hidden`) junto al label. **No valida ni marca ' +
        '`required` en el control**: la obligatoriedad la impone el `FormControl` del consumidor.',
      table: { defaultValue: { summary: 'false' } },
    },
    reserveMessage: {
      control: 'boolean',
      description:
        'Reserva la línea del mensaje aunque no haya error ni hint, para que mostrar un error no ' +
        'desplace la fila. Útil en grillas y formularios de varias columnas.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    label: 'Correo electrónico',
    hint: 'Te avisaremos aquí cuando la receta esté lista.',
    error: '',
    required: false,
    reserveMessage: false,
  },
};
export default meta;

type Story = StoryObj<FormField>;

/**
 * Único story: recorre `label`, `hint`, `error`, `required` y `reserveMessage` desde **Controls**
 * (escribe en `error` para ver el `role="alert"` y cómo el hint cede su sitio).
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // El campo cablea el label: el control se encuentra POR SU ETIQUETA, no por clase ni id.
    const input = canvas.getByLabelText('Correo electrónico');
    await expect(input).toBeVisible();

    // Y cablea la pista como descripción accesible del control.
    await expect(input).toHaveAccessibleDescription(
      'Te avisaremos aquí cuando la receta esté lista.',
    );

    // Sin `error` no hay alerta ni estado inválido.
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(input).not.toHaveAttribute('aria-invalid');

    // Interacción real: escribir en el control alcanzado a través de la etiqueta.
    await userEvent.type(input, 'hola@migo.com');
    await expect(input).toHaveValue('hola@migo.com');
  },
};
