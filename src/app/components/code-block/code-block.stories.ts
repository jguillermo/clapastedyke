import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CodeBlock } from './code-block';

/** Suficientes líneas para que la ventana se quede corta y aparezca «Ver entero». */
const CODE = Array.from({ length: 40 }, (_, line) => `var linea${line + 1} = ${line + 1};`).join(
  '\n',
);

const meta: Meta<CodeBlock> = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-code-block` es el hermano largo de `migo-copy-field`: aquel es un `<input>` de una ' +
          'línea para un valor suelto; este es un `<pre>` con scroll para cientos de líneas. **Su ' +
          'razón de ser es el botón de copiar** — nadie va a seleccionar 900 líneas a mano en un ' +
          'móvil.\n\n' +
          'Viene **plegado**: un script entero empujaría el resto de la página fuera de la pantalla. ' +
          'Con más de 12 líneas aparece «Ver entero»; copiar funciona igual esté plegado o no, ' +
          'porque copiar no exige haber leído. Pon `open` para los bloques de tres líneas.\n\n' +
          'Sube `code` a cadena vacía en Controls y verás `emptyLabel`: un fichero que no se pudo ' +
          'leer es un estado real, no un fallo que ocultar.\n\n' +
          '**Accesibilidad:** el `<pre>` es `role="region"` y enfocable — un bloque con scroll propio ' +
          'al que no se llega con el teclado es una trampa (WCAG 2.1.1). El nombre del botón no ' +
          'cambia al copiar; la confirmación va en un `role="status"` aparte.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onCopied: fn() },
    template: `
      <migo-code-block
        [code]="code"
        [label]="label"
        [copyLabel]="copyLabel"
        [emptyLabel]="emptyLabel"
        [open]="open"
        (copied)="onCopied($event)"
      />
    `,
  }),
  argTypes: {
    code: {
      control: 'text',
      description:
        'El texto íntegro. Vacío = no se pudo obtener; se pinta `emptyLabel` en su lugar.',
    },
    label: {
      control: 'text',
      description:
        'Nombre del fichero o del bloque. Es también el nombre accesible de la región con scroll.',
      table: { defaultValue: { summary: "''" } },
    },
    copyLabel: {
      control: 'text',
      description: 'Rótulo del botón. Constante a propósito: no cambia al copiar.',
      table: { defaultValue: { summary: 'Copiar' } },
    },
    emptyLabel: {
      control: 'text',
      description: 'Qué se dice cuando no hay nada que enseñar.',
      table: { defaultValue: { summary: 'No se ha podido cargar el contenido.' } },
    },
    open: {
      control: 'boolean',
      description:
        'Empieza desplegado y sin ventana de altura, y sin ofrecer «Ver entero». Para bloques cortos.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    code: CODE,
    label: 'Code.gs',
    copyLabel: 'Copiar',
    emptyLabel: 'No se ha podido cargar el contenido.',
    open: false,
  },
};
export default meta;

type Story = StoryObj<CodeBlock>;

/** Único story: prueba el plegado, el copiado y el hueco vacío desde el panel Controls. */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('el bloque es una región con nombre y alcanzable por teclado', async () => {
      const region = canvas.getByRole('region', { name: 'Code.gs' });
      await expect(region).toHaveAttribute('tabindex', '0');
      await expect(region).toHaveTextContent('var linea1 = 1;');
      await expect(canvas.getByText('40 líneas')).toBeVisible();
    });

    await step('«Ver entero» despliega y vuelve a plegar', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Ver entero' }));
      await expect(canvas.getByRole('button', { name: 'Plegar' })).toBeVisible();

      await userEvent.click(canvas.getByRole('button', { name: 'Plegar' }));
      await expect(canvas.getByRole('button', { name: 'Ver entero' })).toBeVisible();
    });

    await step(
      'al copiar, la confirmación se anuncia sin cambiar el nombre del botón',
      async () => {
        await expect(canvas.getByRole('status')).toHaveTextContent('');

        await userEvent.click(canvas.getByRole('button', { name: 'Copiar' }));

        // El rótulo es constante — eso es justo lo que se está comprobando.
        await expect(canvas.getByRole('button', { name: 'Copiar' })).toBeVisible();
        // `execCommand('copy')` puede no estar disponible según el runner: valen las dos ramas.
        await expect(canvas.getByRole('status')).toHaveTextContent(
          /Copiado|No se ha podido copiar/,
        );
      },
    );
  },
};
