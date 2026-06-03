import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorDuplicado, ErrorNoEncontrado, ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioInsumos } from '../../dominio/insumo/repositorio-insumos';
import { IngredienteReceta, Receta, TipoBase } from '../../dominio/receta/receta';
import { RepositorioRecetas } from '../../dominio/receta/repositorio-recetas';

export interface PeticionGuardarReceta {
  id?: string;
  nombre: string;
  categoria?: string;
  tipoBase: TipoBase;
  racionesBase: number;
  tiempoManoObraHoras?: number;
  ingredientes: IngredienteReceta[];
}

/**
 * Alta o edición de receta (src/Recetas.js): nombre único, ≥1 ingrediente
 * (invariante del agregado) y todos los insumos referenciados deben existir
 * y ser de tipo 'ingrediente'.
 */
export class GuardarReceta implements CasoDeUso<PeticionGuardarReceta, { id: string }> {
  constructor(
    private readonly recetas: RepositorioRecetas,
    private readonly insumos: RepositorioInsumos,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarReceta): Promise<{ id: string }> {
    await this.exigirInsumosValidos(peticion.ingredientes);
    const existente = await this.recetas.porNombre(peticion.nombre);

    if (peticion.id) {
      const id = IdEntidad.desde(peticion.id);
      const receta = await this.recetas.porId(id);
      if (!receta) throw new ErrorNoEncontrado('Receta', peticion.id);
      if (existente && !existente.id.esIgualA(id)) {
        throw new ErrorDuplicado('Ya existe una receta con ese nombre.');
      }
      receta.editar(peticion);
      await this.recetas.guardar(receta);
      await this.bus.publicar(receta.extraerEventos());
      return { id: receta.id.valor };
    }

    if (existente) throw new ErrorDuplicado('Ya existe una receta con ese nombre.');
    const receta = Receta.crear(await this.recetas.siguienteId(), peticion);
    await this.recetas.guardar(receta);
    await this.bus.publicar(receta.extraerEventos());
    return { id: receta.id.valor };
  }

  private async exigirInsumosValidos(ingredientes: IngredienteReceta[]): Promise<void> {
    for (const linea of ingredientes ?? []) {
      if (!linea.insumoId || linea.cantidadBase <= 0) continue; // las inertes las filtra el AR
      const insumo = await this.insumos.porId(IdEntidad.desde(linea.insumoId));
      if (!insumo) throw new ErrorNoEncontrado('Insumo', linea.insumoId);
      if (insumo.tipo !== 'ingrediente') {
        throw new ErrorValidacion(`«${insumo.nombre}» es empaque: no puede ir como ingrediente.`);
      }
    }
  }
}
