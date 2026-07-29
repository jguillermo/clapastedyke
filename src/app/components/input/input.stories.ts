import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { InputField, InputType } from './input';

const TYPES: InputType[] = ['text', 'email', 'password', 'number', 'search', 'tel', 'url'];

const meta: Meta<InputField> = {
  title: 'Components/Input',
  component: InputField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-input` es el control de texto del design system. Implementa ' +
          '**`ControlValueAccessor`**, así que enchufa tal cual con Reactive Forms ' +
          '(`formControlName`, `[formControl]`) o `ngModel`; el valor que viaja es `string`.\n\n' +
          'Se usa normalmente **dentro de `<migo-form-field>`**, del que toma por DI opcional el ' +
          '`id`, el `aria-describedby` y el estado inválido — ver el story de ' +
          '[FormField](?path=/docs/components-formfield--docs). Este story lo muestra **standalone** ' +
          'para poder recorrer sus propios inputs: en ese modo la accesibilidad depende de ' +
          '`ariaLabel` (por eso el story lo trae puesto, aunque el default del componente sea vacío).\n\n' +
          '`invalid` y `disabled` existen para el uso standalone: con Reactive Forms el estado ' +
          'inválido lo pinta el `migo-form-field` a partir del error y el deshabilitado lo gestiona ' +
          'el `FormControl` (`control.disable()`), no este input.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-input
        [type]="type"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        [invalid]="invalid"
        [disabled]="disabled"
      />
    `,
  }),
  argTypes: {
    type: {
      control: 'select',
      options: TYPES,
      description:
        'Tipo del `<input>` nativo: gobierna el teclado en móvil y la validación del navegador. ' +
        'Ojo: `password` y `number` cambian el rol accesible del elemento (`number` es ' +
        '`spinbutton`, `password` no tiene rol de textbox).',
      table: { defaultValue: { summary: 'text' } },
    },
    placeholder: {
      control: 'text',
      description:
        'Texto de ejemplo dentro del campo. **No sustituye al label**: es una pista que desaparece ' +
        'al escribir, así que el nombre accesible sigue viniendo del `migo-form-field` o de ' +
        '`ariaLabel`.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible para el uso **standalone**. Se ignora dentro de un `migo-form-field` ' +
        '(manda su `<label>`, y duplicar el nombre sería peor).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Fuerza el estado inválido (borde y anillo de foco en rojo + `aria-invalid`) sin un ' +
        '`migo-form-field` que lo provea. Dentro de un campo, basta con darle `error` al campo.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description:
        'Deshabilita el control en uso standalone. Con Reactive Forms usa `control.disable()`: el ' +
        'CVA lo recibe por `setDisabledState` y este input no hace falta.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    type: 'text',
    placeholder: 'Harina de trigo',
    ariaLabel: 'Nombre del insumo',
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<InputField>;

/** Único story: recorre `type`, `placeholder`, `ariaLabel`, `invalid` y `disabled` desde **Controls**. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Standalone, el nombre accesible viene de `ariaLabel`.
    const input = canvas.getByRole('textbox', { name: 'Nombre del insumo' });
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(input).not.toHaveAttribute('aria-invalid');

    // Interacción real: escribir actualiza el valor del control (lo que el CVA propaga al form).
    await userEvent.type(input, 'Azúcar rubia');
    await expect(input).toHaveValue('Azúcar rubia');
  },
};
