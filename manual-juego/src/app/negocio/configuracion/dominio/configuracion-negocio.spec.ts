import { describe, expect, it } from 'vitest';
import { ErrorValidacion } from '../../compartido/dominio/errores';
import { ConfiguracionNegocio, PARAMETROS_DEFECTO } from './configuracion-negocio';

describe('ConfiguracionNegocio (agregado singleton)', () => {
  it('nace con los defaults exactos del instalador GAS', () => {
    const config = ConfiguracionNegocio.porDefecto();
    expect(config.generales).toEqual(PARAMETROS_DEFECTO);
    expect(config.generales.margenDefecto).toBe(35);
    expect(config.generales.redondeo).toBe('MULTIPLO_5');
    expect(config.generales.momentoDescuentoStock).toBe('APROBAR');
    expect(config.factorDeTamano('grande')).toBe(2);
    expect(config.tiposAjuste.map(t => t.nombre)).toContain('merma');
  });

  it('factorDeTamano es case-insensitive y rechaza tamaños no definidos', () => {
    const config = ConfiguracionNegocio.porDefecto();
    expect(config.factorDeTamano('  Chico ')).toBe(0.5);
    expect(() => config.factorDeTamano('gigante')).toThrow(ErrorValidacion);
  });

  it('cantidadFirmadaDeAjuste replica signoAjuste del GAS', () => {
    const config = ConfiguracionNegocio.porDefecto();
    expect(config.cantidadFirmadaDeAjuste('merma', 5)).toBe(-5);
    expect(config.cantidadFirmadaDeAjuste('merma', -5)).toBe(-5); // siempre resta
    expect(config.cantidadFirmadaDeAjuste('devolución', 2)).toBe(2);
    expect(config.cantidadFirmadaDeAjuste('conteo', -8)).toBe(-8); // respeta el signo
    expect(config.cantidadFirmadaDeAjuste('conteo', 8)).toBe(8);
    expect(() => config.cantidadFirmadaDeAjuste('merma', 0)).toThrow(ErrorValidacion);
    expect(() => config.cantidadFirmadaDeAjuste('robo', 1)).toThrow(ErrorValidacion);
  });

  it('valida los generales al actualizar (margen [0,100), días ≥ 1…)', () => {
    const config = ConfiguracionNegocio.porDefecto();
    config.actualizarGenerales({ margenDefecto: 40, nombreNegocio: 'Dulces Misa' });
    expect(config.generales.margenDefecto).toBe(40);
    expect(config.extraerEventos().map(e => e.nombre)).toEqual(['ConfiguracionActualizada']);

    expect(() => config.actualizarGenerales({ margenDefecto: 100 })).toThrow(ErrorValidacion);
    expect(() => config.actualizarGenerales({ diasVencimiento: 0 })).toThrow(ErrorValidacion);
    expect(() => config.actualizarGenerales({ tarifaManoObraHora: -1 })).toThrow(ErrorValidacion);
  });

  it('reemplazarTamanos normaliza nombres y exige factor > 0', () => {
    const config = ConfiguracionNegocio.porDefecto();
    config.reemplazarTamanos([{ nombre: ' Familiar ', factor: 3 }]);
    expect(config.factorDeTamano('familiar')).toBe(3);
    expect(() => config.reemplazarTamanos([])).toThrow(ErrorValidacion);
    expect(() => config.reemplazarTamanos([{ nombre: 'x', factor: 0 }])).toThrow(ErrorValidacion);
  });
});
