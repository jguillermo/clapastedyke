import { beforeEach, describe, expect, it } from 'vitest';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Insumo } from '../../../catalogo/dominio/insumo/insumo';
import { Receta } from '../../../catalogo/dominio/receta/receta';
import { ConfiguracionNegocio } from '../../../configuracion/dominio/configuracion-negocio';
import { CalculadoraPresupuesto } from './calculadora-presupuesto';

/**
 * El escenario del manual de usuario, de punta a punta:
 * Harina S/5×1000g, Huevo S/15×30u, Caja S/25×25u; Torta chocolate base 10
 * personas con 300 g de harina, 4 huevos y 2 h de mano de obra.
 * Config de fábrica salvo lo indicado.
 */
describe('CalculadoraPresupuesto (servicio de dominio)', () => {
  let receta: Receta;
  let insumos: Map<string, Insumo>;
  let config: ConfiguracionNegocio;
  const calculadora = new CalculadoraPresupuesto();

  beforeEach(() => {
    const harina = Insumo.crear(IdEntidad.crear('IN', 1), {
      nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g',
      tamanoPresentacion: 1000, precioPresentacion: Dinero.desdeSoles(5),
    });
    const huevo = Insumo.crear(IdEntidad.crear('IN', 2), {
      nombre: 'Huevo', tipo: 'ingrediente', unidadBase: 'u',
      tamanoPresentacion: 30, precioPresentacion: Dinero.desdeSoles(15),
    });
    const caja = Insumo.crear(IdEntidad.crear('IN', 3), {
      nombre: 'Caja torta', tipo: 'empaque', unidadBase: 'u',
      tamanoPresentacion: 25, precioPresentacion: Dinero.desdeSoles(25),
    });
    insumos = new Map([
      [harina.id.valor, harina],
      [huevo.id.valor, huevo],
      [caja.id.valor, caja],
    ]);
    receta = Receta.crear(IdEntidad.crear('RC', 1), {
      nombre: 'Torta chocolate', tipoBase: 'personas', racionesBase: 10,
      tiempoManoObraHoras: 2,
      ingredientes: [
        { insumoId: 'IN-0001', cantidadBase: 300 },
        { insumoId: 'IN-0002', cantidadBase: 4 },
      ],
    });
    config = ConfiguracionNegocio.porDefecto();
  });

  it('reproduce el ejemplo del manual: 20 personas, caja, margen 30, IGV, múltiplo de 5', () => {
    const calc = calculadora.calcular(receta, insumos, config, {
      modoEscalado: 'personas', valorEscalado: 20,
      empaques: [{ insumoId: 'IN-0003', cantidad: 1 }],
      margen: 30, aplicaIgv: true,
    });

    expect(calc.factor).toBe(2);
    expect(calc.racionesResultantes).toBe(20);
    // Ingredientes: 600 g × 0.005 + 8 u × 0.5 = 3 + 4 = 7
    expect(calc.costoIngredientes.soles).toBe(7);
    // Caja: 1 × (25/25) = 1 — SIN escalar por el factor
    expect(calc.costoMateriales.soles).toBe(1);
    // Mano de obra: 2 h × factor 2 × tarifa 12 = 48 · fijos: 5 + 3
    expect(calc.costoManoObra.soles).toBe(48);
    expect(calc.costoTotal.soles).toBe(64);
    // Margen SOBRE LA VENTA: 64 / 0.70 = 91.4286
    expect(calc.precioConMargen.soles).toBeCloseTo(91.4286, 4);
    // IGV 18%: 16.4571 → precio bruto 107.8857 → múltiplo de 5: 110
    expect(calc.montoIgv.soles).toBeCloseTo(16.4571, 3);
    expect(calc.precioFinal.soles).toBe(110);
    expect(calc.redondeoAplicado.soles).toBeCloseTo(2.1143, 3);
    // Detalle congelado: 2 ingredientes + 1 material
    expect(calc.lineas.map(l => l.tipo)).toEqual(['ingrediente', 'ingrediente', 'material']);
  });

  it('los cuatro modos de escalado producen el mismo factor cuando equivalen', () => {
    const porPersonas = calculadora.calcular(receta, insumos, config, {
      modoEscalado: 'personas', valorEscalado: 20, empaques: [], margen: 30, aplicaIgv: false,
    });
    const porFactor = calculadora.calcular(receta, insumos, config, {
      modoEscalado: 'factor', valorEscalado: 2, empaques: [], margen: 30, aplicaIgv: false,
    });
    const porTamano = calculadora.calcular(receta, insumos, config, {
      modoEscalado: 'tamano', tamano: 'grande', empaques: [], margen: 30, aplicaIgv: false,
    });
    expect(porFactor.factor).toBe(2);
    expect(porTamano.factor).toBe(2); // grande → 2 en config
    expect(porPersonas.costoTotal.esIgualA(porFactor.costoTotal)).toBe(true);
    expect(porPersonas.costoTotal.esIgualA(porTamano.costoTotal)).toBe(true);
  });

  it('sin IGV no suma impuesto; sin redondeo deja el precio exacto', () => {
    config.actualizarGenerales({ redondeo: 'NINGUNO' });
    const calc = calculadora.calcular(receta, insumos, config, {
      modoEscalado: 'personas', valorEscalado: 20, empaques: [], margen: 30, aplicaIgv: false,
    });
    expect(calc.montoIgv.soles).toBe(0);
    // 63 / 0.7 = 90 exacto (sin caja: costo 63)
    expect(calc.precioFinal.soles).toBe(90);
    expect(calc.redondeoAplicado.soles).toBe(0);
  });

  it('valida escalado: valor > 0, tamaño definido', () => {
    const base = { empaques: [], margen: 30, aplicaIgv: false };
    expect(() =>
      calculadora.calcular(receta, insumos, config, { ...base, modoEscalado: 'personas', valorEscalado: 0 }),
    ).toThrow(ErrorValidacion);
    expect(() =>
      calculadora.calcular(receta, insumos, config, { ...base, modoEscalado: 'tamano', tamano: 'gigante' }),
    ).toThrow(ErrorValidacion);
  });
});
