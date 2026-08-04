import { SyncProbe } from '../../../domain/value-objects/sync-probe';

describe('SyncProbe', () => {
  it('reconoce como buena la vuelta exacta de lo que se mandó', () => {
    const probe = SyncProbe.of('a1b2-c3');

    expect(probe.matches('a1b2-c3')).toBe(true);
  });

  it('tolera el recorte del destino, porque una hoja normaliza lo que guarda', () => {
    expect(SyncProbe.of('a1b2-c3').matches('  a1b2-c3 \n')).toBe(true);
  });

  it('no da por buena una vuelta vacía: es el caso que hay que detectar', () => {
    const probe = SyncProbe.of('a1b2-c3');

    expect(probe.matches('')).toBe(false);
    expect(probe.matches('   ')).toBe(false);
  });

  it('no da por buena la prueba de otra comprobación', () => {
    expect(SyncProbe.of('a1b2-c3').matches('z9y8-x7')).toBe(false);
  });

  it('rechaza nacer sin valor: no demostraría nada', () => {
    expect(() => SyncProbe.of('   ')).toThrow();
  });
});
