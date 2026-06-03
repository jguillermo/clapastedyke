import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { InsumoPrimitivos, Semaforo, TipoInsumo } from '../../dominio/insumo/insumo';
import { RepositorioInsumos } from '../../dominio/insumo/repositorio-insumos';

export interface PeticionListarInsumos {
  tipo?: TipoInsumo;
}

/**
 * DTO listo para PINTAR: la vista no calcula ni formatea nada — los derivados
 * (precio por unidad, semáforo) y sus formatos los entrega el negocio.
 */
export interface InsumoListado extends InsumoPrimitivos {
  precioPorUnidadBaseSoles: number;
  semaforo: Semaforo;
  /** 'S/ 5.00' — listo para la tabla. */
  precioPresentacionFormato: string;
  /** '0.0050' — 4 decimales, como el num4 del GAS. */
  precioPorUnidadBaseFormato: string;
}

export class ListarInsumos implements CasoDeUso<PeticionListarInsumos, InsumoListado[]> {
  constructor(private readonly insumos: RepositorioInsumos) {}

  async ejecutar(peticion: PeticionListarInsumos = {}): Promise<InsumoListado[]> {
    const lista = peticion.tipo
      ? await this.insumos.porTipo(peticion.tipo)
      : await this.insumos.todos();
    return lista
      .map(i => ({
        ...i.aPrimitivos(),
        precioPorUnidadBaseSoles: i.precioPorUnidadBase.soles,
        semaforo: i.semaforo,
        precioPresentacionFormato: i.presentacion.precio.formato(),
        precioPorUnidadBaseFormato: i.precioPorUnidadBase.formato4(),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
