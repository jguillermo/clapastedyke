import { AlmacenIndexedDb } from '../../compartido/infraestructura/indexeddb/almacen';
import {
  ConfiguracionNegocio,
  ConfiguracionPrimitivos,
} from '../dominio/configuracion-negocio';
import { RepositorioConfiguracion } from '../dominio/repositorio-configuracion';
import { TamanosDisponibles } from '../../catalogo/dominio/regla-empaque/repositorio-reglas-empaque';

const ID = 'CONFIG';

/** Persistencia de la configuración en la DB del navegador. */
export class RepositorioConfiguracionIndexedDb implements RepositorioConfiguracion {
  private readonly almacen = new AlmacenIndexedDb<ConfiguracionPrimitivos>('configuracion');

  async obtener(): Promise<ConfiguracionNegocio> {
    const doc = await this.almacen.obtener(ID);
    if (doc) return ConfiguracionNegocio.desdePrimitivos(doc);
    // Primera vez: siembra los defaults de fábrica (como el instalador GAS).
    const defecto = ConfiguracionNegocio.porDefecto();
    await this.almacen.guardar(defecto.aPrimitivos());
    return defecto;
  }

  async guardar(configuracion: ConfiguracionNegocio): Promise<void> {
    await this.almacen.guardar(configuracion.aPrimitivos());
  }
}

/**
 * Adaptador del puerto TamanosDisponibles del CATALOGO: las reglas de
 * empaque validan sus tamaños contra la configuración real.
 */
export class TamanosDesdeConfiguracion implements TamanosDisponibles {
  constructor(private readonly configuracion: RepositorioConfiguracion) {}

  async nombres(): Promise<string[]> {
    return (await this.configuracion.obtener()).tamanos.map(t => t.nombre);
  }
}
