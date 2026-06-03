import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ConfiguracionPrimitivos } from '../../dominio/configuracion-negocio';
import { RepositorioConfiguracion } from '../../dominio/repositorio-configuracion';

/** Carga la configuración (con defaults de fábrica si es la primera vez). */
export class ObtenerConfiguracion implements CasoDeUso<void, ConfiguracionPrimitivos> {
  constructor(private readonly configuracion: RepositorioConfiguracion) {}

  async ejecutar(): Promise<ConfiguracionPrimitivos> {
    return (await this.configuracion.obtener()).aPrimitivos();
  }
}
