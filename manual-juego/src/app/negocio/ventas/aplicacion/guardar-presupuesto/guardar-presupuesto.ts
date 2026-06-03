import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioClientes } from '../../../catalogo/dominio/cliente/repositorio-clientes';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioRecetas } from '../../../catalogo/dominio/receta/repositorio-recetas';
import { RepositorioConfiguracion } from '../../../configuracion/dominio/repositorio-configuracion';
import { Presupuesto } from '../../dominio/presupuesto/presupuesto';
import { RepositorioPresupuestos } from '../../dominio/presupuesto/repositorio-presupuestos';
import {
  PeticionCalcularPresupuesto,
  calcularConCatalogo,
} from '../calcular-presupuesto/calcular-presupuesto';

export interface PeticionGuardarPresupuesto extends PeticionCalcularPresupuesto {
  clienteId: string;
  notas?: string;
}

export interface RespuestaGuardarPresupuesto {
  id: string;
  precioFinalSoles: number;
}

/**
 * Guarda la cotización CONGELADA (Flujo 01): recalcula con los precios de hoy
 * y los fija para siempre en el agregado. Nace Pendiente, con vencimiento a
 * los días de configuración. Todavía no toca el inventario.
 */
export class GuardarPresupuesto
  implements CasoDeUso<PeticionGuardarPresupuesto, RespuestaGuardarPresupuesto>
{
  constructor(
    private readonly presupuestos: RepositorioPresupuestos,
    private readonly clientes: RepositorioClientes,
    private readonly recetas: RepositorioRecetas,
    private readonly insumos: RepositorioInsumos,
    private readonly configuracion: RepositorioConfiguracion,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarPresupuesto): Promise<RespuestaGuardarPresupuesto> {
    const cliente = await this.clientes.porId(IdEntidad.desde(peticion.clienteId));
    if (!cliente) throw new ErrorNoEncontrado('Cliente', peticion.clienteId);

    const { receta, calculo } = await calcularConCatalogo(
      this.recetas,
      this.insumos,
      this.configuracion,
      peticion,
    );
    const config = await this.configuracion.obtener();

    const presupuesto = Presupuesto.crear(await this.presupuestos.siguienteId(), {
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      recetaId: receta.id,
      recetaNombre: receta.nombre,
      modoEscalado: peticion.modoEscalado,
      valorEscalado: peticion.valorEscalado ?? 0,
      calculo,
      notas: peticion.notas,
      diasVencimiento: config.generales.diasVencimiento,
    });

    await this.presupuestos.guardar(presupuesto);
    await this.bus.publicar(presupuesto.extraerEventos());
    return { id: presupuesto.id.valor, precioFinalSoles: calculo.precioFinal.soles };
  }
}
