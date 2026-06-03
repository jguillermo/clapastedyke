import { describe, expect, it } from 'vitest';
import { Cantidad } from './cantidad';
import { ErrorValidacion } from './errores';
import { Porcentaje } from './porcentaje';

describe('Cantidad (VO)', () => {
  it('escala por factor (la base del presupuesto)', () => {
    const harina = Cantidad.de(300, 'g');
    expect(harina.escalarPor(2).valor).toBe(600);
    expect(harina.escalarPor(2).unidad).toBe('g');
  });

  it('no mezcla unidades', () => {
    expect(() => Cantidad.de(1, 'g').sumar(Cantidad.de(1, 'u'))).toThrow(ErrorValidacion);
  });

  it('rechaza negativos salvo construcción con signo (movimientos)', () => {
    expect(() => Cantidad.de(-5, 'g')).toThrow(ErrorValidacion);
    expect(Cantidad.conSigno(-5, 'g').valor).toBe(-5);
  });
});

describe('Porcentaje (VO)', () => {
  it('acepta [0,100) y expone la fracción', () => {
    expect(Porcentaje.de(35).fraccion).toBe(0.35);
    expect(Porcentaje.de(0).fraccion).toBe(0);
  });

  it('rechaza 100 (protege la fórmula de margen sobre venta) y fuera de rango', () => {
    expect(() => Porcentaje.de(100)).toThrow(ErrorValidacion);
    expect(() => Porcentaje.de(-1)).toThrow(ErrorValidacion);
  });
});
