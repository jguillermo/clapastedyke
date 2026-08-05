import { isAlive, stamped, tombstoned } from '../../infrastructure/synced-record';

/**
 * Los dos metadatos que llevan todos los documentos del recetario. Son cuatro líneas de código y aun
 * así llevan dos decisiones que, mal puestas, pierden datos: que guardar **resucite** lo borrado, y que
 * la lápida **conserve** el contenido.
 */
describe('isAlive', () => {
  it('un documento sin lápida está vivo, que es el caso normal', () => {
    expect(isAlive({})).toBe(true);
    expect(isAlive({ updatedAt: '2026-08-04T00:00:00.000Z' })).toBe(true);
  });

  it('un documento con lápida está borrado', () => {
    expect(isAlive({ deletedAt: '2026-08-04T00:00:00.000Z' })).toBe(false);
  });
});

describe('stamped', () => {
  const ahora = '2026-08-04T10:00:00.000Z';

  it('pone la hora de guardado y no toca lo demás', () => {
    const original = { id: 'ing-1', name: 'Harina' };

    expect(stamped(original, ahora)).toEqual({ id: 'ing-1', name: 'Harina', updatedAt: ahora });
  });

  it('sobrescribe la hora anterior', () => {
    const original = { id: 'ing-1', updatedAt: '2020-01-01T00:00:00.000Z' };

    expect(stamped(original, ahora).updatedAt).toBe(ahora);
  });

  it('guardar RESUCITA lo que estaba borrado', () => {
    // Un id que se vuelve a usar es el mismo dato otra vez, no un fantasma que haya que arrastrar. Si
    // la lápida sobreviviera al guardado, el insumo se guardaría y seguiría sin poder leerse.
    const borrado = { id: 'ing-1', deletedAt: '2026-01-01T00:00:00.000Z' };
    const record = stamped(borrado, ahora);

    expect(isAlive(record)).toBe(true);
    expect(record).not.toHaveProperty('deletedAt');
  });
});

describe('tombstoned', () => {
  const ahora = '2026-08-04T10:00:00.000Z';

  it('marca el borrado y CONSERVA el contenido', () => {
    // La lápida viaja al destino y el usuario la ve: una fila marcada como borrada de la que además
    // hubieran desaparecido el nombre y el precio no le diría qué fue lo que se borró.
    const original = { id: 'ing-1', name: 'Harina', priceAmount: 2.5 };
    const record = tombstoned(original, ahora);

    expect(record).toEqual({
      id: 'ing-1',
      name: 'Harina',
      priceAmount: 2.5,
      updatedAt: ahora,
      deletedAt: ahora,
    });
    expect(isAlive(record)).toBe(false);
  });

  it('borrar también cuenta como un cambio', () => {
    // Si `updatedAt` no se moviera, la sincronización no podría saber que el borrado es más reciente
    // que la última edición y perdería el conflicto contra ella.
    const original = { id: 'ing-1', updatedAt: '2020-01-01T00:00:00.000Z' };

    expect(tombstoned(original, ahora).updatedAt).toBe(ahora);
  });
});
