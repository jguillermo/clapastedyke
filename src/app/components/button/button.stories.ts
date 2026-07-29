import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, ButtonSize, ButtonVariant } from './button';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const meta: Meta<Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-button` es el botón presentacional del design system: cero lógica de ' +
          'negocio, solo variantes de estilo y estado de UI. Es un atributo sobre ' +
          '`<button>`/`<a>` nativos (`button[migo-button]`, `a[migo-button]`) para conservar ' +
          'la semántica accesible. Usa el panel **Controls** de abajo para recorrer todas las ' +
          'combinaciones de `variant`, `size` y estado (`loading`, `block`, `disabled`).',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onClick: fn() },
    template: `
      <button
        migo-button
        [variant]="variant"
        [size]="size"
        [loading]="loading"
        [block]="block"
        [disabled]="disabled"
        (click)="onClick()"
      >
        Guardar
      </button>
    `,
  }),
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      description: 'Estilo visual del botón.',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: SIZES,
      description:
        'Altura y padding del botón. `md` (44px) es el único tamaño que cumple por sí solo ' +
        'el target táctil ≥44px exigido en móvil.',
      table: { defaultValue: { summary: 'md' } },
    },
    loading: {
      control: 'boolean',
      description: 'Muestra un spinner y marca `aria-busy`; el botón queda deshabilitado.',
    },
    block: {
      control: 'boolean',
      description: 'Ocupa el 100% del ancho disponible del contenedor (`flex w-full`).',
    },
    disabled: {
      control: 'boolean',
      description: 'Deshabilita el botón nativo y añade `aria-disabled`.',
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    block: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Button>;

/**
 * Único story: usa los **Controls** (`variant`, `size`, `loading`, `block`, `disabled`) para
 * ver cada variante y estado en vivo, en lugar de un export fijo por combinación.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Guardar' });

    await expect(button).toBeVisible();
    await expect(button).not.toHaveAttribute('disabled');
    await expect(button).not.toHaveAttribute('aria-disabled');

    await userEvent.click(button);
  },
};
