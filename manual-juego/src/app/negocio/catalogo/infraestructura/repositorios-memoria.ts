import { GeneradorIds, IdEntidad, PREFIJOS_ID, PrefijoId } from '../../compartido/dominio/id-entidad';
import {
  AlmacenEnMemoria,
  GeneradorIdsEnMemoria,
} from '../../compartido/infraestructura/memoria/almacen-memoria';
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
 * Repositorios en memoria del catálogo: dobles para tests de casos de uso,
 * con el mismo contrato que los adaptadores IndexedDB.
 */

abstract class RepositorioMemoriaBase<A extends { aPrimitivos(): P }, P extends { id: string; nombre?: string }> {
  protected readonly almacen = new AlmacenEnMemoria<P>();
  constructor(
    protected readonly ids: GeneradorIds,
    private readonly prefijo: PrefijoId,
    private readonly rehidratar: (p: P) => A,
  ) {}

  siguienteId() {
    return this.ids.siguiente(this.prefijo);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? this.rehidratar(doc) : null;
  }
  async porNombre(nombre: string) {
    const docs = await this.almacen.todos();
    const buscado = nombre.trim().toLowerCase();
    const doc = docs.find(d => (d.nombre ?? '').trim().toLowerCase() === buscado);
    return doc ? this.rehidratar(doc) : null;
  }
  async guardar(agregado: A) {
    await this.almacen.guardar(agregado.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(this.rehidratar);
  }
}

export class RepositorioClientesEnMemoria
  extends RepositorioMemoriaBase<Cliente, ClientePrimitivos>
  implements RepositorioClientes
{
  constructor(ids: GeneradorIds = new GeneradorIdsEnMemoria()) {
    super(ids, PREFIJOS_ID.cliente, Cliente.desdePrimitivos);
  }
}

export class RepositorioProveedoresEnMemoria
  extends RepositorioMemoriaBase<Proveedor, ProveedorPrimitivos>
  implements RepositorioProveedores
{
  constructor(ids: GeneradorIds = new GeneradorIdsEnMemoria()) {
    super(ids, PREFIJOS_ID.proveedor, Proveedor.desdePrimitivos);
  }
}

export class RepositorioInsumosEnMemoria
  extends RepositorioMemoriaBase<Insumo, InsumoPrimitivos>
  implements RepositorioInsumos
{
  constructor(ids: GeneradorIds = new GeneradorIdsEnMemoria()) {
    super(ids, PREFIJOS_ID.insumo, Insumo.desdePrimitivos);
  }
  async porTipo(tipo: TipoInsumo) {
    return (await this.todos()).filter(i => i.tipo === tipo);
  }
}

export class RepositorioRecetasEnMemoria
  extends RepositorioMemoriaBase<Receta, RecetaPrimitivos>
  implements RepositorioRecetas
{
  constructor(ids: GeneradorIds = new GeneradorIdsEnMemoria()) {
    super(ids, PREFIJOS_ID.receta, Receta.desdePrimitivos);
  }
}

export class RepositorioReglasEmpaqueEnMemoria
  extends RepositorioMemoriaBase<ReglaEmpaque, ReglaEmpaquePrimitivos>
  implements RepositorioReglasEmpaque
{
  constructor(ids: GeneradorIds = new GeneradorIdsEnMemoria()) {
    super(ids, PREFIJOS_ID.reglaEmpaque, ReglaEmpaque.desdePrimitivos);
  }
  async deRecetaYTamano(recetaId: IdEntidad, tamano: string) {
    const limpio = tamano.trim().toLowerCase();
    return (await this.todos()).filter(
      r => r.recetaId.esIgualA(recetaId) && r.tamano === limpio,
    );
  }
}
