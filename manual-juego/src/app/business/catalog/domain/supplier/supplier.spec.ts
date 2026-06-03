import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../shared/domain/errors';
import { Whatsapp } from './supplier';

describe('Whatsapp (VO)', () => {
  it('normalizes to digits only (rule from src/Proveedores.js)', () => {
    expect(Whatsapp.of('+51 999-111-222').number).toBe('51999111222');
    expect(Whatsapp.of('51999111222').chatLink).toBe('https://wa.me/51999111222');
  });

  it('requires at least 8 digits', () => {
    expect(() => Whatsapp.of('123')).toThrow(ValidationError);
    expect(() => Whatsapp.of('')).toThrow(ValidationError);
  });
});
