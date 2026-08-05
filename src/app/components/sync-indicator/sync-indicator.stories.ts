import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SyncIndicator, SyncIndicatorState } from './sync-indicator';

const STATES: SyncIndicatorState[] = ['hidden', 'pending', 'syncing', 'reconnect', 'error'];

const meta: Meta<SyncIndicator> = {
  title: 'Components/SyncIndicator',
  component: SyncIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Aviso discreto del estado de la copia remota. Con `hidden` **no pinta nada** — aparecer es la señal, y por eso el estado normal de una app al día es que no se vea. Recorre los estados desde Controls: `pending` muestra el número, `syncing` gira, y `reconnect`/`error` son los únicos que piden atención con color.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onActivated: fn() },
    template: `
      <migo-sync-indicator
        [state]="state"
        [pending]="pending"
        [unreadable]="unreadable"
        (activated)="onActivated()"
      />
    `,
  }),
  argTypes: {
    state: {
      control: 'select',
      options: STATES,
      description:
        'Qué está pasando. `hidden` no renderiza nada; los demás pintan el aviso con su icono y su tono.',
      table: { defaultValue: { summary: 'hidden' } },
    },
    pending: {
      control: 'number',
      description:
        'Cambios que no han salido de este dispositivo. Solo se enseña en `pending`, y con el número: «1 sin subir» y «40 sin subir» no significan lo mismo para quien va a cerrar el portátil.',
      table: { defaultValue: { summary: '0' } },
    },
    unreadable: {
      control: 'number',
      description:
        'Filas del destino que no se pueden leer. En `error`, cambia el texto a «Revisa tu hoja» — el problema está en la hoja, no en la red.',
      table: { defaultValue: { summary: '0' } },
    },
  },
  args: { state: 'pending', pending: 3, unreadable: 0 },
};
export default meta;

type Story = StoryObj<SyncIndicator>;

/** Único story: los estados se recorren desde Controls. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nombre accesible por rol: dice el estado Y que se puede pulsar para ver más.
    const aviso = canvas.getByRole('button', { name: /3 sin subir/i });
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveAccessibleName(/sincronización/i);

    await userEvent.click(aviso);
  },
};
