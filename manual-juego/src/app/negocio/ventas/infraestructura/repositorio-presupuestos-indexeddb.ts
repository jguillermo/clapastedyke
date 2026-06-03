import { GeneradorIds, IdEntidad, PREFIJOS_ID } from '../../compartido/dominio/id-entidad';
import { AlmacenIndexedDb } from '../../compartido/infraestructura/indexeddb/almacen';
import { Presupuesto, PresupuestoPrimitivos } from '../dominio/presupuesto/presupuesto';
import { RepositorioPresupuestos } from '../dominio/presupuesto/repositorio-presupuestos';

/** Persistencia del presupuesto (con su detalle congelado) en el navegador. */
export class RepositorioPresupuestosIndexedDb implements RepositorioPresupuestos {
  private readonly almacen = new AlmacenIndexedDb<PresupuestoPrimitivos>('presupuestos');
  constructor(private readonly ids: GeneradorIds) {}

  siguienteId() {
    return this.ids.siguiente(PREFIJOS_ID.presupuesto);
  }
  async porId(id: IdEntidad) {
    const doc = await this.almacen.obtener(id.valor);
    return doc ? Presupuesto.desdePrimitivos(doc) : null;
  }
  async guardar(presupuesto: Presupuesto) {
    await this.almacen.guardar(presupuesto.aPrimitivos());
  }
  async todos() {
    return (await this.almacen.todos()).map(Presupuesto.desdePrimitivos);
  }
}
