import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ParametrosGenerales, TamanoNegocio } from '../../dominio/configuracion-negocio';
import { RepositorioConfiguracion } from '../../dominio/repositorio-configuracion';

export interface PeticionActualizarConfiguracion {
  generales?: Partial<ParametrosGenerales>;
  tamanos?: TamanoNegocio[];
}

/**
 * Edita la configuración (Flujo 13): parámetros generales y/o tamaños.
 * Afecta solo a los presupuestos NUEVOS — los guardados están congelados.
 */
export class ActualizarConfiguracion
  implements CasoDeUso<PeticionActualizarConfiguracion, void>
{
  constructor(
    private readonly configuracion: RepositorioConfiguracion,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionActualizarConfiguracion): Promise<void> {
    const config = await this.configuracion.obtener();
    if (peticion.generales) config.actualizarGenerales(peticion.generales);
    if (peticion.tamanos) config.reemplazarTamanos(peticion.tamanos);
    await this.configuracion.guardar(config);
    await this.bus.publicar(config.extraerEventos());
  }
}
