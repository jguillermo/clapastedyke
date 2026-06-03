import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { Porcentaje } from '../../../compartido/dominio/porcentaje';
import { Insumo } from '../../../catalogo/dominio/insumo/insumo';
import { Receta } from '../../../catalogo/dominio/receta/receta';
import { ConfiguracionNegocio } from '../../../configuracion/dominio/configuracion-negocio';

/** Modo de escalado de la receta (src/Presupuestos.js · calcularPresupuesto). */
export type ModoEscalado = 'cantidad' | 'personas' | 'tamano' | 'factor';

export interface EmpaqueElegido {
  insumoId: string;
  /** Los empaques NO escalan con el factor: la cantidad es la del formulario. */
  cantidad: number;
}

export interface PeticionCalculo {
  modoEscalado: ModoEscalado;
  /** Cantidad/personas/factor según el modo (en modo 'tamano' se ignora). */
  valorEscalado?: number;
  /** Solo en modo 'tamano'. */
  tamano?: string;
  empaques: EmpaqueElegido[];
  /** Margen de ganancia SOBRE LA VENTA (0–99). */
  margen: number;
  aplicaIgv: boolean;
}

export interface LineaCalculada {
  tipo: 'ingrediente' | 'material';
  insumoId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitarioSoles: number;
  subtotalSoles: number;
}

/** Resultado del cálculo: lo que el presupuesto CONGELA al guardarse. */
export interface CalculoPresupuesto {
  factor: number;
  racionesResultantes: number;
  lineas: LineaCalculada[];
  costoIngredientes: Dinero;
  costoMateriales: Dinero;
  costoManoObra: Dinero;
  costoIndirecto: Dinero;
  costoDepreciacion: Dinero;
  costoTotal: Dinero;
  margen: number;
  precioConMargen: Dinero;
  aplicaIgv: boolean;
  tasaIgv: number;
  montoIgv: Dinero;
  redondeoAplicado: Dinero;
  precioFinal: Dinero;
}

/**
 * Servicio de dominio: la fórmula EXACTA del sistema (src/Presupuestos.js):
 *
 *   factor        = según modo (directo · tamaño→config · valor/racionesBase)
 *   ingredientes  = Σ cantidadBase×factor × precioPorUnidadBase
 *   materiales    = Σ cantidad (SIN escalar) × precioPorUnidadBase
 *   manoObra      = tiempoReceta × factor × tarifaHora
 *   fijos         = indirecto + depreciación (no escalan)
 *   costoTotal    = suma de los cinco
 *   precioMargen  = costoTotal / (1 − margen/100)   ← margen sobre la VENTA
 *   IGV           = precioMargen × tasa/100 (si aplica)
 *   precioFinal   = redondeo MULTIPLO_5 hacia arriba (o ninguno)
 */
export class CalculadoraPresupuesto {
  calcular(
    receta: Receta,
    insumosPorId: ReadonlyMap<string, Insumo>,
    configuracion: ConfiguracionNegocio,
    peticion: PeticionCalculo,
  ): CalculoPresupuesto {
    const { factor, racionesResultantes } = this.resolverFactor(receta, configuracion, peticion);

    // Ingredientes: escalados por el factor
    const lineas: LineaCalculada[] = [];
    let costoIngredientes = Dinero.cero();
    for (const ingrediente of receta.ingredientes) {
      const insumo = this.insumoRequerido(insumosPorId, ingrediente.insumoId);
      const cantidad = ingrediente.cantidadBase * factor;
      const subtotal = insumo.precioPorUnidadBase.multiplicarPor(cantidad);
      costoIngredientes = costoIngredientes.sumar(subtotal);
      lineas.push(this.linea('ingrediente', insumo, cantidad, subtotal));
    }

    // Materiales/empaques: cantidad del formulario, sin escalar
    let costoMateriales = Dinero.cero();
    for (const empaque of peticion.empaques ?? []) {
      if (!(empaque.cantidad > 0)) continue;
      const insumo = this.insumoRequerido(insumosPorId, empaque.insumoId);
      const subtotal = insumo.precioPorUnidadBase.multiplicarPor(empaque.cantidad);
      costoMateriales = costoMateriales.sumar(subtotal);
      lineas.push(this.linea('material', insumo, empaque.cantidad, subtotal));
    }

    const generales = configuracion.generales;
    const costoManoObra = Dinero.desdeSoles(generales.tarifaManoObraHora)
      .multiplicarPor(receta.tiempoManoObraHoras)
      .multiplicarPor(factor);
    const costoIndirecto = Dinero.desdeSoles(generales.costoIndirectoPedido);
    const costoDepreciacion = Dinero.desdeSoles(generales.depreciacionPedido);

    const costoTotal = costoIngredientes
      .sumar(costoMateriales)
      .sumar(costoManoObra)
      .sumar(costoIndirecto)
      .sumar(costoDepreciacion);

    // Margen sobre la venta: precio = costo / (1 − margen)
    const margen = Porcentaje.de(peticion.margen);
    const precioConMargen = costoTotal.dividirEntre(1 - margen.fraccion);

    const tasaIgv = Porcentaje.de(generales.tasaIgv);
    const montoIgv = peticion.aplicaIgv
      ? precioConMargen.multiplicarPor(tasaIgv.fraccion)
      : Dinero.cero();

    const precioAntesRedondeo = precioConMargen.sumar(montoIgv);
    const precioFinal =
      generales.redondeo === 'MULTIPLO_5'
        ? Dinero.desdeSoles(Math.ceil(precioAntesRedondeo.soles / 5) * 5)
        : precioAntesRedondeo;

    return {
      factor,
      racionesResultantes,
      lineas,
      costoIngredientes,
      costoMateriales,
      costoManoObra,
      costoIndirecto,
      costoDepreciacion,
      costoTotal,
      margen: margen.valor,
      precioConMargen,
      aplicaIgv: peticion.aplicaIgv,
      tasaIgv: tasaIgv.valor,
      montoIgv,
      redondeoAplicado: precioFinal.restar(precioAntesRedondeo),
      precioFinal,
    };
  }

  private resolverFactor(
    receta: Receta,
    configuracion: ConfiguracionNegocio,
    peticion: PeticionCalculo,
  ): { factor: number; racionesResultantes: number } {
    const racionesBase = receta.racionesBase;

    switch (peticion.modoEscalado) {
      case 'factor': {
        const factor = this.valorPositivo(peticion.valorEscalado, 'el factor');
        return { factor, racionesResultantes: racionesBase * factor };
      }
      case 'tamano': {
        if (!peticion.tamano?.trim()) throw new ErrorValidacion('Elige un tamaño.');
        const factor = configuracion.factorDeTamano(peticion.tamano);
        return { factor, racionesResultantes: racionesBase * factor };
      }
      case 'cantidad':
      case 'personas': {
        const valor = this.valorPositivo(peticion.valorEscalado, 'la cantidad');
        return { factor: valor / racionesBase, racionesResultantes: valor };
      }
      default:
        throw new ErrorValidacion(`Modo de escalado desconocido: ${peticion.modoEscalado}.`);
    }
  }

  private valorPositivo(valor: number | undefined, etiqueta: string): number {
    if (!Number.isFinite(valor) || (valor as number) <= 0) {
      throw new ErrorValidacion(`Indica ${etiqueta} (mayor que 0).`);
    }
    return valor as number;
  }

  private insumoRequerido(insumos: ReadonlyMap<string, Insumo>, id: string): Insumo {
    const insumo = insumos.get(id);
    if (!insumo) throw new ErrorValidacion(`Falta el insumo ${id} para calcular.`);
    return insumo;
  }

  private linea(
    tipo: 'ingrediente' | 'material',
    insumo: Insumo,
    cantidad: number,
    subtotal: Dinero,
  ): LineaCalculada {
    return {
      tipo,
      insumoId: insumo.id.valor,
      nombre: insumo.nombre,
      cantidad,
      unidad: insumo.unidadBase,
      precioUnitarioSoles: insumo.precioPorUnidadBase.soles,
      subtotalSoles: subtotal.soles,
    };
  }
}
