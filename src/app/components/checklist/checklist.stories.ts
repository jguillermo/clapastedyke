import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Checklist, ChecklistItem } from './checklist';

const ITEMS: ChecklistItem[] = [
  { label: 'Leyendo la configuración', state: 'done', detail: 'Client ID encontrado' },
  { label: 'Conectando con tu cuenta', state: 'done', detail: 'chef@example.test' },
  { label: 'Creando la hoja en tu Drive', state: 'running' },
  { label: 'Enviando y leyendo un dato de prueba', state: 'pending' },
  { label: 'Sincronizando tu recetario', state: 'pending' },
];

const meta: Meta<Checklist> = {
  title: 'Components/Checklist',
  component: Checklist,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-checklist` pinta una lista de pasos que se van marcando conforme ocurren: icono ' +
          'de estado, rótulo, detalle opcional y un raíl vertical que se colorea al completarse el ' +
          'paso.\n\n' +
          'Es **presentacional puro**: no ejecuta nada ni sabe qué son los pasos. Recibe `items` ya ' +
          'resueltos; quien los avanza es la feature que llama a los casos de uso.\n\n' +
          'Cambia los estados de `items` desde Controls (`pending` · `running` · `done` · ' +
          '`failed`) y verás girar el icono del paso en curso y colorearse el raíl de los ' +
          'terminados.\n\n' +
          '**Accesibilidad:** el icono no es la única señal del estado (WCAG 1.4.1) — cada paso ' +
          'lleva su estado en texto dentro de un `sr-only`, y la lista es una región viva ' +
          '`polite`, así que el paso de «En curso» a «Hecho» se anuncia sin interrumpir. La ' +
          'animación respeta `prefers-reduced-motion`.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `<migo-checklist [items]="items" [label]="label" />`,
  }),
  argTypes: {
    items: {
      control: 'object',
      description:
        'Los pasos, en orden. Cada uno: `label` (en presente), `state` (`pending` | `running` | ' +
        '`done` | `failed`) y un `detail` opcional con el resultado o el motivo del fallo.',
    },
    label: {
      control: 'text',
      description: 'Nombre accesible de la lista. Sin él, el lector de pantalla solo dice «lista».',
      table: { defaultValue: { summary: "''" } },
    },
    stateLabels: {
      control: 'object',
      description:
        'Los textos de estado que leen los lectores de pantalla. Se sustituyen enteros si la app ' +
        'no está en español.',
      table: { defaultValue: { summary: 'Pendiente · En curso · Hecho · Ha fallado' } },
    },
  },
  args: { items: ITEMS, label: 'Progreso de la conexión' },
};
export default meta;

type Story = StoryObj<Checklist>;

/** Único story: recorre los estados de cada paso desde el panel Controls. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Por rol y por nombre accesible, nunca por clase de utilidad.
    const list = canvas.getByRole('list', { name: 'Progreso de la conexión' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(5);

    // El estado va en TEXTO, no solo en el color del icono (WCAG 1.4.1).
    await expect(list).toHaveTextContent('Leyendo la configuración — Hecho');
    await expect(list).toHaveTextContent('Creando la hoja en tu Drive — En curso');
    await expect(list).toHaveTextContent('Sincronizando tu recetario — Pendiente');

    // Hay un paso en curso ⇒ la región viva se declara ocupada.
    await expect(list).toHaveAttribute('aria-busy', 'true');

    // Los iconos son decorativos: el estado ya lo dice el texto, no deben anunciarse aparte.
    for (const icon of Array.from(list.querySelectorAll('migo-icon'))) {
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    }

    // Interacción real: es una lista informativa, el tabulador no se para en ella.
    await userEvent.tab();
    await expect(list).not.toHaveFocus();
  },
};
