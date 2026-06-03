import { describe, expect, it } from 'vitest';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { Whatsapp } from './proveedor';

describe('Whatsapp (VO)', () => {
  it('normaliza a solo dígitos (regla de src/Proveedores.js)', () => {
    expect(Whatsapp.desde('+51 999-111-222').numero).toBe('51999111222');
    expect(Whatsapp.desde('51999111222').enlaceChat).toBe('https://wa.me/51999111222');
  });

  it('exige al menos 8 dígitos', () => {
    expect(() => Whatsapp.desde('123')).toThrow(ErrorValidacion);
    expect(() => Whatsapp.desde('')).toThrow(ErrorValidacion);
  });
});
