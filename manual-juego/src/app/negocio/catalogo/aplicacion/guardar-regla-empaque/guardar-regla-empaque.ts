import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorDuplicado, ErrorNoEncontrado, ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioInsumos } from '../../dominio/insumo/repositorio-insumos';
import { RepositorioRecetas } from '../../dominio/receta/repositorio-recetas';
import { ReglaEmpaque } from '../../dominio/regla-empaque/regla-empaque';
import {
  RepositorioReglasEmpaque,
  TamanosDisponibles,
} from '../../dominio/regla-empaque/repositorio-reglas-empaque';

export interface PeticionGuardarReglaEmpaque {
  id?: string;
  recetaId: string;
  tamano: string;
  insumoEmpaqueId: string;
  cantidad: number;
}

/**
 * Alta o edición de regla de empaque (src/ReglasEmpaque.js): la receta y el
 * empaque deben existir (y ser tipo 'empaque'), el tamaño debe estar definido
 * en configuración, y la terna (receta, tamaño, empaque) es única.
 */
export class GuardarReglaEmpaque
  implements CasoDeUso<PeticionGuardarReglaEmpaque, { id: string }>
{
  constructor(
    private readonly reglas: RepositorioReglasEmpaque,
    private readonly recetas: RepositorioRecetas,
    private readonly insumos: RepositorioInsumos,
    private readonly tamanos: TamanosDisponibles,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarReglaEmpaque): Promise<{ id: string }> {
    const recetaId = IdEntidad.desde(peticion.recetaId);
    const empaqueId = IdEntidad.desde(peticion.insumoEmpaqueId);
    const tamano = (peticion.tamano ?? '').trim().toLowerCase();

    if (!(await this.recetas.porId(recetaId))) {
      throw new ErrorNoEncontrado('Receta', peticion.recetaId);
    }
    const empaque = await this.insumos.porId(empaqueId);
    if (!empaque) throw new ErrorNoEncontrado('Insumo', peticion.insumoEmpaqueId);
    if (empaque.tipo !== 'empaque') {
      throw new ErrorValidacion(`«${empaque.nombre}» no es un empaque.`);
    }
    const nombres = await this.tamanos.nombres();
    if (!nombres.map(n => n.toLowerCase()).includes(tamano)) {
      throw new ErrorValidacion(`El tamaño «${peticion.tamano}» no está definido en configuración.`);
    }

    if (peticion.id) {
      const id = IdEntidad.desde(peticion.id);
      const regla = await this.reglas.porId(id);
      if (!regla) throw new ErrorNoEncontrado('Regla de empaque', peticion.id);
      regla.editar({ insumoEmpaqueId: empaqueId, cantidad: peticion.cantidad });
      await this.reglas.guardar(regla);
      await this.bus.publicar(regla.extraerEventos());
      return { id: regla.id.valor };
    }

    // Unicidad de la terna (solo en altas, como el GAS)
    const hermanas = await this.reglas.deRecetaYTamano(recetaId, tamano);
    if (hermanas.some(r => r.insumoEmpaqueId.esIgualA(empaqueId))) {
      throw new ErrorDuplicado('Ya existe esa combinación de receta, tamaño y empaque.');
    }

    const regla = ReglaEmpaque.crear(await this.reglas.siguienteId(), {
      recetaId,
      tamano,
      insumoEmpaqueId: empaqueId,
      cantidad: peticion.cantidad,
    });
    await this.reglas.guardar(regla);
    await this.bus.publicar(regla.extraerEventos());
    return { id: regla.id.valor };
  }
}
