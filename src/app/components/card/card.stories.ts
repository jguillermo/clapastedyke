import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';
import { Card, CardElevation, CardVariant } from './card';
import { CardBody } from './card-body';
import { CardFooter } from './card-footer';
import { CardHeader } from './card-header';
import { CardSubtitle } from './card-subtitle';
import { CardTitle } from './card-title';

const VARIANTS: CardVariant[] = ['elevated', 'outlined', 'filled', 'warm'];
const ELEVATIONS: CardElevation[] = ['sm', 'md', 'lg'];

const meta: Meta<Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, Button, Icon],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-card` es la **superficie de maquetación** del design system y la vista que ' +
          'normalmente se monta dentro de un `MigoDialog` (el shell del diálogo es transparente y ' +
          'no aporta chrome: el card es quien pone la superficie).\n\n' +
          'Se compone por partes, cada una con su propio padding — el `migo-card` no lleva ' +
          'ninguno: **`migo-card-header`** (con los slots `[card-icon]` y `[card-actions]`), ' +
          '**`migo-card-title`** (un `<h3>` real, por eso tiene rol `heading`), ' +
          '**`migo-card-subtitle`**, **`migo-card-body`** y **`migo-card-footer`**. Estas partes no ' +
          'tienen inputs, así que no aparecen en Controls: se documentan y se prueban aquí, en la ' +
          'composición completa, que es la única forma en que se usan.\n\n' +
          'Dos inputs merecen atención: **`interactive`** convierte el card en un objetivo clicable ' +
          '(`tabindex=0`, hover que eleva y anillo de foco) — úsalo solo si toda la tarjeta lleva a ' +
          'un sitio; y **`fill`** es el modo mobile-first para diálogo: el card llena su contenedor ' +
          'en columna, el `migo-card-body` pasa a ser la **única** zona scrollable y header/footer ' +
          'quedan fijos (pierde el radio en móvil). `fill` solo se nota si el contenedor tiene ' +
          'altura, así que en este story el efecto visible es que el card deja de encoger al ' +
          'contenido.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onClose: fn(), onCancel: fn(), onSave: fn() },
    template: `
      <migo-card
        [variant]="variant"
        [elevation]="elevation"
        [interactive]="interactive"
        [fill]="fill"
      >
        <migo-card-header>
          <migo-icon card-icon name="mat:layers" size="lg" />
          <migo-card-title>Bizcocho de vainilla</migo-card-title>
          <migo-card-subtitle>Receta base · 6 insumos</migo-card-subtitle>
          <button
            migo-button
            card-actions
            variant="ghost"
            aria-label="Cerrar"
            (click)="onClose()"
          >
            <migo-icon icon-leading name="mat:close" size="sm" />
          </button>
        </migo-card-header>
        <migo-card-body>
          Rinde un molde de 24 cm. Ajusta las cantidades desde la conversión de tamaños.
        </migo-card-body>
        <migo-card-footer>
          <button migo-button variant="ghost" (click)="onCancel()">Cancelar</button>
          <button migo-button (click)="onSave()">Guardar</button>
        </migo-card-footer>
      </migo-card>
    `,
  }),
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      description:
        'Superficie del card: `elevated` (fondo de tarjeta + sombra) · `outlined` (borde, sin ' +
        'sombra) · `filled` (fondo hundido, sin borde) · `warm` (papel cálido, para superficies ' +
        'que imitan la hoja del libro).',
      table: { defaultValue: { summary: 'elevated' } },
    },
    elevation: {
      control: 'select',
      options: ELEVATIONS,
      description:
        'Nivel de sombra (`shadow-sm/md/lg`). **Solo aplica a `variant="elevated"`**: en ' +
        '`outlined`, `filled` y `warm` se ignora.',
      table: { defaultValue: { summary: 'md' } },
    },
    interactive: {
      control: 'boolean',
      description:
        'Hace la tarjeta clicable: añade `tabindex="0"`, cursor, hover que eleva y ' +
        'anillo de foco visible. Ojo: el card **no** emite ningún evento propio — el consumidor ' +
        'engancha el clic y, si el card contiene botones, cuida que no compitan.',
      table: { defaultValue: { summary: 'false' } },
    },
    fill: {
      control: 'boolean',
      description:
        'Modo diálogo (mobile-first): el card llena su contenedor en columna, solo el ' +
        '`migo-card-body` scrollea y header/footer quedan fijos. Sin radio en móvil, con radio en ' +
        '`sm+`.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    variant: 'elevated',
    elevation: 'md',
    interactive: false,
    fill: false,
  },
};
export default meta;

type Story = StoryObj<Card>;

/**
 * Único story: la composición completa (header con icono y acciones, título, subtítulo, body y
 * footer). Recorre `variant`, `elevation`, `interactive` y `fill` desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // `migo-card-title` es un <h3> real: se comprueba por rol, no por clase.
    await expect(canvas.getByRole('heading', { name: 'Bizcocho de vainilla' })).toBeVisible();
    await expect(canvas.getByText('Receta base · 6 insumos')).toBeVisible();
    await expect(canvas.getByText(/Rinde un molde de 24 cm/)).toBeVisible();

    // La acción del header se proyecta en `[card-actions]` y conserva su nombre accesible.
    await expect(canvas.getByRole('button', { name: 'Cerrar' })).toBeVisible();

    // Interacción real: el botón del footer sigue siendo un botón nativo funcional.
    const save = canvas.getByRole('button', { name: 'Guardar' });
    await userEvent.click(save);
    await expect(save).toHaveFocus();
  },
};
