import { Injectable } from '@angular/core';
import { BusEventosEnMemoria } from '../negocio/compartido/aplicacion/bus-eventos';
import { GeneradorIdsIndexedDb } from '../negocio/compartido/infraestructura/indexeddb/generador-ids-indexeddb';
// Catálogo
import { GuardarCliente } from '../negocio/catalogo/aplicacion/guardar-cliente/guardar-cliente';
import { ListarClientes } from '../negocio/catalogo/aplicacion/listar-clientes/listar-clientes';
import { GuardarProveedor } from '../negocio/catalogo/aplicacion/guardar-proveedor/guardar-proveedor';
import { ListarProveedores } from '../negocio/catalogo/aplicacion/listar-proveedores/listar-proveedores';
import { GuardarInsumo } from '../negocio/catalogo/aplicacion/guardar-insumo/guardar-insumo';
import { ListarInsumos } from '../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { GuardarReceta } from '../negocio/catalogo/aplicacion/guardar-receta/guardar-receta';
import { ListarRecetas } from '../negocio/catalogo/aplicacion/listar-recetas/listar-recetas';
import { GuardarReglaEmpaque } from '../negocio/catalogo/aplicacion/guardar-regla-empaque/guardar-regla-empaque';
import { ListarReglasEmpaque } from '../negocio/catalogo/aplicacion/listar-reglas-empaque/listar-reglas-empaque';
import {
  RepositorioClientesIndexedDb,
  RepositorioInsumosIndexedDb,
  RepositorioProveedoresIndexedDb,
  RepositorioRecetasIndexedDb,
  RepositorioReglasEmpaqueIndexedDb,
} from '../negocio/catalogo/infraestructura/repositorios-indexeddb';
// Configuración
import { ObtenerConfiguracion } from '../negocio/configuracion/aplicacion/obtener-configuracion/obtener-configuracion';
import { ActualizarConfiguracion } from '../negocio/configuracion/aplicacion/actualizar-configuracion/actualizar-configuracion';
import {
  RepositorioConfiguracionIndexedDb,
  TamanosDesdeConfiguracion,
} from '../negocio/configuracion/infraestructura/repositorio-configuracion-indexeddb';
// Inventario
import { ServicioStock } from '../negocio/inventario/dominio/servicio-stock';
import { RegistrarCompra } from '../negocio/inventario/aplicacion/registrar-compra/registrar-compra';
import {
  AjustarInventario,
  PrevisualizarAjuste,
} from '../negocio/inventario/aplicacion/ajustar-inventario/ajustar-inventario';
import {
  FaltantesDePedido,
  InsumosBajoMinimo,
} from '../negocio/inventario/aplicacion/lista-compras/lista-compras';
import { ListarCompras } from '../negocio/inventario/aplicacion/listar-compras/listar-compras';
import { ListarMovimientos } from '../negocio/inventario/aplicacion/listar-movimientos/listar-movimientos';
import { ObtenerResumen } from '../negocio/resumen/aplicacion/obtener-resumen/obtener-resumen';
import { RegistrarStockInicial } from '../negocio/inventario/aplicacion/registrar-stock-inicial/registrar-stock-inicial';
import {
  RepositorioComprasIndexedDb,
  RepositorioMovimientosIndexedDb,
} from '../negocio/inventario/infraestructura/repositorios-indexeddb';
// Ventas
import { CalcularPresupuesto } from '../negocio/ventas/aplicacion/calcular-presupuesto/calcular-presupuesto';
import { GuardarPresupuesto } from '../negocio/ventas/aplicacion/guardar-presupuesto/guardar-presupuesto';
import { ListarPresupuestos } from '../negocio/ventas/aplicacion/listar-presupuestos/listar-presupuestos';
import { RechazarPresupuesto } from '../negocio/ventas/aplicacion/rechazar-presupuesto/rechazar-presupuesto';
import { AprobarPresupuesto } from '../negocio/ventas/aplicacion/aprobar-presupuesto/aprobar-presupuesto';
import { IniciarProduccion } from '../negocio/ventas/aplicacion/iniciar-produccion/iniciar-produccion';
import { MarcarEntregado } from '../negocio/ventas/aplicacion/marcar-entregado/marcar-entregado';
import { CancelarPedido } from '../negocio/ventas/aplicacion/cancelar-pedido/cancelar-pedido';
import { ListarPedidos } from '../negocio/ventas/aplicacion/listar-pedidos/listar-pedidos';
import { RepositorioPresupuestosIndexedDb } from '../negocio/ventas/infraestructura/repositorio-presupuestos-indexeddb';
import {
  RepositorioPedidosIndexedDb,
  RepositorioVentasIndexedDb,
} from '../negocio/ventas/infraestructura/repositorios-pedidos-ventas-indexeddb';

/**
 * RAÍZ DE COMPOSICIÓN del BC Costeo: el único punto donde Angular conoce el
 * negocio. Instancia los adaptadores IndexedDB (la persistencia real de la
 * web), cablea los casos de uso y suscribe los manejadores de eventos.
 * El dominio (`negocio/`) sigue 100% libre de Angular.
 */
@Injectable({ providedIn: 'root' })
export class Negocio {
  private readonly ids = new GeneradorIdsIndexedDb();
  readonly bus = new BusEventosEnMemoria();

  // Repositorios (IndexedDB — la base de datos del navegador)
  private readonly repoClientes = new RepositorioClientesIndexedDb(this.ids);
  private readonly repoProveedores = new RepositorioProveedoresIndexedDb(this.ids);
  private readonly repoInsumos = new RepositorioInsumosIndexedDb(this.ids);
  private readonly repoRecetas = new RepositorioRecetasIndexedDb(this.ids);
  private readonly repoReglas = new RepositorioReglasEmpaqueIndexedDb(this.ids);
  private readonly repoConfiguracion = new RepositorioConfiguracionIndexedDb();
  private readonly repoPresupuestos = new RepositorioPresupuestosIndexedDb(this.ids);
  private readonly repoPedidos = new RepositorioPedidosIndexedDb(this.ids);
  private readonly repoVentas = new RepositorioVentasIndexedDb(this.ids);
  private readonly repoCompras = new RepositorioComprasIndexedDb(this.ids);
  private readonly repoMovimientos = new RepositorioMovimientosIndexedDb(this.ids);

  // Servicios de dominio
  private readonly servicioStock = new ServicioStock(this.repoInsumos, this.repoMovimientos);
  private readonly tamanos = new TamanosDesdeConfiguracion(this.repoConfiguracion);

  // Casos de uso — catálogo
  readonly guardarCliente = new GuardarCliente(this.repoClientes, this.bus);
  readonly listarClientes = new ListarClientes(this.repoClientes);
  readonly guardarProveedor = new GuardarProveedor(this.repoProveedores, this.bus);
  readonly listarProveedores = new ListarProveedores(this.repoProveedores);
  readonly guardarInsumo = new GuardarInsumo(this.repoInsumos, this.bus);
  readonly listarInsumos = new ListarInsumos(this.repoInsumos);
  readonly guardarReceta = new GuardarReceta(this.repoRecetas, this.repoInsumos, this.bus);
  readonly listarRecetas = new ListarRecetas(this.repoRecetas);
  readonly guardarReglaEmpaque = new GuardarReglaEmpaque(
    this.repoReglas, this.repoRecetas, this.repoInsumos, this.tamanos, this.bus,
  );
  readonly listarReglasEmpaque = new ListarReglasEmpaque(this.repoReglas);

  // Casos de uso — configuración
  readonly obtenerConfiguracion = new ObtenerConfiguracion(this.repoConfiguracion);
  readonly actualizarConfiguracion = new ActualizarConfiguracion(this.repoConfiguracion, this.bus);

  // Casos de uso — ventas
  readonly calcularPresupuesto = new CalcularPresupuesto(
    this.repoRecetas, this.repoInsumos, this.repoConfiguracion,
  );
  readonly guardarPresupuesto = new GuardarPresupuesto(
    this.repoPresupuestos, this.repoClientes, this.repoRecetas,
    this.repoInsumos, this.repoConfiguracion, this.bus,
  );
  readonly listarPresupuestos = new ListarPresupuestos(this.repoPresupuestos);
  readonly rechazarPresupuesto = new RechazarPresupuesto(this.repoPresupuestos, this.bus);
  readonly aprobarPresupuesto = new AprobarPresupuesto(
    this.repoPresupuestos, this.repoPedidos, this.repoInsumos,
    this.servicioStock, this.repoConfiguracion, this.bus,
  );
  readonly iniciarProduccion = new IniciarProduccion(this.repoPedidos, this.servicioStock, this.bus);
  readonly marcarEntregado = new MarcarEntregado(
    this.repoPedidos, this.repoPresupuestos, this.repoVentas, this.bus,
  );
  readonly cancelarPedido = new CancelarPedido(
    this.repoPedidos, this.repoMovimientos, this.servicioStock, this.bus,
  );
  readonly listarPedidos = new ListarPedidos(this.repoPedidos);

  // Casos de uso — inventario
  readonly registrarCompra = new RegistrarCompra(
    this.repoCompras, this.repoInsumos, this.repoProveedores, this.servicioStock, this.bus,
  );
  readonly ajustarInventario = new AjustarInventario(
    this.repoInsumos, this.repoConfiguracion, this.servicioStock, this.bus,
  );
  readonly previsualizarAjuste = new PrevisualizarAjuste(this.repoInsumos, this.repoConfiguracion);
  readonly faltantesDePedido = new FaltantesDePedido(
    this.repoPedidos, this.repoInsumos, this.repoProveedores,
  );
  readonly insumosBajoMinimo = new InsumosBajoMinimo(this.repoInsumos, this.repoProveedores);
  readonly listarCompras = new ListarCompras(this.repoCompras);
  readonly listarMovimientos = new ListarMovimientos(this.repoMovimientos);

  // Casos de uso — resumen (proyección de lectura del panel Inicio)
  readonly obtenerResumen = new ObtenerResumen(
    this.repoPresupuestos, this.repoPedidos, this.repoInsumos,
  );

  constructor() {
    // Suscriptores de eventos de dominio
    const stockInicial = new RegistrarStockInicial(this.repoMovimientos);
    this.bus.suscribir('InsumoCreado', e => stockInicial.manejar(e));
  }
}
