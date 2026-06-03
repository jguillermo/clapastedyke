import { Type } from '@angular/core';
import { AdjustInventoryForm } from './adjust-inventory/adjust-inventory-form';
import { BuyMaterialsForm } from './buy-materials/buy-materials-form';
import { CustomerForm } from './customer/customer-form';
import { NewQuoteForm } from './new-quote/new-quote-form';
import { OrderDetailForm } from './order-detail/order-detail-form';
import { OrdersListForm } from './orders-list/orders-list-form';
import { PackagingRuleForm } from './packaging-rule/packaging-rule-form';
import { QuoteDetailForm } from './quote-detail/quote-detail-form';
import { QuotesListForm } from './quotes-list/quotes-list-form';
import { RecipeForm } from './recipe/recipe-form';
import { RegisterPurchaseForm } from './register-purchase/register-purchase-form';
import { SettingsForm } from './settings/settings-form';
import { SupplierForm } from './supplier/supplier-form';
import { SupplyForm } from './supply/supply-form';

/** A ported form definition: component + export metadata. */
export interface FormDefinition {
  /** Route and game-scene id, e.g. 'clientes' (kept from the GAS export). */
  id: string;
  /** Generated GAS file name (without .html), e.g. 'ClientesForm'. */
  gasFile: string;
  /** Transloco key for the dialog title, e.g. 'formsCatalog.customer.title'. */
  titleKey: string;
  component: Type<unknown>;
}

/**
 * Central registry: id → component.
 *
 * This file holds the FIRST seven ported forms. The remaining seven
 * (quote/order/purchase flows) are appended here by the coordinator at
 * cutover, so keep the structure flat and trivially extensible: just add new
 * { id, gasFile, titleKey, component } entries to the FORMS array below.
 */
export const FORMS: FormDefinition[] = [
  { id: 'clientes', gasFile: 'ClientesForm', titleKey: 'formsCatalog.customer.title', component: CustomerForm },
  { id: 'proveedores', gasFile: 'ProveedoresForm', titleKey: 'formsCatalog.supplier.title', component: SupplierForm },
  { id: 'insumos', gasFile: 'InsumosForm', titleKey: 'formsCatalog.supply.title', component: SupplyForm },
  { id: 'recetas', gasFile: 'RecetasForm', titleKey: 'formsCatalog.recipe.title', component: RecipeForm },
  { id: 'reglas-empaque', gasFile: 'ReglasEmpaqueForm', titleKey: 'formsCatalog.packagingRule.title', component: PackagingRuleForm },
  { id: 'configuracion', gasFile: 'ConfiguracionForm', titleKey: 'formsCatalog.settings.title', component: SettingsForm },
  { id: 'ajustar-inventario', gasFile: 'AjustarInventarioForm', titleKey: 'formsCatalog.adjustInventory.title', component: AdjustInventoryForm },
  { id: 'nuevo-presupuesto', gasFile: 'NuevoPresupuestoForm', titleKey: 'formsSales.newQuote.title', component: NewQuoteForm },
  { id: 'ver-presupuestos', gasFile: 'VerPresupuestosForm', titleKey: 'formsSales.quotesList.title', component: QuotesListForm },
  { id: 'detalle-presupuesto', gasFile: 'DetallePresupuestoForm', titleKey: 'formsSales.quoteDetail.title', component: QuoteDetailForm },
  { id: 'ver-pedidos', gasFile: 'VerPedidosForm', titleKey: 'formsSales.ordersList.title', component: OrdersListForm },
  { id: 'detalle-pedido', gasFile: 'DetallePedidoForm', titleKey: 'formsSales.orderDetail.title', component: OrderDetailForm },
  { id: 'comprar-materiales', gasFile: 'ComprarMaterialesForm', titleKey: 'formsSales.buyMaterials.title', component: BuyMaterialsForm },
  { id: 'registrar-compra', gasFile: 'RegistrarCompraForm', titleKey: 'formsSales.registerPurchase.title', component: RegisterPurchaseForm },
];

export function findForm(id: string): FormDefinition | undefined {
  return FORMS.find(f => f.id === id);
}
