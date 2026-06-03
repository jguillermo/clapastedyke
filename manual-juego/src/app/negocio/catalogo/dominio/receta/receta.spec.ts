import { describe, expect, it } from 'vitest';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Receta } from './receta';

const id = IdEntidad.crear('RC', 1);

describe('Receta (agregado)', () => {
  it('exige al menos un ingrediente con cantidad > 0 (invariante del GAS)', () => {
    expect(() =>
      Receta.crear(id, {
        nombre: 'Torta chocolate',
        tipoBase: 'personas',
        racionesBase: 10,
        ingredientes: [],
      }),
    ).toThrow(ErrorValidacion);

    expect(() =>
      Receta.crear(id, {
        nombre: 'Torta chocolate',
        tipoBase: 'personas',
        racionesBase: 10,
        ingredientes: [{ insumoId: 'IN-0001', cantidadBase: 0 }],
      }),
    ).toThrow(ErrorValidacion);
  });

  it('filtra las líneas inertes y conserva las activas', () => {
    const receta = Receta.crear(id, {
      nombre: 'Torta chocolate',
      categoria: 'tortas',
      tipoBase: 'personas',
      racionesBase: 10,
      tiempoManoObraHoras: 2,
      ingredientes: [
        { insumoId: 'IN-0001', cantidadBase: 300 },
        { insumoId: '', cantidadBase: 5 },
        { insumoId: 'IN-0002', cantidadBase: 4 },
      ],
    });
    expect(receta.ingredientes).toHaveLength(2);
    expect(receta.extraerEventos().map(e => e.nombre)).toEqual(['RecetaCreada']);
  });

  it('rechaza base inválida y tiempo negativo', () => {
    const base = {
      nombre: 'X',
      tipoBase: 'personas' as const,
      ingredientes: [{ insumoId: 'IN-0001', cantidadBase: 1 }],
    };
    expect(() => Receta.crear(id, { ...base, racionesBase: 0 })).toThrow(ErrorValidacion);
    expect(() =>
      Receta.crear(id, { ...base, racionesBase: 10, tiempoManoObraHoras: -1 }),
    ).toThrow(ErrorValidacion);
  });

  it('viaja a primitivos y vuelve sin perder nada', () => {
    const receta = Receta.crear(id, {
      nombre: 'Torta chocolate',
      tipoBase: 'tamano',
      racionesBase: 8,
      tiempoManoObraHoras: 1.5,
      ingredientes: [{ insumoId: 'IN-0001', cantidadBase: 300 }],
    });
    const clon = Receta.desdePrimitivos(receta.aPrimitivos());
    expect(clon.nombre).toBe('Torta chocolate');
    expect(clon.racionesBase).toBe(8);
    expect(clon.ingredientes).toEqual(receta.ingredientes as never);
  });
});
