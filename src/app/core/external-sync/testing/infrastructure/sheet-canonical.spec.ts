import {
  canonicalCode,
  canonicalText,
  isTombstone,
  isUnrecognisedTombstone,
} from '../../infrastructure/sheet-canonical';
/**
 * Lo que queda de la canonización después de pasar a guardar el registro como JSON: la forma canónica
 * del **texto** —porque las celdas de servicio lo son— y la lectura de la lápida.
 *
 * La canonización de números y banderas se fue con las columnas por campo: el tipo viaja ahora dentro
 * del JSON, y su determinismo lo cubre `record-json.spec.ts`.
 */
describe('canonicalText', () => {
  it('recorta, porque la hoja añade espacios sola', () => {
    expect(canonicalText('  Harina  ')).toBe('Harina');
  });

  it('normaliza los acentos: se pueden codificar de dos maneras', () => {
    // La misma palabra compuesta y descompuesta. Sin NFC, todo nombre acentuado sería una edición a
    // mano permanente.
    const compuesta = 'Almíbar';
    const descompuesta = 'Almíbar';

    // Que de verdad son dos codificaciones distintas: en la descompuesta, la vocal y el acento son
    // dos caracteres. (No se comparan con `===` porque TypeScript sabe que son literales distintos y
    // rechaza la comparación, que es justo lo que aquí se quiere demostrar en tiempo de ejecución.)
    expect(descompuesta.length).toBe(compuesta.length + 1);
    expect(canonicalText(descompuesta)).toBe(canonicalText(compuesta));
  });

  it('un vacío y un ausente son lo mismo', () => {
    expect(canonicalText(null)).toBe('');
    expect(canonicalText(undefined)).toBe('');
    expect(canonicalText('')).toBe('');
  });

  it('conserva lo que el usuario escribió de verdad', () => {
    expect(canonicalText('=SUMA(A1)')).toBe('=SUMA(A1)');
    expect(canonicalText('Baño de\nmanjar')).toBe('Baño de\nmanjar');
    expect(canonicalText(12)).toBe('12');
  });
});

describe('canonicalCode', () => {
  it('unifica mayúsculas, para que un id tecleado a mano siga emparejando', () => {
    expect(canonicalCode('FLV-Vainilla')).toBe('flv-vainilla');
    expect(canonicalCode(' G ')).toBe('g');
  });
});

/**
 * La lápida se lee **estricta**, al revés que el resto de los sí/no, y la razón es la asimetría del
 * daño: un falso «no borrado» no se nota —la fila sigue ahí y alguien la vuelve a borrar— pero un
 * falso «borrado» hace desaparecer el dato en todos los dispositivos a la vez, y para cuando alguien
 * se da cuenta la lápida ya viajó.
 *
 * Basta con que una celda de servicio quede descolocada para que ahí acabe una huella, y una huella no
 * está en la lista de «noes» de `canonicalFlag`: con la lectura permisiva, contaría como borrado.
 */
describe('isTombstone', () => {
  it.each([
    ['lo que escribe la app', 'TRUE'],
    ['en minúsculas', 'true'],
    ['un sí con tilde', 'Sí'],
    ['un sí sin tilde', 'si'],
    ['una equis', 'x'],
    ['un uno', '1'],
    ['booleano', true],
  ])('borra si dice que sí (%s)', (_caso, value) => {
    expect(isTombstone(value)).toBe(true);
  });

  it.each([
    ['vacío', ''],
    ['espacios', '  '],
    ['nada', null],
    ['FALSE', 'FALSE'],
    ['no', 'NO'],
    ['cero', '0'],
    ['booleano', false],
    ['una huella descolocada', '6caf629b5035fb41'],
    ['una versión descolocada', '1786772542466-0001-200e3f2d'],
    ['un identificador de dispositivo', '200e3f2d'],
    ['cualquier texto', 'pendiente de revisar'],
  ])('NO borra si no lo dice claramente (%s)', (_caso, value) => {
    expect(isTombstone(value)).toBe(false);
  });

  /** Lo que no se entiende no borra, pero tampoco se calla: hay una celda que alguien debería mirar. */
  it('distingue «dice que no» de «no se entiende»', () => {
    expect(isUnrecognisedTombstone('')).toBe(false);
    expect(isUnrecognisedTombstone('no')).toBe(false);
    expect(isUnrecognisedTombstone('TRUE')).toBe(false);
    expect(isUnrecognisedTombstone('6caf629b5035fb41')).toBe(true);
  });
});
