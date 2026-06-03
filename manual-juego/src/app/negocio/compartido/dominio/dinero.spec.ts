import { describe, expect, it } from 'vitest';
import { Dinero } from './dinero';
import { ErrorValidacion } from './errores';

describe('Dinero (VO)', () => {
  it('guarda diezmilésimas enteras y expone soles', () => {
    const d = Dinero.desdeSoles(12.5);
    expect(d.diezmilesimas).toBe(125_000);
    expect(d.soles).toBe(12.5);
    expect(d.centimos).toBe(1250);
  });

  it('es inmutable: las operaciones devuelven instancias nuevas', () => {
    const base = Dinero.desdeSoles(10);
    const suma = base.sumar(Dinero.desdeSoles(2.5));
    expect(base.soles).toBe(10);
    expect(suma.soles).toBe(12.5);
    expect(suma).not.toBe(base);
  });

  it('representa precios por unidad base con 4 decimales exactos (caso GAS)', () => {
    // Harina: S/ 5 la bolsa de 1000 g → 0.005 por gramo; 300 g → S/ 1.50
    const porGramo = Dinero.desdeSoles(5).dividirEntre(1000);
    expect(porGramo.soles).toBe(0.005);
    expect(porGramo.multiplicarPor(300).soles).toBe(1.5);
    // Huevo: S/ 15 ÷ 30 = 0.50; 8 huevos → S/ 4
    expect(Dinero.desdeSoles(15).dividirEntre(30).multiplicarPor(8).soles).toBe(4);
  });

  it('igualdad por valor', () => {
    expect(Dinero.desdeSoles(3).esIgualA(Dinero.desdeSoles(3))).toBe(true);
    expect(Dinero.desdeSoles(3).esIgualA(Dinero.desdeSoles(3.0001))).toBe(false);
  });

  it('rechaza montos inválidos', () => {
    expect(() => Dinero.desdeSoles(NaN)).toThrow(ErrorValidacion);
    expect(() => Dinero.desdeSoles(10).dividirEntre(0)).toThrow(ErrorValidacion);
  });

  it('formatea en soles es-PE (2 y 4 decimales)', () => {
    expect(Dinero.desdeSoles(1234.5).formato()).toBe('S/ 1,234.50');
    expect(Dinero.desdeSoles(5).dividirEntre(1000).formato4()).toBe('0.0050');
  });
});
