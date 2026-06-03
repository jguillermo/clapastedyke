import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { SceneSpec } from '../../model/tutorial-types';
import { findForm } from '../../forms/form-registry';

/**
 * Instructive scene: recreates in vector form (HTML/CSS + SVG) the screen of
 * the real software — the Google Sheets sheet, the System menu or an add-on
 * form — and animates a cursor that shows where to click.
 *
 * All animation is CSS (keyframes); with prefers-reduced-motion the final,
 * static state remains.
 */
@Component({
  selector: 'app-scene',
  imports: [NgComponentOutlet, TranslocoPipe],
  providers: [provideTranslocoScope('game', 'tutorial')],
  templateUrl: './scene.html',
  styleUrl: './scene.scss',
})
export class Scene {
  readonly scene = input.required<SceneSpec>();

  /** REAL form to render (replaces the synthetic mockup). */
  protected readonly formComponent = computed(() => {
    const id = this.scene().form;
    return id ? (findForm(id)?.component ?? null) : null;
  });

  /** Inputs passed to the real form. Names kept (resaltar/valores) for the
   *  legacy forms until they are ported separately. */
  protected readonly formInputs = computed(() => ({
    highlight: this.scene().highlightIds ?? [],
    values: this.scene().sampleValues ?? {},
  }));

  /** Translation keys for the System menu filler items, in display order. */
  protected readonly SYSTEM_MENU_KEYS = [
    'game.scene.menu.goToDashboard',
    'game.scene.menu.newQuote',
    'game.scene.menu.viewQuotes',
    'game.scene.menu.viewOrders',
    'game.scene.menu.buyMaterials',
    'game.scene.menu.registerPurchase',
    'game.scene.menu.adjustInventory',
    'game.scene.menu.customers',
    'game.scene.menu.supplies',
    'game.scene.menu.suppliers',
    'game.scene.menu.recipes',
    'game.scene.menu.packagingRules',
    'game.scene.menu.settings',
    'game.scene.menu.maintenance',
  ];

  /** Translation key of the item that gets the submenu arrow ("Maintenance"). */
  protected readonly MAINTENANCE_KEY = 'game.scene.menu.maintenance';

  protected readonly MAINTENANCE_SUBMENU_KEYS = [
    'game.scene.submenu.installOrRepair',
    'game.scene.submenu.createTables',
    'game.scene.submenu.applyDesign',
    'game.scene.submenu.applyFormulas',
    'game.scene.submenu.adjustColumnWidth',
  ];

  /**
   * The content's menuPath uses the real GAS menu names (in Spanish), e.g.
   * ['Sistema', 'Mantenimiento', 'Instalar o reparar (todo)']. We match those
   * canonical labels to translation keys, so highlighting is independent of the
   * active UI language.
   */
  private readonly MENU_LABEL_TO_KEY: Record<string, string> = {
    'ir al resumen': 'game.scene.menu.goToDashboard',
    'nuevo presupuesto': 'game.scene.menu.newQuote',
    'ver presupuestos': 'game.scene.menu.viewQuotes',
    'ver pedidos': 'game.scene.menu.viewOrders',
    'comprar materiales': 'game.scene.menu.buyMaterials',
    'registrar compra': 'game.scene.menu.registerPurchase',
    'ajustar inventario': 'game.scene.menu.adjustInventory',
    clientes: 'game.scene.menu.customers',
    insumos: 'game.scene.menu.supplies',
    proveedores: 'game.scene.menu.suppliers',
    recetas: 'game.scene.menu.recipes',
    'reglas de empaque': 'game.scene.menu.packagingRules',
    configuración: 'game.scene.menu.settings',
    mantenimiento: 'game.scene.menu.maintenance',
  };

  private readonly SUBMENU_LABEL_TO_KEY: Record<string, string> = {
    'instalar o reparar (todo)': 'game.scene.submenu.installOrRepair',
    '1. crear tablas': 'game.scene.submenu.createTables',
    '2. aplicar diseño': 'game.scene.submenu.applyDesign',
    '3. aplicar fórmulas': 'game.scene.submenu.applyFormulas',
    'ajustar ancho de columnas': 'game.scene.submenu.adjustColumnWidth',
  };

  /** Key of the top-level menu item to highlight. */
  protected readonly highlightedMenuKey = computed(
    () => this.MENU_LABEL_TO_KEY[this.norm(this.scene().menuPath?.[1])] ?? null,
  );

  /** Key of the submenu item to highlight (third level of the path). */
  protected readonly highlightedSubmenuKey = computed(
    () => this.SUBMENU_LABEL_TO_KEY[this.norm(this.scene().menuPath?.[2])] ?? null,
  );

  /** Whether the path reaches into the Maintenance submenu. */
  protected readonly hasSubmenu = computed(() => !!this.scene().menuPath?.[2]);

  private norm(label: string | undefined): string {
    return (label ?? '').trim().toLowerCase();
  }
}
