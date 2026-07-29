import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@components/button/button';
import { Combobox } from '@components/combobox/combobox';
import { Icon } from '@components/icon/icon';
import { UnitInput } from '@components/unit-input/unit-input';
import { Table, TableColumn } from './table';

const COLUMNS: TableColumn[] = [
  { name: 'Insumo' },
  { name: 'Cantidad', size: 'fit', align: 'center' },
  { name: '', size: 'fit' },
];

const SUGGESTIONS: string[] = ['Harina de trigo', 'Harina de maíz', 'Azúcar rubia', 'Huevos'];

/** Espía de la salida `removeRow`; el `play` lo limpia antes de ejercer la tabla. */
const onRemoveRow = fn();

const meta: Meta<Table> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [Table, Combobox, UnitInput, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component:
          '`migo-table` es el shell de **hoja de cálculo**: un `<table>` real con `role="grid"` ' +
          '(`thead`/`tbody`/`th scope="col"`/`td`) y navegación por teclado entre celdas — ↑/↓ ' +
          'cambian de fila, Enter baja al inicio de la siguiente, ←/→ mueven el cursor dentro del ' +
          'input y **solo al llegar a su borde** saltan de celda, y **Tab es el nativo** ' +
          '(fila-mayor), porque el DOM no se reordena.\n\n' +
          'Es **agnóstico del editor**: el consumidor proyecta una `<ng-template>` que pinta el ' +
          'control de cada celda (típicamente `migo-combobox` / `migo-unit-input` en variante ' +
          '`seamless`) y recibe `$implicit` (el modelo de la fila), `rowIndex`, `col` y `colIndex`. ' +
          'Los datos, la fila vacía y la validación son del feature.\n\n' +
          '**Eliminar fila**: la tabla no trae columna de acciones. El feature añade su columna con ' +
          'un botón y llama a `remove(rowIndex)` por referencia de plantilla (`#t` → `t.remove(r)`), ' +
          'que dispara la salida `removeRow`. Así decide él cuándo y dónde mostrar el botón.\n\n' +
          '**Tamaños sin valores arbitrarios**: `size` se mapea a utilidades del tema mediante mapas ' +
          'de literales (`number`→`w-*`, `\'40%\'`→fracción, `\'fit\'`→ajustado al contenido, ' +
          'omitido→flexible) y se **ajusta al paso más cercano** de la escala; nunca se usa ' +
          '`[style.width]`. Mobile-first: vertical nunca scrollea (crece), las columnas fijas que ' +
          'sumen de más activan scroll horizontal, y `bleed` lleva la tabla borde a borde en móvil.\n\n' +
          'En este story las filas van **vacías** a propósito: los controles del DS son ' +
          '`ControlValueAccessor` y aquí no hay formulario que los alimente — el `play` escribe en ' +
          'una celda para demostrarlo.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, suggestions: SUGGESTIONS, onRemoveRow },
    template: `
      <migo-table
        #t
        [columns]="columns"
        [rows]="rows"
        [ariaLabel]="ariaLabel"
        [bleed]="bleed"
        [maxWidth]="maxWidth"
        (removeRow)="onRemoveRow($event)"
      >
        <ng-template let-line let-r="rowIndex" let-c="colIndex">
          @switch (c) {
            @case (0) {
              <migo-combobox seamless [suggestions]="suggestions" ariaLabel="Insumo" />
            }
            @case (1) {
              <migo-unit-input seamless unit="g" placeholder="0" ariaLabel="Cantidad" />
            }
            @case (2) {
              <button
                migo-button
                variant="ghost"
                size="sm"
                [attr.aria-label]="'Quitar fila ' + (r + 1)"
                (click)="t.remove(r)"
              >
                <migo-icon icon-leading name="mat:close" size="sm" />
              </button>
            }
          }
        </ng-template>
      </migo-table>
    `,
  }),
  argTypes: {
    columns: {
      control: 'object',
      description:
        'Definición de columnas: `{ name, size?, align?, max? }`. `name` es la cabecera (puede ir ' +
        'vacía, p.ej. la columna de acciones); `size` gobierna el ancho (px, `\'NN%\'`, `\'fit\'` o ' +
        'omitido = flexible); `align` alinea el contenido; `max` pone un tope. Los valores se ' +
        'redondean al paso más cercano de la escala del tema.',
      table: { defaultValue: { summary: '[]' } },
    },
    rows: {
      control: 'object',
      description:
        'Modelos de fila. La tabla **no los interpreta**: cada elemento llega a la plantilla de ' +
        'celda como `$implicit` (en la app real es el `FormGroup` de la fila). Su longitud es la ' +
        'que decide cuántas filas se pintan.',
      table: { defaultValue: { summary: '[]' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nombre accesible de la grilla (`aria-label` del `<table role="grid">`).',
      table: { defaultValue: { summary: '(vacío)' } },
    },
    bleed: {
      control: 'boolean',
      description:
        'En móvil rompe el padding del padre y lleva la tabla **borde a borde** (además pierde el ' +
        'radio); en `sm+` vuelve a su sitio. Redúcelo a 375px para verlo.',
      table: { defaultValue: { summary: 'false' } },
    },
    maxWidth: {
      control: 'select',
      options: [null, 'reading', 'page'],
      description:
        'Tope de ancho de la tabla, centrada en `sm+`: `reading` (680px) · `page` (1120px) · `null` ' +
        '= sin tope (ocupa el contenedor).',
      table: { defaultValue: { summary: 'null' } },
    },
  },
  args: {
    columns: COLUMNS,
    rows: [{}, {}, {}],
    ariaLabel: 'Insumos de la receta',
    bleed: false,
    maxWidth: null,
  },
};
export default meta;

type Story = StoryObj<Table>;

/**
 * Único story: la grilla con las tres columnas del caso real (insumo, cantidad y quitar). Cambia
 * `columns`, `rows`, `bleed` y `maxWidth` desde **Controls**.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onRemoveRow.mockClear();

    // Estructura semántica real: grid + cabeceras de columna + celdas.
    const grid = canvas.getByRole('grid', { name: 'Insumos de la receta' });
    await expect(within(grid).getAllByRole('columnheader')).toHaveLength(3);
    await expect(within(grid).getAllByRole('gridcell')).toHaveLength(9);

    // Interacción real: escribir en la celda de la primera fila.
    const names = canvas.getAllByRole('combobox', { name: 'Insumo' });
    await userEvent.click(names[0]);
    await userEvent.type(names[0], 'Huevos');
    await expect(names[0]).toHaveValue('Huevos');

    // Teclado de hoja de cálculo: ↓ baja a la misma columna de la fila siguiente.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(async () => {
      await expect(names[1]).toHaveFocus();
    });

    // Eliminar fila: el botón es del consumidor y dispara `removeRow` con su índice.
    await userEvent.click(canvas.getByRole('button', { name: 'Quitar fila 1' }));
    await expect(onRemoveRow).toHaveBeenCalledWith(0);
  },
};
