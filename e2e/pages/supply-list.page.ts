import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/supply-list` (`app-supply-list`): la hoja
 * editable de insumos.
 *
 * Es un `migo-table` (`role="grid"`) de 3 columnas — **0** Insumo, **1** Empaque,
 * **2** Precio. La **fila 0 es el renglón para agregar**; debajo van los insumos
 * existentes en orden alfabético. Cada renglón se **autoguarda** al salir de él
 * (focusout) y el de agregar también con Enter; al crear uno aparece una marca de
 * comprobación en su fila y se inserta un renglón vacío nuevo arriba.
 */
export class SupplyListPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-supply-list');
  readonly table = this.root.locator('table[role="grid"]');
  readonly rows = this.table.locator('tbody tr[role="row"]');
  readonly columnHeaders = this.table.locator('[role="columnheader"]');
  readonly error = this.root.locator('[role="alert"]');
  readonly hint = this.root.getByText('Tus insumos: escribe el nombre');
  /** Marca de «Insumo agregado» que se pinta unos segundos en la fila recién creada. */
  readonly addedMark = this.root.getByLabel('Insumo agregado');

  /** Índice de la fila reservada para crear un insumo nuevo. */
  static readonly ADD_ROW = 0;

  cell(row: number, col: 0 | 1 | 2): Locator {
    return this.root.locator(`[role="gridcell"][data-row="${row}"][data-col="${col}"]`);
  }

  nameInput(row: number): Locator {
    return this.cell(row, 0).getByLabel('Nombre del insumo');
  }

  packagingInput(row: number): Locator {
    return this.cell(row, 1).getByLabel('Empaque: cuánto compras');
  }

  priceInput(row: number): Locator {
    return this.cell(row, 2).getByLabel('Precio de compra');
  }

  /** Chip de unidad del empaque de la fila (`g`, `kg`, `u`). */
  async unitOf(row: number): Promise<string> {
    return (await this.cell(row, 1).innerText()).trim();
  }

  /** Nombres de todos los insumos listados, incluido el renglón vacío de agregar. */
  async names(): Promise<string[]> {
    return this.root.locator('[data-col="0"] input').evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
  }

  /** Índice de fila de un insumo por nombre exacto, o `-1` si no está. */
  async rowOf(name: string): Promise<number> {
    return (await this.names()).indexOf(name);
  }

  /**
   * Crea un insumo en el renglón de agregar y confirma con Enter. Termina cuando la
   * fila se ha guardado (aparece la marca de comprobación).
   */
  async addSupply(name: string, packaging: string, price: string): Promise<void> {
    const row = SupplyListPage.ADD_ROW;
    await this.nameInput(row).fill(name);
    await this.packagingInput(row).fill(packaging);
    await this.priceInput(row).fill(price);
    await this.priceInput(row).press('Enter');
    await expect(this.addedMark).toBeVisible();
  }

  /**
   * Provoca el autoguardado del renglón `row` moviendo el foco al renglón de
   * agregar, que es otra fila (el guardado se dispara al salir de la fila).
   */
  async blurRow(row: number): Promise<void> {
    const target = row === SupplyListPage.ADD_ROW ? 1 : SupplyListPage.ADD_ROW;
    await this.nameInput(target).click();
  }
}
