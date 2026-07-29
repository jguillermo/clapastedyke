import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/_shared/supply-grid` (`app-supply-grid`): la
 * grilla de ingredientes del formulario de receta.
 *
 * Es un `migo-table` (`role="grid"`) con 4 columnas: **0** Ingrediente (combobox con
 * fantasma + desplegable), **1** Cantidad (unit-input, el chip de unidad lo dicta el
 * precio del insumo), **2** Costo (botón: el costo calculado o `＋ precio`, que abre
 * el popover de captura) y **3** Quitar fila. Siempre hay un renglón vacío al final.
 */
export class SupplyGridPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-supply-grid');
  readonly table = this.root.locator('table[role="grid"]');
  readonly rows = this.table.locator('tbody tr[role="row"]');
  readonly columnHeaders = this.table.locator('[role="columnheader"]');
  readonly error = this.root.locator('[role="alert"]');
  readonly materialTotalLabel = this.root.getByText('Costo de materiales');
  readonly hint = this.root.getByText('Toca un costo para ver o cambiar cómo compras el insumo.');

  /** Celda de la grilla por coordenadas (fila, columna). */
  cell(row: number, col: 0 | 1 | 2 | 3): Locator {
    return this.root.locator(`[role="gridcell"][data-row="${row}"][data-col="${col}"]`);
  }

  nameInput(row: number): Locator {
    return this.cell(row, 0).getByLabel('Ingrediente');
  }

  quantityInput(row: number): Locator {
    return this.cell(row, 1).getByLabel('Cantidad');
  }

  /** Botón de la columna Costo: muestra el costo calculado o `＋ precio`. */
  costButton(row: number): Locator {
    return this.cell(row, 2).getByRole('button');
  }

  removeRowButton(row: number): Locator {
    return this.cell(row, 3).getByRole('button', { name: 'Quitar fila' });
  }

  /** Chip de unidad que se pinta junto a la cantidad (`g`, `kg`, `u`). */
  async unitOf(row: number): Promise<string> {
    return (await this.cell(row, 1).innerText()).trim();
  }

  /** Costo de la fila tal como lo muestra la 3ª columna. */
  async costOf(row: number): Promise<string> {
    return (await this.cell(row, 2).innerText()).trim();
  }

  /**
   * Total de materiales (solo se pinta cuando alguna fila tiene precio): el importe
   * es el segundo `span` de la fila que rotula «Costo de materiales».
   */
  readonly materialTotal = this.root
    .locator('div')
    .filter({ has: this.page.getByText('Costo de materiales') })
    .last()
    .locator('span')
    .last();

  /**
   * Escribe una línea con un insumo **existente** del catálogo (nombre exacto) y su
   * cantidad. Al terminar la fila ya tiene costo, porque la grilla jala el precio de
   * compra del catálogo por nombre.
   */
  async fillExistingLine(row: number, name: string, quantity: string): Promise<void> {
    await this.nameInput(row).fill(name);
    await this.quantityInput(row).fill(quantity);
    await expect(this.costButton(row)).not.toHaveText('＋ precio');
  }

  /**
   * Teclea un **prefijo** y acepta con Enter el fantasma del combobox: el nombre se
   * completa y el foco salta a la cantidad. Solo sirve cuando el prefijo tiene una
   * única coincidencia que empieza por él (si ya se escribió el nombre completo no
   * hay fantasma que aceptar y el foco no se mueve).
   */
  async acceptGhostName(row: number, prefix: string): Promise<void> {
    const name = this.nameInput(row);
    await name.click();
    await name.fill(prefix);
    await this.page.keyboard.press('Enter');
    await expect(this.quantityInput(row)).toBeFocused();
  }

  /** Escribe un insumo **nuevo** (sin precio todavía): deja la fila lista para el popover. */
  async fillNewLine(row: number, name: string, quantity: string): Promise<void> {
    await this.nameInput(row).fill(name);
    await this.quantityInput(row).fill(quantity);
    await expect(this.costButton(row)).toHaveText('＋ precio');
  }
}
