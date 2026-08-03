import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Inicial que fija la unidad en un `migo-unit-input`: `k` = kilos, `g` = gramos,
 * `u` = unidades. El control la captura en **keydown**, así que hay que pulsarla
 * como tecla — un `fill()` con la letra dentro del texto no la fija.
 */
export type UnitKey = 'k' | 'g' | 'u';

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

  /*
   * Desplegable del combobox de Ingrediente. Se monta en un overlay del CDK, fuera de
   * `app-supply-grid`, así que estos locators cuelgan de la página y no de `root`.
   */

  /**
   * Panel del desplegable (existe solo mientras está abierto).
   *
   * Cuelga de la página y no de `root` porque el CDK lo monta fuera del componente. Eso obliga a
   * una condición al usarlo: **solo puede haber un desplegable abierto a la vez**. El del
   * `migo-select-tag` de características es otro `[role="listbox"]`, así que no se pueden
   * intercalar ambos sin cerrar el primero (en la app tampoco se puede: son dos overlays).
   */
  readonly listbox = this.page.getByRole('listbox');
  /** Todas las opciones ofrecidas. */
  readonly options = this.page.getByRole('option');

  /** Opción concreta del desplegable, por su nombre exacto. */
  option(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  /**
   * Mueve la opción activa del desplegable con una flecha y devuelve el texto de la que
   * queda marcada (la que aceptaría un Enter).
   *
   * **Espera a que el `aria-activedescendant` del combobox CAMBIE antes de leer.** La
   * opción activa se repinta un tick después de la pulsación, así que leerla de inmediato
   * devuelve la anterior y el Enter acaba eligiendo otra — era una intermitencia real.
   */
  async moveActiveOption(row: number, key: 'ArrowDown' | 'ArrowUp'): Promise<string> {
    const input = this.nameInput(row);
    const before = await input.getAttribute('aria-activedescendant');
    await input.press(key);
    if (before === null) {
      // No había opción activa: basta con esperar a que aparezca una.
      await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
    } else {
      await expect(input).not.toHaveAttribute('aria-activedescendant', before);
    }
    // Se lee por el id al que apunta el combobox: es exactamente la opción que Enter acepta.
    const activeId = await input.getAttribute('aria-activedescendant');
    expect(activeId, 'el combobox debe seguir apuntando a una opción activa').toBeTruthy();
    return (await this.page.locator(`#${activeId}`).innerText()).trim();
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
    return this.cell(row, 3).getByRole('button', { name: 'Quitar fila', exact: true });
  }

  /**
   * Chip de unidad de la fila (`g`, `kg`, `u`) como locator, para asertar con auto-retry:
   * `await expect(grid.unitChip(0)).toHaveText('u')`. Preferible a {@link unitOf} cuando la unidad
   * acaba de cambiar, porque el chip se repinta un tick después de la pulsación.
   */
  unitChip(row: number): Locator {
    return this.cell(row, 1);
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
   * Escribe la cantidad de una fila y, si se indica, fija su unidad pulsando su
   * inicial (el control la lee en keydown, ver {@link UnitKey}).
   *
   * Entre el valor y la tecla de unidad se espera a que el valor haya **aterrizado** en el control:
   * si la pulsación llega antes de que Angular procese el `fill`, el control resuelve la unidad con
   * el valor viejo y la familia se queda en la anterior (era una fuente de intermitencias).
   */
  async setQuantity(row: number, quantity: string, unit?: UnitKey): Promise<void> {
    const input = this.quantityInput(row);
    await input.fill(quantity);
    if (unit) {
      await expect(input).toHaveValue(quantity);
      await input.press(unit);
    }
  }

  /**
   * Escribe una línea con un insumo **existente** del catálogo (nombre exacto) y su
   * cantidad. Al terminar la fila ya tiene costo, porque la grilla jala el precio de
   * compra del catálogo por nombre.
   */
  async fillExistingLine(
    row: number,
    name: string,
    quantity: string,
    unit?: UnitKey,
  ): Promise<void> {
    await this.nameInput(row).fill(name);
    await this.setQuantity(row, quantity, unit);
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
  async fillNewLine(row: number, name: string, quantity: string, unit?: UnitKey): Promise<void> {
    await this.nameInput(row).fill(name);
    await this.setQuantity(row, quantity, unit);
    await expect(this.costButton(row)).toHaveText('＋ precio');
  }
}
