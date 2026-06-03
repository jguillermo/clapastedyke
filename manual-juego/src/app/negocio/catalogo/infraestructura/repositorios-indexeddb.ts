import { GeneradorIds, IdEntidad, PREFIJOS_ID } from '../../compartido/dominio/id-entidad';
import { AlmacenIndexedDb } from '../../compartido/infraestructura/indexeddb/almacen';
import { Cliente, ClientePrimitivos } from '../dominio/cliente/cliente';
import { RepositorioClientes } from '../dominio/cliente/repositorio-clientes';
import { Insumo, InsumoPrimitivos, TipoInsumo } from '../dominio/insumo/insumo';
import { RepositorioInsumos } from '../dominio/insumo/repositorio-insumos';
import { Proveedor, ProveedorPrimitivos } from '../dominio/proveedor/proveedor';
import { RepositorioProveedores } from '../dominio/proveedor/repositorio-proveedores';
import { Receta, RecetaPrimitivos } from '../dominio/receta/receta';
import { RepositorioRecetas } from '../dominio/receta/repositorio-recetas';
import { ReglaEmpaque, ReglaEmpaquePrimitivos } from '../dominio/regla-empaque/regla-empaque';
import { RepositorioReglasEmpaque } from '../dominio/regla-empaque/repositorio-reglas-empaque';

/**
 * Adaptadores IndexedDB del catálogo: la ÚNICA implementación de persistencia
 * de la web (la base de datos del navegador). Serializan el agregado a
 * primitivos y rehidratan con sus factorías; el dominio nunca ve IndexedDB.
 */

const igualNombre = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export class RepositorioClientesIndexedDb implements RepositorioClientes {
  private readonly almacen = new AlmacenIndexedDb<ClientePrimitivos>('clientes');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.cliente);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Cliente.desdePrimitivos(doc) : null;
  }
  async porNombre(nombre: string) {
    const docs = await this.almacen.todos();
    const doc = docs.find(d => igualNombre(d.nombre, nombre));
    return doc ? Cliente.desdePrimitivos(doc) : null;
  }
  async guardar(cliente: Cliente) {
    await this.almacen.guardar(cliente.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Cliente.desdePrimitivos);
  }
}

export class RepositorioProveedoresIndexedDb implements RepositorioProveedores {
  private readonly almacen = new AlmacenIndexedDb<ProveedorPrimitivos>('proveedores');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.proveedor);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Proveedor.desdePrimitivos(doc) : null;
  }
  async porNombre(nombre: string) {
    const docs = await this.almacen.todos();
    const doc = docs.find(d => igualNombre(d.nombre, nombre));
    return doc ? Proveedor.desdePrimitivos(doc) : null;
  }
  async guardar(proveedor: Proveedor) {
    await this.almacen.guardar(proveedor.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Proveedor.desdePrimitivos);
  }
}

export class RepositorioInsumosIndexedDb implements RepositorioInsumos {
  private readonly almacen = new AlmacenIndexedDb<InsumoPrimitivos>('insumos');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.insumo);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Insumo.desdePrimitivos(doc) : null;
  }
  async porNombre(nombre: string) {
    const docs = await this.almacen.todos();
    const doc = docs.find(d => igualNombre(d.nombre, nombre));
    return doc ? Insumo.desdePrimitivos(doc) : null;
  }
  async guardar(insumo: Insumo) {
    await this.almacen.guardar(insumo.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Insumo.desdePrimitivos);
  }
  async porTipo(tipo: TipoInsumo) {
    return (await this.almacen.todos()).filter(d => d.tipo === tipo).map(Insumo.desdePrimitivos);
  }
}

export class RepositorioRecetasIndexedDb implements RepositorioRecetas {
  private readonly almacen = new AlmacenIndexedDb<RecetaPrimitivos>('recetas');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.receta);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Receta.desdePrimitivos(doc) : null;
  }
  async porNombre(nombre: string) {
    const docs = await this.almacen.todos();
    const doc = docs.find(d => igualNombre(d.nombre, nombre));
    return doc ? Receta.desdePrimitivos(doc) : null;
  }
  async guardar(receta: Receta) {
    await this.almacen.guardar(receta.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Receta.desdePrimitivos);
  }
}

export class RepositorioReglasEmpaqueIndexedDb implements RepositorioReglasEmpaque {
  private readonly almacen = new AlmacenIndexedDb<ReglaEmpaquePrimitivos>('reglas_empaque');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.reglaEmpaque);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? ReglaEmpaque.desdePrimitivos(doc) : null;
  }
  async guardar(regla: ReglaEmpaque) {
    await this.almacen.guardar(regla.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(ReglaEmpaque.desdePrimitivos);
  }
  async deRecetaYTamano(recetaId: IdEntidad, tamano: string) {
    const limpio = tamano.trim().toLowerCase();
    return (await this.almacen.todos())
      .filter(d => d.recetaId === recetaId.valor && d.tamano === limpio)
      .map(ReglaEmpaque.desdePrimitivos);
  }
}
