import { GeneradorIds, IdEntidad, PREFIJOS_ID } from '../../compartido/dominio/id-entidad';
import {
  AlmacenEnMemoria,
  GeneradorIdsEnMemoria,
} from '../../compartido/infraestructura/memoria/almacen-memoria';
import { Pedido, PedidoPrimitivos } from '../dominio/pedido/pedido';
import { RepositorioPedidos } from '../dominio/pedido/repositorio-pedidos';
import { Venta, VentaPrimitivos } from '../dominio/venta/venta';
import { RepositorioVentas } from '../dominio/venta/repositorio-ventas';

export class RepositorioPedidosEnMemoria implements RepositorioPedidos {
  private readonly almacen = new AlmacenEnMemoria<PedidoPrimitivos>();
  constructor(private readonly ids: GeneradorIds = new GeneradorIdsEnMemoria()) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.pedido);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Pedido.desdePrimitivos(doc) : null;
  }
  async guardar(pedido: Pedido) {
    await this.almacen.guardar(pedido.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Pedido.desdePrimitivos);
  }
}

export class RepositorioVentasEnMemoria implements RepositorioVentas {
  private readonly almacen = new AlmacenEnMemoria<VentaPrimitivos>();
  constructor(private readonly ids: GeneradorIds = new GeneradorIdsEnMemoria()) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.venta);
  }
  async guardar(venta: Venta) {
    await this.almacen.guardar(venta.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Venta.desdePrimitivos);
  }
}
