import { describe, expect, it } from 'vitest';
import { ErrorValidacion } from './errores';
import { IdEntidad } from './id-entidad';
import { GeneradorIdsEnMemoria } from '../infraestructura/memoria/almacen-memoria';

describe('IdEntidad (VO)', () => {
  it('crea ids con el formato del sistema GAS: prefijo + 4 dígitos', () => {
    expect(IdEntidad.crear('CL', 1).valor).toBe('CL-0001');
    expect(IdEntidad.crear('P', 42).valor).toBe('P-0042');
    expect(IdEntidad.crear('CMP', 12345).valor).toBe('CMP-12345');
  });

  it('valida el formato al rehidratar', () => {
    expect(IdEntidad.desde('PD-0007').valor).toBe('PD-0007');
    expect(() => IdEntidad.desde('cliente-1')).toThrow(ErrorValidacion);
    expect(() => IdEntidad.desde('CL-12')).toThrow(ErrorValidacion);
  });

  it('igualdad por valor', () => {
    expect(IdEntidad.desde('CL-0001').esIgualA(IdEntidad.crear('CL', 1))).toBe(true);
  });

  it('el generador en memoria produce secuencias por prefijo', async () => {
    const generador = new GeneradorIdsEnMemoria();
    expect((await generador.siguiente('CL')).valor).toBe('CL-0001');
    expect((await generador.siguiente('CL')).valor).toBe('CL-0002');
    expect((await generador.siguiente('PR')).valor).toBe('PR-0001');
  });
});
