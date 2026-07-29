import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { Spacer, SpacerSize } from './spacer';

const SIZES: SpacerSize[] = ['sm', 'md', 'lg'];

const meta: Meta<Spacer> = {
  title: 'Components/Spacer',
  component: Spacer,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [Spacer, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-spacer` es un separador **horizontal** sin nada visible: una caja ' +
          '`inline-block` vacía cuyo único trabajo es añadir hueco con un ancho del tema. ' +
          'Existe porque el `migo-button` **no** separa automáticamente icono y texto: así el ' +
          'botón solo-icono queda limpio, sin hueco sobrante, y quien pone texto añade el ' +
          'espacio explícitamente.\n\n' +
          'Es decorativo (`aria-hidden="true"`) y no es focusable, así que no altera el nombre ' +
          'accesible ni el orden de tabulación del botón que lo contiene.\n\n' +
          'El story lo muestra en su uso real —entre el icono y el texto de un botón—; usa ' +
          '**Controls** para ver `size` y `hideOnMobile`. Para comprobar `hideOnMobile` reduce el ' +
          'viewport por debajo de 640px: el hueco desaparece con el texto que se oculta en móvil.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onClick: fn() },
    template: `
      <button migo-button variant="secondary" (click)="onClick()">
        <migo-icon icon-leading name="mat:edit" size="sm" />
        <migo-spacer [size]="size" [hideOnMobile]="hideOnMobile" />
        Editar
      </button>
    `,
  }),
  argTypes: {
    size: {
      control: 'select',
      options: SIZES,
      description:
        'Ancho del hueco, en la escala del tema: `sm` (4px) · `md` (8px) · `lg` (12px). No ' +
        'admite medidas arbitrarias: si hace falta otro paso, se añade al tema.',
      table: { defaultValue: { summary: 'md' } },
    },
    hideOnMobile: {
      control: 'boolean',
      description:
        'Oculta el hueco en móvil y lo devuelve en `sm+`. Pensado para botones que en móvil ' +
        'esconden su texto y dejan solo el icono: el spacer se va con el texto y el botón no ' +
        'queda descuadrado.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    size: 'md',
    hideOnMobile: false,
  },
};
export default meta;

type Story = StoryObj<Spacer>;

/** Único story: recorre `size` y `hideOnMobile` desde **Controls**. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spacer = canvasElement.querySelector('migo-spacer');

    // Decorativo: no aporta nombre accesible al botón que lo contiene.
    const button = canvas.getByRole('button', { name: 'Editar' });
    await expect(button).toBeVisible();
    await expect(spacer).toHaveAttribute('aria-hidden', 'true');

    // Su razón de ser: ocupa ancho real entre el icono y el texto.
    await expect(spacer!.getBoundingClientRect().width).toBeGreaterThan(0);

    // Interacción real: el spacer no roba el foco ni el clic del botón.
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};
