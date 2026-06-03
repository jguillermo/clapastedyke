import { Type } from '@angular/core';
import { AjustarInventarioForm } from './ajustar-inventario/ajustar-inventario-form';
import { ClientesForm } from './clientes/clientes-form';
import { ComprarMaterialesForm } from './comprar-materiales/comprar-materiales-form';
import { ConfiguracionForm } from './configuracion/configuracion-form';
import { DetallePedidoForm } from './detalle-pedido/detalle-pedido-form';
import { DetallePresupuestoForm } from './detalle-presupuesto/detalle-presupuesto-form';
import { InsumosForm } from './insumos/insumos-form';
import { NuevoPresupuestoForm } from './nuevo-presupuesto/nuevo-presupuesto-form';
import { ProveedoresForm } from './proveedores/proveedores-form';
import { RecetasForm } from './recetas/recetas-form';
import { RegistrarCompraForm } from './registrar-compra/registrar-compra-form';
import { ReglasEmpaqueForm } from './reglas-empaque/reglas-empaque-form';
import { VerPedidosForm } from './ver-pedidos/ver-pedidos-form';
import { VerPresupuestosForm } from './ver-presupuestos/ver-presupuestos-form';

/** Definición de un formulario migrado: componente + metadatos del export. */
export interface DefinicionFormulario {
  /** Id de ruta y de escena del juego, p.ej. 'clientes'. */
  id: string;
  /** Nombre del archivo GAS generado (sin .html), p.ej. 'ClientesForm'. */
  archivoGas: string;
  titulo: string;
  componente: Type<unknown>;
}

/** Registro central: id → componente. Los 14 formularios del sistema. */
export const FORMULARIOS: DefinicionFormulario[] = [
  { id: 'clientes', archivoGas: 'ClientesForm', titulo: 'Clientes', componente: ClientesForm },
  { id: 'proveedores', archivoGas: 'ProveedoresForm', titulo: 'Proveedores', componente: ProveedoresForm },
  { id: 'insumos', archivoGas: 'InsumosForm', titulo: 'Insumos', componente: InsumosForm },
  { id: 'recetas', archivoGas: 'RecetasForm', titulo: 'Recetas', componente: RecetasForm },
  { id: 'reglas-empaque', archivoGas: 'ReglasEmpaqueForm', titulo: 'Reglas de empaque', componente: ReglasEmpaqueForm },
  { id: 'ajustar-inventario', archivoGas: 'AjustarInventarioForm', titulo: 'Ajustar inventario', componente: AjustarInventarioForm },
  { id: 'configuracion', archivoGas: 'ConfiguracionForm', titulo: 'Configuración', componente: ConfiguracionForm },
  { id: 'nuevo-presupuesto', archivoGas: 'NuevoPresupuestoForm', titulo: 'Nuevo presupuesto', componente: NuevoPresupuestoForm },
  { id: 'ver-presupuestos', archivoGas: 'VerPresupuestosForm', titulo: 'Ver presupuestos', componente: VerPresupuestosForm },
  { id: 'detalle-presupuesto', archivoGas: 'DetallePresupuestoForm', titulo: 'Detalle de presupuesto', componente: DetallePresupuestoForm },
  { id: 'ver-pedidos', archivoGas: 'VerPedidosForm', titulo: 'Ver pedidos', componente: VerPedidosForm },
  { id: 'detalle-pedido', archivoGas: 'DetallePedidoForm', titulo: 'Detalle de pedido', componente: DetallePedidoForm },
  { id: 'comprar-materiales', archivoGas: 'ComprarMaterialesForm', titulo: 'Comprar materiales', componente: ComprarMaterialesForm },
  { id: 'registrar-compra', archivoGas: 'RegistrarCompraForm', titulo: 'Registrar compra', componente: RegistrarCompraForm },
];

export function buscarFormulario(id: string): DefinicionFormulario | undefined {
  return FORMULARIOS.find(f => f.id === id);
}
