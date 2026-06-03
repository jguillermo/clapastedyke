import { GeneradorIds, IdEntidad, PREFIJOS_ID } from '../../compartido/dominio/id-entidad';
import {
  AlmacenEnMemoria,
  GeneradorIdsEnMemoria,
} from '../../compartido/infraestructura/memoria/almacen-memoria';
import { Presupuesto, PresupuestoPrimitivos } from '../dominio/presupuesto/presupuesto';
import { RepositorioPresupuestos } from '../dominio/presupuesto/repositorio-presupuestos';

/** Doble en memoria para tests. */
export class RepositorioPresupuestosEnMemoria implements RepositorioPresupuestos {
  private readonly almacen = new AlmacenEnMemoria<PresupuestoPrimitivos>();
  constructor(private readonly ids: GeneradorIds = new GeneradorIdsEnMemoria()) {}

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
