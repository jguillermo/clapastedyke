import { ConfiguracionNegocio } from '../dominio/configuracion-negocio';
import { RepositorioConfiguracion } from '../dominio/repositorio-configuracion';

/** Doble en memoria para tests. */
export class RepositorioConfiguracionEnMemoria implements RepositorioConfiguracion {
  private actual: ConfiguracionNegocio | null = null;

  async obtener(): Promise<ConfiguracionNegocio> {
    this.actual ??= ConfiguracionNegocio.porDefecto();
    return ConfiguracionNegocio.desdePrimitivos(this.actual.aPrimitivos());
  }

  async guardar(configuracion: ConfiguracionNegocio): Promise<void> {
    this.actual = ConfiguracionNegocio.desdePrimitivos(configuracion.aPrimitivos());
  }
}
