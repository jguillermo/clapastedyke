import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/recipe-form` (`app-recipe-form`): el
 * formulario ÚNICO de receta (crear y editar), abierto como `MigoDialog`.
 *
 * Contiene nombre, un `migo-select-tag` de características (Sabor, Porciones y
 * Molde), la grilla de ingredientes ({@link SupplyGridPage}) y el pie con
 * Cancelar/Guardar.
 * La cabecera trae el título (nombre de la receta o «Nueva receta»), el subtítulo
 * (categoría destino) y la × de cerrar.
 */
export class RecipeFormPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-recipe-form');
  readonly title = this.root.locator('migo-card-title');
  readonly subtitle = this.root.locator('migo-card-subtitle');

  /** Panel del overlay de CDK que hospeda el diálogo (full-bleed en móvil). */
  readonly panel = this.page.locator('.migo-dialog__panel.cdk-overlay-pane');
  readonly header = this.root.locator('migo-card-header');
  /** Cuerpo del card: la ÚNICA zona scrollable cuando el card está en `fill`. */
  readonly body = this.root.locator('migo-card-body');
  readonly footer = this.root.locator('migo-card-footer');

  /*
   * Nombre y acciones, exigidos **exactos**. `getByLabel`/`getByRole` coinciden por subcadena y
   * bajo esta raíz vive también la grilla de ingredientes: sin `exact`, el día que la grilla
   * estrene un campo «Nombre del insumo» o un botón «Guardar y cerrar» el locator resolvería a
   * dos elementos y la suite se caería por un cambio que no rompe nada.
   *
   * Ojo: la captura de precio NO cuenta aquí — es un overlay del CDK y vive fuera de
   * `app-recipe-form`, por eso su `Cancelar` nunca colisiona con este.
   */
  readonly name = this.root.getByLabel('Nombre', { exact: true });
  readonly save = this.root.getByRole('button', { name: 'Guardar', exact: true });
  readonly cancel = this.root.getByRole('button', { name: 'Cancelar', exact: true });
  readonly close = this.root.getByRole('button', { name: 'Cerrar', exact: true });
  readonly error = this.root.locator('migo-card-body > div > [role="alert"]');

  /**
   * Campo ÚNICO de características (`migo-select-tag` con tres tipos: `Sabor`, `Porciones` y
   * `Molde`). Cada llamada indica el tipo: `properties.pick('Sabor', 'Chocolate')`.
   */
  readonly properties = new SelectTag(
    this.page,
    this.root.locator('migo-select-tag'),
    'Características',
  );

  /** Espera a que el diálogo esté montado y con el nombre enfocable. */
  async waitReady(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.name).toBeVisible();
  }

  /**
   * Espera a que el diálogo se haya cerrado **por completo**: además de desmontarse el
   * componente, el CDK retira su panel del overlay y devuelve el `aria-hidden` al
   * resto del documento. Sin esperar eso, una consulta por rol sobre el libro que
   * queda debajo podría no encontrar nada.
   */
  async waitClosed(): Promise<void> {
    await expect(this.root).toHaveCount(0);
    await expect(this.page.locator('.cdk-overlay-pane')).toHaveCount(0);
  }

  /** Nombre accesible del diálogo CDK que lo hospeda (`Nueva receta` / `Editar receta`). */
  get dialogLabel(): Locator {
    return this.page.locator('[role="dialog"]');
  }

  /**
   * El diálogo CDK que lo hospeda, exigiendo su **nombre accesible** (lo fija
   * `MigoDialogConfig.ariaLabel` al abrir: `Nueva receta` o `Editar receta`).
   */
  dialogNamed(name: 'Nueva receta' | 'Editar receta'): Locator {
    return this.page.getByRole('dialog', { name });
  }

  /** Etiquetas de los campos del formulario, en el orden en que se pintan. */
  readonly fieldLabels = this.root.locator('label');
}

/**
 * Helper del control `migo-select-tag` (estilo Select2): un input `combobox` que
 * abre un listbox de opciones agrupadas por tipo, y chips con su × para quitar.
 * El nombre accesible de cada opción es `«Tipo» «Valor»` (p. ej. `Sabor Chocolate`).
 */
class SelectTag {
  constructor(
    private readonly page: Page,
    readonly root: Locator,
    private readonly label: string,
  ) {}

  get input(): Locator {
    return this.root.locator('input[role="combobox"]');
  }

  get listbox(): Locator {
    return this.page.locator('[role="listbox"]');
  }

  get options(): Locator {
    return this.page.locator('[role="option"]');
  }

  /**
   * Opción del desplegable. Su nombre accesible es `«Tipo» «Valor»` porque la fila
   * pinta el rótulo del grupo y el valor en dos `span` (p. ej. `Sabor Chocolate`).
   */
  option(type: string, value: string): Locator {
    return this.page.getByRole('option', { name: `${type} ${value}`, exact: true });
  }

  /** Chip ya elegido, p. ej. `Sabor: Chocolate` o `Porciones: 12`. */
  chip(type: string, value: string): Locator {
    return this.root.getByText(`${type}: ${value}`);
  }

  /** × de un chip elegido. */
  removeChip(type: string, value: string): Locator {
    return this.root.getByRole('button', { name: `Quitar ${type}: ${value}`, exact: true });
  }

  async open(): Promise<void> {
    await this.input.click();
    await expect(this.listbox).toBeVisible();
  }

  /** Abre el desplegable y elige un valor existente del catálogo. */
  async pick(type: string, value: string): Promise<void> {
    await this.open();
    await this.option(type, value).click();
    await expect(this.chip(type, value)).toBeVisible();
  }

  /** Teclea para filtrar y devuelve los nombres accesibles de las opciones visibles. */
  async search(term: string): Promise<string[]> {
    await this.input.click();
    await this.input.fill(term);
    await expect(this.listbox).toBeVisible();
    return this.options.allInnerTexts();
  }

  /** Opción «Añadir «X»…» que crea una etiqueta nueva. */
  createOption(value: string): Locator {
    return this.options.filter({ hasText: `Añadir «${value}»` }).first();
  }

  /**
   * Crea una etiqueta nueva escribiéndola y eligiendo «Añadir «X»…». Si el valor no
   * es un número plano, el control pide el **factor de escalado** en un campo extra
   * que hay que confirmar; `factor` cubre ese caso.
   */
  async create(value: string, options?: { group?: string; factor?: string }): Promise<void> {
    await this.input.click();
    await this.input.fill(value);
    await this.createOption(value).click();
    if (options?.group) {
      await this.page.getByRole('option', { name: options.group, exact: true }).click();
    }
    if (options?.factor) {
      const extra = this.listbox.locator('input[type="text"]');
      await extra.fill(options.factor);
      await this.listbox.getByRole('button', { name: 'Confirmar', exact: true }).click();
    }
  }

  toString(): string {
    return `SelectTag(${this.label})`;
  }
}
