import { describe, expect, it } from 'vitest';
import { Dinero } from '../../../compartido/dominio/dinero';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Insumo } from './insumo';

function harina(stockInicial = 0, stockMinimo = 2000): Insumo {
  return Insumo.crear(IdEntidad.crear('IN', 1), {
    nombre: 'Harina',
    tipo: 'ingrediente',
    unidadBase: 'g',
    tamanoPresentacion: 1000,
    precioPresentacion: Dinero.desdeSoles(5),
    stockInicial,
    stockMinimo,
  });
}

describe('Insumo (agregado)', () => {
  it('deriva el precio por unidad base (S/5 ÷ 1000 g = 0.005)', () => {
    expect(harina().precioPorUnidadBase.soles).toBe(0.005);
  });

  it('semáforo: rojo ≤ 0, amarillo ≤ mínimo, verde el resto', () => {
    expect(harina(0).semaforo).toBe('rojo');
    expect(harina(1500, 2000).semaforo).toBe('amarillo');
    expect(harina(5000, 2000).semaforo).toBe('verde');
  });

  it('consumir puede dejar stock negativo (aprobar con faltantes avisa, no bloquea)', () => {
    const insumo = harina(100);
    insumo.consumirStock(600);
    expect(insumo.stockActual).toBe(-500);
    expect(insumo.semaforo).toBe('rojo');
  });

  it('la compra sube stock y reemplaza el precio de presentación', () => {
    const insumo = harina(0);
    insumo.recibirStock(5000); // 5 bolsas de 1000 g
    insumo.actualizarPrecioPresentacion(Dinero.desdeSoles(5.5));
    expect(insumo.stockActual).toBe(5000);
    expect(insumo.precioPorUnidadBase.soles).toBe(0.0055);
    expect(insumo.semaforo).toBe('verde');
  });

  it('emite InsumoCreado con el stock inicial (INVENTARIO registrará el movimiento)', () => {
    const eventos = harina(50).extraerEventos();
    expect(eventos[0].nombre).toBe('InsumoCreado');
    expect(eventos[0].datos['stockInicial']).toBe(50);
  });
});
