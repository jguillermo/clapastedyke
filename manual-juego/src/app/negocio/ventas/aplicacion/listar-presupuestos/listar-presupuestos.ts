import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { formatoFecha } from '../../../compartido/aplicacion/formatos';
import { Dinero } from '../../../compartido/dominio/dinero';
import {
  EstadoVisiblePresupuesto,
  PresupuestoPrimitivos,
} from '../../dominio/presupuesto/presupuesto';
import { RepositorioPresupuestos } from '../../dominio/presupuesto/repositorio-presupuestos';

export interface PresupuestoListado extends PresupuestoPrimitivos {
  /** Lo que la lista muestra: un Pendiente con fecha pasada sale «Vencido». */
  estadoVisible: EstadoVisiblePresupuesto;
  precioFinalFormato: string;
  fechaEmisionFormato: string;
  fechaVencimientoFormato: string;
}

export interface PeticionListarPresupuestos {
  estado?: EstadoVisiblePresupuesto;
  clienteId?: string;
}

export class ListarPresupuestos
  implements CasoDeUso<PeticionListarPresupuestos, PresupuestoListado[]>
{
  constructor(private readonly presupuestos: RepositorioPresupuestos) {}

  async ejecutar(peticion: PeticionListarPresupuestos = {}): Promise<PresupuestoListado[]> {
    const hoy = new Date();
    let lista = (await this.presupuestos.todos()).map(p => {
      const primitivos = p.aPrimitivos();
      return {
        ...primitivos,
        estadoVisible: p.estadoVisible(hoy),
        precioFinalFormato: Dinero.desdeSoles(primitivos.precioFinalSoles).formato(),
        fechaEmisionFormato: formatoFecha(primitivos.fechaEmision),
        fechaVencimientoFormato: formatoFecha(primitivos.fechaVencimiento),
      };
    });
    if (peticion.estado) lista = lista.filter(p => p.estadoVisible === peticion.estado);
    if (peticion.clienteId) lista = lista.filter(p => p.clienteId === peticion.clienteId);
    // Más recientes primero, como la lista del GAS.
    return lista.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  }
}
