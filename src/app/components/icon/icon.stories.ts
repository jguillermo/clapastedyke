import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Icon, IconColor, IconSize } from './icon';
import { IconName } from './icon.registry';

/** Todos los iconos registrados hoy en `icon.registry.ts` (el `name` es tipado). */
const NAMES: IconName[] = [
  'mat:check',
  'mat:close',
  'mat:expand_more',
  'mat:expand_less',
  'mat:chevron_right',
  'mat:warning',
  'mat:error',
  'mat:info',
  'mat:home',
  'mat:add',
  'mat:search',
  'mat:settings',
  'mat:arrow_back',
  'mat:layers',
  'mat:edit',
];
const SIZES: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const COLORS: IconColor[] = [
  'current',
  'brand',
  'body',
  'heading',
  'muted',
  'accent',
  'fresh',
  'celebrate',
  'success',
  'warning',
  'error',
  'info',
  'on-brand',
];

const meta: Meta<Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-icon` es el **único** modo de pintar un icono en la app: lee un registro tipado ' +
          '(`icon.registry.ts`) y lo emite como `<svg fill="currentColor">`. Nunca se incrustan ' +
          '`<svg>` sueltos en una plantilla. El `name` lleva el **prefijo de su librería** ' +
          '(`mat:` para Material Design, `custom:` para iconos propios) y es ' +
          '`input.required<IconName>`, así que un nombre inexistente **no compila**.\n\n' +
          'Es **decorativo por defecto** (`aria-hidden="true"`, sin rol): el texto que lo acompaña ' +
          'es quien nombra la acción. Al darle `ariaLabel` pasa a `role="img"` + `aria-label` y sí ' +
          'aparece en el árbol de accesibilidad — úsalo solo cuando el icono es la única ' +
          'información.\n\n' +
          'Recorre `name`, `size`, `color` y `ariaLabel` desde el panel **Controls**. El tamaño y el ' +
          'color viven en el `<svg>` interior, así que las clases de animación (`rotate-180`, ' +
          '`opacity-*`, `transition-*`) las pone el consumidor sobre el propio `<migo-icon>` sin ' +
          'colisionar con el tamaño.',
      },
    },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <migo-icon [name]="name" [size]="size" [color]="color" [ariaLabel]="ariaLabel" />
    `,
  }),
  argTypes: {
    name: {
      control: 'select',
      options: NAMES,
      description:
        'Nombre **prefijado** del icono en el registro (`mat:…` / `custom:…`). Requerido y ' +
        'tipado: un nombre no registrado es error de compilación. Para añadir uno, copia su `path` ' +
        'oficial a `IconName` + `ICON_PATHS` en `icon.registry.ts`.',
    },
    size: {
      control: 'select',
      options: SIZES,
      description:
        'Tamaño del glifo: `xs` (14px) · `sm` (16px) · `md` (20px) · `lg` (24px) · `xl` (32px). ' +
        'Un icono **no** cumple por sí solo el target táctil de 44px: si es clicable, envuélvelo ' +
        'en un `<button migo-button>`.',
      table: { defaultValue: { summary: 'md' } },
    },
    color: {
      control: 'select',
      options: COLORS,
      description:
        'Color semántico del tema. `current` hereda el color de texto del contenedor vía ' +
        '`currentColor` — es lo correcto dentro de un botón o un enlace.',
      table: { defaultValue: { summary: 'current' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Etiqueta accesible. Vacío (default) → icono **decorativo**: `aria-hidden="true"` y sin ' +
        'rol. Con texto → `role="img"` + `aria-label`, y el icono se anuncia al lector de pantalla.',
      table: { defaultValue: { summary: '(vacío)' } },
    },
  },
  args: {
    name: 'mat:layers',
    size: 'md',
    color: 'brand',
    ariaLabel: '',
  },
};
export default meta;

type Story = StoryObj<Icon>;

/**
 * Único story: cambia `name`, `size`, `color` y `ariaLabel` desde **Controls** en lugar de tener
 * un export por icono o por variante.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const icon = canvasElement.querySelector('migo-icon');

    await expect(icon).toBeVisible();
    await expect(icon?.querySelector('svg')).toBeTruthy();

    // Sin `ariaLabel` es decorativo: oculto al árbol de accesibilidad y sin rol `img`.
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryByRole('img')).toBeNull();

    // Interacción real: no es un control — el tabulador no debe pararse en él.
    await userEvent.tab();
    await expect(icon).not.toHaveFocus();
  },
};
