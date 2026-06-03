import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioPresupuestos } from '../../dominio/presupuesto/repositorio-presupuestos';

export interface PeticionRechazarPresupuesto {
  presupuestoId: string;
  motivo?: string;
}

/** Rechazar (Flujo 02.2): guarda el motivo; ni pedido ni stock se tocan. */
export class RechazarPresupuesto implements CasoDeUso<PeticionRechazarPresupuesto, void> {
  constructor(
    private readonly presupuestos: RepositorioPresupuestos,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionRechazarPresupuesto): Promise<void> {
    const presupuesto = await this.presupuestos.porId(IdEntidad.desde(peticion.presupuestoId));
    if (!presupuesto) throw new ErrorNoEncontrado('Presupuesto', peticion.presupuestoId);
    presupuesto.rechazar(peticion.motivo ?? '');
    await this.presupuestos.guardar(presupuesto);
    await this.bus.publicar(presupuesto.extraerEventos());
  }
}
