import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@components/button/button';
import { Alert, AlertLive, AlertVariant } from './alert';

const VARIANTS: AlertVariant[] = ['info', 'success', 'warning', 'error'];
const LIVE: AlertLive[] = ['auto', 'polite', 'assertive', 'off'];

const meta: Meta<Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-alert` es el aviso **en línea**: un mensaje con peso semántico que se queda en la ' +
          'página, a diferencia de un toast, que pasa. Lleva icono por variante, título opcional, ' +
          'cuerpo proyectado y una fila de acciones en el slot `[alert-actions]`.\n\n' +
          '**El texto va en `text-body`, no en el color de la variante.** Sobre `bg-*-soft`, un ' +
          '`text-error` se queda por debajo del 4.5:1 de WCAG AA. Y el significado nunca lo lleva ' +
          'el color solo (WCAG 1.4.1) — para eso existe `heading`.\n\n' +
          'Cambia `variant` desde Controls y mira cómo cambia también el **rol ARIA**: ' +
          '`error`/`warning` → `role="alert"` (interrumpe), `info`/`success` → `role="status"` ' +
          '(espera turno).\n\n' +
          '`live="off"` lo saca de las regiones vivas. Es lo correcto cuando el aviso **ya está en ' +
          'el DOM al montarse su contenedor** (el cuerpo de un diálogo): si no, el lector de ' +
          'pantalla lo lee dos veces — una al enfocar el diálogo y otra por la región viva.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onRetry: fn() },
    moduleMetadata: { imports: [Button] },
    template: `
      <migo-alert [variant]="variant" [live]="live" [heading]="heading" [iconless]="iconless">
        <p>La API de Apps Script está desactivada en tu cuenta de Google.</p>
        <div alert-actions>
          <button migo-button type="button" variant="secondary" (click)="onRetry()">
            Ya lo he activado, reintentar
          </button>
        </div>
      </migo-alert>
    `,
  }),
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      description:
        'Peso semántico. Decide el icono, el color del borde y —salvo que fijes `live`— el rol ARIA.',
      table: { defaultValue: { summary: 'info' } },
    },
    live: {
      control: 'select',
      options: LIVE,
      description:
        '`auto` deriva el rol de la variante. `off` lo saca de las regiones vivas: úsalo cuando el ' +
        'aviso ya está montado al aparecer su contenedor, para que no se lea dos veces.',
      table: { defaultValue: { summary: 'auto' } },
    },
    heading: {
      control: 'text',
      description:
        'Título breve sobre el cuerpo. Es lo que evita que el color sea el único indicio del ' +
        'significado (WCAG 1.4.1).',
      table: { defaultValue: { summary: "''" } },
    },
    iconless: {
      control: 'boolean',
      description: 'Quita el icono, para avisos apilados o listas densas.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: { variant: 'warning', live: 'auto', heading: 'Falta un paso', iconless: false },
};
export default meta;

type Story = StoryObj<Alert>;

/** Único story: recorre variantes, urgencia y título desde el panel Controls. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Por rol, nunca por clase de utilidad. `warning` (el arg por defecto) ⇒ role="alert".
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Falta un paso');
    await expect(alert).toHaveTextContent('La API de Apps Script está desactivada');

    // El icono es decorativo: no debe anunciarse por separado del texto.
    await expect(alert.querySelector('migo-icon')).toHaveAttribute('aria-hidden', 'true');

    // Interacción real: la acción proyectada es un botón de verdad y llega al consumidor.
    // Sin `exact`: el `getByRole` de Testing Library no lo admite (ese es el de Playwright, que
    // usan los E2E) y no le hace falta — con un string ya compara el nombre accesible completo.
    const retry = canvas.getByRole('button', { name: 'Ya lo he activado, reintentar' });
    await expect(retry).toBeEnabled();
    await userEvent.click(retry);
  },
};
