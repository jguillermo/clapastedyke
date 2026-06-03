import { GeneradorIds, IdEntidad, PREFIJOS_ID } from '../../compartido/dominio/id-entidad';
import {
  AlmacenEnMemoria,
  GeneradorIdsEnMemoria,
} from '../../compartido/infraestructura/memoria/almacen-memoria';
import { Compra, CompraPrimitivos } from '../dominio/compra/compra';
import { RepositorioCompras } from '../dominio/compra/repositorio-compras';
import { Movimiento, MovimientoPrimitivos, TipoMovimiento } from '../dominio/movimiento/movimiento';
import { RepositorioMovimientos } from '../dominio/movimiento/repositorio-movimientos';

export class RepositorioMovimientosEnMemoria implements RepositorioMovimientos {
  private readonly almacen = new AlmacenEnMemoria<MovimientoPrimitivos>();
  constructor(private readonly ids: GeneradorIds = new GeneradorIdsEnMemoria()) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.movimiento);
  }
  async guardar(movimiento: Movimiento) {
    await this.almacen.guardar(movimiento.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Movimiento.desdePrimitivos);
  }
  async porReferenciaYTipo(referencia: string, tipo: TipoMovimiento) {
    return (await this.almacen.todos())
      .filter(m => m.referencia === referencia && m.tipo === tipo)
      .map(Movimiento.desdePrimitivos);
  }
}

export class RepositorioComprasEnMemoria implements RepositorioCompras {
  private readonly almacen = new AlmacenEnMemoria<CompraPrimitivos>();
  constructor(private readonly ids: GeneradorIds = new GeneradorIdsEnMemoria()) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.compra);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Compra.desdePrimitivos(doc) : null;
  }
  async guardar(compra: Compra) {
    await this.almacen.guardar(compra.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Compra.desdePrimitivos);
  }
}
