import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { UnidadBase } from '../../../compartido/dominio/cantidad';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorDuplicado, ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Insumo, TipoInsumo } from '../../dominio/insumo/insumo';
import { RepositorioInsumos } from '../../dominio/insumo/repositorio-insumos';

export interface PeticionGuardarInsumo {
  id?: string;
  nombre: string;
  tipo: TipoInsumo;
  unidadBase: UnidadBase;
  tamanoPresentacion: number;
  precioPresentacionSoles: number;
  /** Solo en alta; el stock vivo se mueve desde INVENTARIO. */
  stockInicial?: number;
  stockMinimo?: number;
  proveedorRecomendadoId?: string | null;
}

/**
 * Alta o edición de insumo (src/Insumos.js). En la edición el stock NO se
 * toca (sube con compras y se ajusta con inventario); tipo y unidad base
 * tampoco cambian (definen la naturaleza del insumo).
 */
export class GuardarInsumo implements CasoDeUso<PeticionGuardarInsumo, { id: string }> {
  constructor(
    private readonly insumos: RepositorioInsumos,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarInsumo): Promise<{ id: string }> {
    const existente = await this.insumos.porNombre(peticion.nombre);
    const proveedorId = peticion.proveedorRecomendadoId
      ? IdEntidad.desde(peticion.proveedorRecomendadoId)
      : null;

    if (peticion.id) {
      const id = IdEntidad.desde(peticion.id);
      const insumo = await this.insumos.porId(id);
      if (!insumo) throw new ErrorNoEncontrado('Insumo', peticion.id);
      if (existente && !existente.id.esIgualA(id)) {
        throw new ErrorDuplicado('Ya existe un insumo con ese nombre.');
      }
      insumo.editar({
        nombre: peticion.nombre,
        tamanoPresentacion: peticion.tamanoPresentacion,
        precioPresentacion: Dinero.desdeSoles(peticion.precioPresentacionSoles),
        stockMinimo: peticion.stockMinimo ?? insumo.stockMinimo,
        proveedorRecomendadoId: proveedorId,
      });
      await this.insumos.guardar(insumo);
      await this.bus.publicar(insumo.extraerEventos());
      return { id: insumo.id.valor };
    }

    if (existente) throw new ErrorDuplicado('Ya existe un insumo con ese nombre.');
    const insumo = Insumo.crear(await this.insumos.siguienteId(), {
      nombre: peticion.nombre,
      tipo: peticion.tipo,
      unidadBase: peticion.unidadBase,
      tamanoPresentacion: peticion.tamanoPresentacion,
      precioPresentacion: Dinero.desdeSoles(peticion.precioPresentacionSoles),
      stockInicial: peticion.stockInicial,
      stockMinimo: peticion.stockMinimo,
      proveedorRecomendadoId: proveedorId,
    });
    await this.insumos.guardar(insumo);
    await this.bus.publicar(insumo.extraerEventos());
    return { id: insumo.id.valor };
  }
}
