import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Insumo } from '../../../catalogo/dominio/insumo/insumo';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { Receta } from '../../../catalogo/dominio/receta/receta';
import { RepositorioRecetas } from '../../../catalogo/dominio/receta/repositorio-recetas';
import { RepositorioConfiguracion } from '../../../configuracion/dominio/repositorio-configuracion';
import {
  CalculadoraPresupuesto,
  CalculoPresupuesto,
  LineaCalculada,
  PeticionCalculo,
} from '../../dominio/presupuesto/calculadora-presupuesto';

export interface PeticionCalcularPresupuesto extends PeticionCalculo {
  recetaId: string;
}

/** Línea del cálculo lista para PINTAR (la vista no formatea nada). */
export interface LineaPlana extends LineaCalculada {
  precioUnitarioFormato: string; // '0.0050'
  subtotalFormato: string; // 'S/ 1.50'
}

/** DTO plano del cálculo para la UI (vista previa en vivo del cotizador). */
export interface CalculoPlano {
  factor: number;
  racionesResultantes: number;
  lineas: LineaPlana[];
  costoIngredientesSoles: number;
  costoMaterialesSoles: number;
  costoManoObraSoles: number;
  costoIndirectoSoles: number;
  costoDepreciacionSoles: number;
  costoTotalSoles: number;
  margen: number;
  precioConMargenSoles: number;
  aplicaIgv: boolean;
  tasaIgv: number;
  montoIgvSoles: number;
  redondeoAplicadoSoles: number;
  precioFinalSoles: number;
  // Formatos listos para pintar
  costoIngredientesFormato: string;
  costoMaterialesFormato: string;
  costoManoObraFormato: string;
  costoIndirectoFormato: string;
  costoDepreciacionFormato: string;
  costoTotalFormato: string;
  precioConMargenFormato: string;
  montoIgvFormato: string;
  redondeoAplicadoFormato: string;
  precioFinalFormato: string;
}

export function aCalculoPlano(c: CalculoPresupuesto): CalculoPlano {
  return {
    factor: c.factor,
    racionesResultantes: c.racionesResultantes,
    lineas: c.lineas.map(l => ({
      ...l,
      precioUnitarioFormato: Dinero.desdeSoles(l.precioUnitarioSoles).formato4(),
      subtotalFormato: Dinero.desdeSoles(l.subtotalSoles).formato(),
    })),
    costoIngredientesSoles: c.costoIngredientes.soles,
    costoMaterialesSoles: c.costoMateriales.soles,
    costoManoObraSoles: c.costoManoObra.soles,
    costoIndirectoSoles: c.costoIndirecto.soles,
    costoDepreciacionSoles: c.costoDepreciacion.soles,
    costoTotalSoles: c.costoTotal.soles,
    margen: c.margen,
    precioConMargenSoles: c.precioConMargen.soles,
    aplicaIgv: c.aplicaIgv,
    tasaIgv: c.tasaIgv,
    montoIgvSoles: c.montoIgv.soles,
    redondeoAplicadoSoles: c.redondeoAplicado.soles,
    precioFinalSoles: c.precioFinal.soles,
    costoIngredientesFormato: c.costoIngredientes.formato(),
    costoMaterialesFormato: c.costoMateriales.formato(),
    costoManoObraFormato: c.costoManoObra.formato(),
    costoIndirectoFormato: c.costoIndirecto.formato(),
    costoDepreciacionFormato: c.costoDepreciacion.formato(),
    costoTotalFormato: c.costoTotal.formato(),
    precioConMargenFormato: c.precioConMargen.formato(),
    montoIgvFormato: c.montoIgv.formato(),
    redondeoAplicadoFormato: c.redondeoAplicado.formato(),
    precioFinalFormato: c.precioFinal.formato(),
  };
}

/** Ayudante compartido: carga receta + insumos + configuración y calcula. */
export async function calcularConCatalogo(
  recetas: RepositorioRecetas,
  insumos: RepositorioInsumos,
  configuracion: RepositorioConfiguracion,
  peticion: PeticionCalcularPresupuesto,
): Promise<{ receta: Receta; calculo: CalculoPresupuesto }> {
  const receta = await recetas.porId(IdEntidad.desde(peticion.recetaId));
  if (!receta) throw new ErrorNoEncontrado('Receta', peticion.recetaId);

  const mapa = new Map<string, Insumo>();
  const ids = [
    ...receta.ingredientes.map(i => i.insumoId),
    ...(peticion.empaques ?? []).map(e => e.insumoId),
  ];
  for (const id of ids) {
    if (mapa.has(id)) continue;
    const insumo = await insumos.porId(IdEntidad.desde(id));
    if (!insumo) throw new ErrorNoEncontrado('Insumo', id);
    mapa.set(id, insumo);
  }

  const config = await configuracion.obtener();
  const calculo = new CalculadoraPresupuesto().calcular(receta, mapa, config, peticion);
  return { receta, calculo };
}

/** Vista previa del cálculo (no persiste nada): el «recalc» del formulario. */
export class CalcularPresupuesto implements CasoDeUso<PeticionCalcularPresupuesto, CalculoPlano> {
  constructor(
    private readonly recetas: RepositorioRecetas,
    private readonly insumos: RepositorioInsumos,
    private readonly configuracion: RepositorioConfiguracion,
  ) {}

  async ejecutar(peticion: PeticionCalcularPresupuesto): Promise<CalculoPlano> {
    const { calculo } = await calcularConCatalogo(this.recetas, this.insumos, this.configuracion, peticion);
    return aCalculoPlano(calculo);
  }
}
