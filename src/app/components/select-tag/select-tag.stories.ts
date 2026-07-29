import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { SelectTag, SelectTagType } from './select-tag';

const TYPES: SelectTagType[] = [
  { key: 'flavor', label: 'Sabor', values: ['Vainilla', 'Chocolate', 'Lúcuma'], allowCreate: true },
  {
    key: 'portions',
    label: 'Porciones',
    values: ['20', '40'],
    allowCreate: true,
    extraField: {
      label: 'Factor de escalado',
      placeholder: '1',
      reference: [
        { label: '20', extra: 0.5 },
        { label: '40', extra: 1 },
      ],
    },
  },
];

/** Espías de las salidas; el `play` los limpia antes de ejercer el control. */
const onValueChange = fn();
const onCreated = fn();

const meta: Meta<SelectTag> = {
  title: 'Components/SelectTag',
  component: SelectTag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-select-tag` es un campo único estilo **Select2**: una caja con los **chips** de lo ' +
          'ya elegido más un input; al enfocar o teclear abre un panel (CDK Overlay, ' +
          '`role="listbox"`) con las sugerencias **agrupadas por tipo**.\n\n' +
          'La regla que gobierna todo es **una por tipo**: un tipo que ya tiene valor desaparece de ' +
          'las opciones, y quitar su chip (cada chip lleva su propia ×) lo vuelve a ofrecer. Cuando ' +
          'no queda ningún tipo por elegir, en vez de un panel vacío aparece un aviso transitorio.\n\n' +
          '**Crear valores**: si el tipo declara `allowCreate`, al teclear algo que no existe ' +
          'aparece un único "Añadir «…»" que primero pregunta **a qué grupo** añadirlo y luego ' +
          'valida el valor con el `validate` de ese tipo. Si además declara **`extraField`**, se ' +
          'pide un dato numérico más (p. ej. un factor de escalado, que acepta fracciones como ' +
          '`1/8`) antes de confirmar — salvo que lo tecleado ya sea un número plano, en cuyo caso se ' +
          'usa tal cual. Al completarse emite **`created`** para que el consumidor lo persista con ' +
          'su propio caso de uso: el componente no llama a ningún servicio.\n\n' +
          '**No es un `ControlValueAccessor`**: el valor entra por `value` y sale por `valueChange` ' +
          'como un `Record<tipo, valor>`.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onValueChange, onCreated },
    template: `
      <migo-select-tag
        [types]="types"
        [value]="value"
        [placeholder]="placeholder"
        [ariaLabel]="ariaLabel"
        (valueChange)="onValueChange($event)"
        (created)="onCreated($event)"
      />
    `,
  }),
  argTypes: {
    types: {
      control: 'object',
      description:
        'Tipos de etiqueta ofrecidos: `{ key, label, values, allowCreate?, validate?, extraField? }`. ' +
        '`validate` es una función (devuelve el mensaje de error o `null`) y por eso no se edita ' +
        'desde este panel: se pasa desde el consumidor. `extraField.reference` son los valores ' +
        'existentes con su dato extra, que el panel muestra como contexto al pedirlo.',
      table: { defaultValue: { summary: '[]' } },
    },
    value: {
      control: 'object',
      description:
        'Valor controlado: `Record<clave de tipo, valor>`. Se sincroniza en cada cambio del input, ' +
        'así que el consumidor puede mandar el estado inicial o reponerlo.',
      table: { defaultValue: { summary: '{}' } },
    },
    placeholder: {
      control: 'text',
      description:
        'Texto del input **cuando no hay ningún chip**. Vacío = se genera uno a partir del ' +
        'siguiente tipo pendiente ("Añade sabor…"); con chips no se muestra placeholder.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible del input. Se ignora dentro de un `migo-form-field` (manda su `<label>`).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
  },
  args: {
    types: TYPES,
    value: {},
    placeholder: 'Añade una característica…',
    ariaLabel: 'Características de la receta',
  },
};
export default meta;

type Story = StoryObj<SelectTag>;

/**
 * Único story: elige un valor existente, prueba a teclear algo nuevo para ver el flujo de creación
 * (grupo → dato extra) y quita chips con su ×. Los tipos y el valor se editan desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Características de la receta' });
    onValueChange.mockClear();
    onCreated.mockClear();

    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    // Interacción real: enfocar abre el panel con los valores de los tipos pendientes.
    await userEvent.click(input);
    const listbox = await screen.findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(5); // 3 sabores + 2 porciones

    // Teclear filtra por contenido y Enter elige el activo.
    await userEvent.type(input, 'choc');
    await userEvent.keyboard('{Enter}');

    // El valor elegido queda como chip, con su propio botón de quitar, y se emite hacia fuera.
    const removeChip = canvas.getByRole('button', { name: 'Quitar Sabor: Chocolate' });
    await expect(removeChip).toBeVisible();
    await expect(onValueChange).toHaveBeenLastCalledWith({ flavor: 'Chocolate' });

    // Quitar el chip vuelve a dejar el tipo disponible y emite el valor vacío.
    await userEvent.click(removeChip);
    await expect(canvas.queryByRole('button', { name: 'Quitar Sabor: Chocolate' })).toBeNull();
    await expect(onValueChange).toHaveBeenLastCalledWith({});
  },
};
