import { ConfiguracionNegocio } from './configuracion-negocio';

/**
 * Puerto de persistencia de la configuración (agregado singleton).
 * `obtener()` siembra y devuelve los defaults de fábrica si aún no existe
 * (equivalente al seed del instalador GAS).
 */
export interface RepositorioConfiguracion {
  obtener(): Promise<ConfiguracionNegocio>;
  guardar(configuracion: ConfiguracionNegocio): Promise<void>;
}
