import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Badge, BadgeSize } from './badge';

const SIZES: BadgeSize[] = ['xs', 'sm'];

const meta: Meta<Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-badge` es una **píldora presentacional** para una característica corta — el sabor ' +
          'o el tamaño de una receta, por ejemplo. El texto es contenido proyectado; no tiene ' +
          'estado, no es un control de formulario (sin `ControlValueAccessor`) y no es ' +
          'interactivo: no se puede hacer clic ni recibe foco. Si necesitas una etiqueta que se ' +
          'pueda quitar o seleccionar, eso es un `migo-chip` (todavía no existe en la librería).\n\n' +
          'Una sola variante visual (neutral sobre `surface-sunken`); lo único que cambia es el ' +
          '`size` desde **Controls**: `sm` para una píldora aislada, `xs` cuando van varias juntas ' +
          'bajo un título.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `<migo-badge [size]="size">Vainilla</migo-badge>`,
  }),
  argTypes: {
    size: {
      control: 'select',
      options: SIZES,
      description:
        'Compacidad de la píldora: `sm` (padding holgado, para una sola) · `xs` (más compacta, ' +
        'para varias juntas). Solo cambia el padding — el tipo de letra y el color son fijos.',
      table: { defaultValue: { summary: 'sm' } },
    },
  },
  args: {
    size: 'sm',
  },
};
export default meta;

type Story = StoryObj<Badge>;

/** Único story: alterna `size` desde **Controls**. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Vainilla');

    await expect(badge).toBeVisible();

    // Es solo texto: no debe exponerse como control ni como botón.
    await expect(canvas.queryByRole('button')).toBeNull();

    // Interacción real: el tabulador no se para en una píldora presentacional.
    await userEvent.tab();
    await expect(badge).not.toHaveFocus();
  },
};
