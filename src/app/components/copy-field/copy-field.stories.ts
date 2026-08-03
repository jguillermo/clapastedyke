import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CopyField } from './copy-field';

const meta: Meta<CopyField> = {
  title: 'Components/CopyField',
  component: CopyField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-copy-field` muestra un valor de solo lectura que el usuario tiene que **llevarse a ' +
          'otro sitio**: una URL que pegar en otra pestaña, un identificador que teclear en una ' +
          'consola. No edita nada, así que **no** es un `ControlValueAccessor`; sí se engancha a un ' +
          '`migo-form-field` por DI opcional.\n\n' +
          '**Se copia con el `Clipboard` del CDK, no con `navigator.clipboard`**: es síncrono y ' +
          'devuelve `boolean`, así que hay una rama de fallo real que pintar, y no exige contexto ' +
          'seguro.\n\n' +
          '**El nombre accesible del botón no cambia al copiar.** Cambiar el nombre de un elemento ' +
          'que tiene el foco se anuncia de forma inconsistente entre lectores de pantalla, y ' +
          'duplicaría lo que ya dice la región viva. Lo que cambia es el icono.\n\n' +
          'El `<input readonly>` no es decorativo: da scroll horizontal cuando el valor no cabe ' +
          '(crítico a 375px) y se autoselecciona al enfocarlo, así que **Tab + Cmd/Ctrl+C funciona ' +
          'sin tocar el botón** — que es también la salida cuando el portapapeles falla.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onCopied: fn() },
    template: `
      <migo-copy-field
        [value]="value"
        [ariaLabel]="ariaLabel"
        [copyLabel]="copyLabel"
        (copied)="onCopied($event)"
      />
    `,
  }),
  argTypes: {
    value: {
      control: 'text',
      description: 'El texto de solo lectura y lo que se copia. Obligatorio.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Nombre accesible cuando no hay un `migo-form-field` que ponga la etiqueta.',
      table: { defaultValue: { summary: "''" } },
    },
    copyLabel: {
      control: 'text',
      description: 'Rótulo del botón. Constante a propósito: no cambia al copiar.',
      table: { defaultValue: { summary: 'Copiar' } },
    },
  },
  args: {
    // Una URL `/exec` de verdad: es el caso que revienta el layout si falta `min-w-0`.
    value: 'https://script.google.com/macros/s/AKfycbxN7Qw3vR2mZpL9tK4hJ8dF6sG1yB0cA5eX/exec',
    ariaLabel: 'URL del sincronizador',
    copyLabel: 'Copiar',
  },
};
export default meta;

type Story = StoryObj<CopyField>;

/** Único story: prueba el copiado real y la confirmación accesible. */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('el valor se ve, es de solo lectura y se autoselecciona al enfocar', async () => {
      const field = canvas.getByRole('textbox', { name: 'URL del sincronizador' });
      await expect(field).toHaveAttribute('readonly');

      field.focus();
      // La ruta de teclado no pasa por el botón: enfocar ya deja todo seleccionado.
      await expect((field as HTMLInputElement).selectionEnd).toBe(
        (field as HTMLInputElement).value.length,
      );
    });

    await step(
      'al pulsar, la confirmación se anuncia sin cambiar el nombre del botón',
      async () => {
        const button = canvas.getByRole('button', { name: 'Copiar' });
        await expect(canvas.getByRole('status')).toHaveTextContent('');

        await userEvent.click(button);

        // El rótulo es constante — eso es justo lo que se está comprobando.
        await expect(canvas.getByRole('button', { name: 'Copiar' })).toBeVisible();

        // `execCommand('copy')` puede no estar disponible según el runner, así que se acepta
        // cualquiera de las dos ramas: lo que importa es que la región viva deja de estar vacía.
        await expect(canvas.getByRole('status')).toHaveTextContent(
          /Copiado|No se ha podido copiar/,
        );
      },
    );
  },
};
