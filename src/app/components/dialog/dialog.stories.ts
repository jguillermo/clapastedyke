import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardFooter } from '@components/card/card-footer';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { MIGO_DIALOG_DATA, MigoDialog, MigoDialogRef } from './dialog.service';

interface ConfirmData {
  message: string;
}

/**
 * Componente **abierto como diálogo**. En la app real vive en `features/` (su texto es contenido
 * de la app) — aquí es parte del harness del story, que no se compila con la app
 * (`tsconfig.app.json` excluye `*.stories.ts`).
 */
@Component({
  selector: 'sb-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, CardHeader, CardTitle, CardBody, CardFooter, Button],
  template: `
    <migo-card fill>
      <migo-card-header>
        <migo-card-title>Guardar receta</migo-card-title>
      </migo-card-header>
      <migo-card-body>{{ data.message }}</migo-card-body>
      <migo-card-footer>
        <button migo-button variant="ghost" (click)="ref.close(false)">Cancelar</button>
        <button migo-button (click)="ref.close(true)">Aceptar</button>
      </migo-card-footer>
    </migo-card>
  `,
})
class ConfirmDialog {
  protected readonly ref = inject<MigoDialogRef<boolean>>(MigoDialogRef);
  protected readonly data = inject<ConfirmData>(MIGO_DIALOG_DATA);
}

/** Lanzador del story: `MigoDialog` es un servicio, así que necesita un host que lo invoque. */
@Component({
  selector: 'sb-dialog-launcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `<button migo-button (click)="open()">Guardar receta…</button>`,
})
class DialogLauncher {
  /** Nombre accesible del diálogo (`MigoDialogConfig.ariaLabel`). */
  readonly ariaLabel = input('Confirmar guardado');
  /** Ancho del panel en `sm+` (`MigoDialogConfig.width`). */
  readonly width = input('480px');
  /** Texto que viaja al componente abierto por `MIGO_DIALOG_DATA`. */
  readonly message = input('Se guardará la receta con los insumos actuales. ¿Continuamos?');
  /** Impide cerrar con Esc o clic en el backdrop (`MigoDialogConfig.disableClose`). */
  readonly disableClose = input(false, { transform: booleanAttribute });

  /** Resultado con el que se cerró el diálogo (`undefined` si se cerró sin resultado). */
  readonly closed = output<boolean | undefined>();

  private readonly dialog = inject(MigoDialog);

  protected open(): void {
    const ref = this.dialog.open<boolean, ConfirmData>(ConfirmDialog, {
      ariaLabel: this.ariaLabel(),
      width: this.width(),
      disableClose: this.disableClose(),
      data: { message: this.message() },
    });
    ref.closed.subscribe((result) => this.closed.emit(result));
  }
}

/** Espía del cierre del diálogo; el `play` lo limpia antes de abrirlo. */
const onClosed = fn();

const meta: Meta<DialogLauncher> = {
  title: 'Components/Dialog',
  component: DialogLauncher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`MigoDialog` **no es un componente declarativo: es un servicio que abre un componente**, ' +
          'y el componente abierto **es** el diálogo. Por eso este story se monta sobre un lanzador ' +
          '(`sb-dialog-launcher`, definido en el propio `.stories.ts`): los Controls de abajo son ' +
          'las opciones de `MigoDialogConfig` con las que se llama a `open()`.\n\n' +
          '```ts\n' +
          "const ref = migoDialog.open<boolean>(ConfirmDialog, { data, ariaLabel: 'Confirmar' });\n" +
          'ref.closed.subscribe((result) => { … });\n' +
          '```\n\n' +
          'El comportamiento lo aporta **`@angular/cdk/dialog`**: overlay centrado, backdrop, ' +
          'focus-trap con restauración del foco, Esc y bloqueo del scroll. `MigoDialog` solo añade ' +
          'los defaults Migo (`panelClass`/`backdropClass`). El componente abierto inyecta ' +
          '**`MigoDialogRef`** para cerrarse (`ref.close(resultado)`) y **`MIGO_DIALOG_DATA`** para ' +
          'recibir datos.\n\n' +
          'El shell es **agnóstico**: no aporta chrome. El contenedor del overlay es transparente y ' +
          'toda la vista (superficie, header, body, footer) la pone el componente enviado, ' +
          'normalmente un **`migo-card` con `fill`** — así en móvil el diálogo es full-bleed, solo ' +
          'el body scrollea y header/footer quedan fijos. El **ancho** lo decide quien abre, no el ' +
          'shell.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, onClosed },
    template: `
      <sb-dialog-launcher
        [ariaLabel]="ariaLabel"
        [width]="width"
        [message]="message"
        [disableClose]="disableClose"
        (closed)="onClosed($event)"
      />
    `,
  }),
  argTypes: {
    ariaLabel: {
      control: 'text',
      description:
        'Nombre accesible del diálogo. El contenedor del CDK lo lee **al inicializarse**, así que ' +
        'se pasa al abrir y no se puede cambiar con el diálogo ya abierto. Es la única forma de ' +
        'nombrarlo: el shell no pinta título.',
      table: { defaultValue: { summary: 'Confirmar guardado' } },
    },
    width: {
      control: 'text',
      description:
        'Ancho del panel (`MigoDialogConfig.width`). Solo manda en `sm+`: **en móvil el diálogo es ' +
        'full-bleed** (`inset: 0`) por el chrome global, sea cual sea este valor.',
      table: { defaultValue: { summary: '480px' } },
    },
    message: {
      control: 'text',
      description:
        'Dato que viaja al componente abierto vía `MIGO_DIALOG_DATA` — demuestra el paso de `data`. ' +
        'No es una opción del CDK.',
      table: { defaultValue: { summary: '(texto de ejemplo)' } },
    },
    disableClose: {
      control: 'boolean',
      description:
        'Impide cerrar con **Esc** o con clic en el backdrop: obliga a decidir con los botones del ' +
        'footer. Úsalo solo cuando abandonar a medias sea destructivo.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    ariaLabel: 'Confirmar guardado',
    width: '480px',
    message: 'Se guardará la receta con los insumos actuales. ¿Continuamos?',
    disableClose: false,
  },
};
export default meta;

type Story = StoryObj<DialogLauncher>;

/**
 * Único story: abre el diálogo y ciérralo con **Aceptar**, **Cancelar** o Esc. Cambia
 * `ariaLabel`, `width`, `message` y `disableClose` desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onClosed.mockClear();

    // Nada abierto de entrada: el diálogo solo existe tras invocar el servicio.
    await expect(screen.queryByRole('dialog')).toBeNull();

    // Interacción real: abrir. El overlay se monta fuera del canvas, en el `document`.
    await userEvent.click(canvas.getByRole('button', { name: 'Guardar receta…' }));
    const dialog = await screen.findByRole('dialog');

    // El panel entra con un fade-in (`migo-dialog-in`): hasta que acaba, su opacidad es 0 y nada
    // dentro cuenta como visible. Se espera a la animación antes de mirar el contenido.
    await waitFor(async () => {
      await expect(dialog).toBeVisible();
    });

    // El nombre accesible viene de `ariaLabel`; la vista la pone el `migo-card` enviado.
    await expect(dialog).toHaveAccessibleName('Confirmar guardado');
    await expect(within(dialog).getByRole('heading', { name: 'Guardar receta' })).toBeVisible();
    await expect(
      within(dialog).getByText(/Se guardará la receta con los insumos actuales/),
    ).toBeVisible();

    // Cerrar con resultado: `ref.close(true)` resuelve `ref.closed` y desmonta el overlay.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
    await waitFor(async () => {
      await expect(screen.queryByRole('dialog')).toBeNull();
    });
    await expect(onClosed).toHaveBeenCalledWith(true);
  },
};
