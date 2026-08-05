import {
  authoritativeFields,
  canonicalCode,
  canonicalFlag,
  canonicalNumber,
  canonicalRow,
  canonicalText,
  FIELD_KINDS,
  TECHNICAL_FIELDS,
} from '../../infrastructure/sheet-canonical';
import { SHEET_TABLES } from '../../infrastructure/sheet-schema';

/**
 * El canonizador es el cimiento del motor de sincronización, y su fallo es invisible: si la ida y la
 * vuelta no dan la misma cadena, cada fila parece editada a mano en cada ciclo y dos dispositivos se
 * pisan para siempre. Con un solo dispositivo no se nota, y en un test normal los dos lados pasan por
 * el mismo código y coinciden por accidente.
 *
 * Por eso lo que se prueba aquí es **la ida y la vuelta**: el mismo dato entrando por los dos caminos
 * que existen de verdad —el modelo de la app (números) y una celda leída de la hoja (texto o número)—
 * tiene que dar el mismo canónico.
 */
describe('canonicalNumber · ida y vuelta', () => {
  // [qué es, como lo da el modelo, como puede volver de la hoja, canónico esperado]
  const casos: [string, unknown, unknown, string][] = [
    ['un entero', 0, '0', '0'],
    ['un precio con céntimos', 2.5, '2.5', '2.5'],
    ['un precio que la hoja devuelve como número', 2.5, 2.5, '2.5'],
    ['un entero grande', 1000, '1000', '1000'],
    ['la suma que no cierra en binario', 0.1 + 0.2, '0.30000000000000004', '0.30000000000000004'],
    ['un número enorme, en notación científica', 1e21, '1e+21', '1e+21'],
    ['un número diminuto', 1e-7, '1e-7', '1e-7'],
    ['un factor con muchos decimales', 1 / 3, '0.3333333333333333', '0.3333333333333333'],
    ['un negativo', -5.25, '-5.25', '-5.25'],
    ['el cero negativo, que es el mismo cero', -0, '0', '0'],
  ];

  it.each(casos)('%s da lo mismo por los dos caminos', (_caso, local, remoto, esperado) => {
    expect(canonicalNumber(local)).toBe(esperado);
    expect(canonicalNumber(remoto)).toBe(esperado);
  });

  it('acepta la coma decimal de quien teclea en español', () => {
    expect(canonicalNumber('2,50')).toBe('2.5');
    expect(canonicalNumber('0,333')).toBe('0.333');
  });

  it('ignora los espacios que deja una copia y pega', () => {
    expect(canonicalNumber('  2.5  ')).toBe('2.5');
    expect(canonicalNumber('1 000')).toBe('1000');
  });

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['nada', null],
    ['sin definir', undefined],
    ['texto', 'dos y medio'],
    ['un número a medias', '2.5.3'],
    ['infinito', Infinity],
    ['no un número', NaN],
    ['con separador de miles ambiguo', '1.234,56'],
    ['con separador de miles ambiguo al revés', '1,234.56'],
  ])('devuelve null si el valor no es un número (%s)', (_caso, value) => {
    expect(canonicalNumber(value)).toBeNull();
  });
});

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

describe('canonicalFlag', () => {
  it('escribe TRUE y lee permisivo: nadie teclea TRUE', () => {
    expect(canonicalFlag(true)).toBe('TRUE');
    expect(canonicalFlag('TRUE')).toBe('TRUE');
    expect(canonicalFlag('Sí')).toBe('TRUE');
    expect(canonicalFlag('x')).toBe('TRUE');
    expect(canonicalFlag(1)).toBe('TRUE');
  });

  it.each([
    ['vacío', ''],
    ['espacios', '  '],
    ['nada', null],
    ['FALSE', 'FALSE'],
    ['false', 'false'],
    ['no', 'NO'],
    ['cero', '0'],
    ['falso', 'Falso'],
    ['booleano', false],
  ])('cuenta como «no» si viene %s', (_caso, value) => {
    expect(canonicalFlag(value)).toBe('');
  });
});

describe('coherencia con el esquema de la hoja', () => {
  it('cada columna del esquema está clasificada, o es de servicio', () => {
    // Si alguien añade un campo a SHEET_TABLES y olvida clasificarlo aquí, falla el test en vez de
    // fallar la huella en la hoja de un usuario semanas después. Las de servicio no se clasifican por
    // tabla: se excluyen en un solo sitio, porque son las mismas en todas.
    const sinClasificar = SHEET_TABLES.flatMap((table) =>
      table.fields
        .filter(
          (field) => !TECHNICAL_FIELDS.has(field) && FIELD_KINDS[table.name]?.[field] === undefined,
        )
        .map((field) => `${table.name}.${field}`),
    );

    expect(sinClasificar).toEqual([]);
  });

  it('ninguna columna de servicio entra en la huella', () => {
    for (const table of SHEET_TABLES) {
      const fields = authoritativeFields(table.name, table.fields);
      expect(fields.filter((field) => TECHNICAL_FIELDS.has(field))).toEqual([]);
    }
  });

  it('no hay columnas clasificadas que el esquema ya no tenga', () => {
    const fantasmas = Object.entries(FIELD_KINDS).flatMap(([name, kinds]) => {
      const table = SHEET_TABLES.find((candidate) => candidate.name === name);
      return Object.keys(kinds)
        .filter((field) => !table?.fields.includes(field))
        .map((field) => `${name}.${field}`);
    });

    expect(fantasmas).toEqual([]);
  });

  it('la clave de cada tabla es una columna autoritativa', () => {
    // Si la clave fuera derivada o metadato, la identidad de la fila quedaría fuera de la huella.
    for (const table of SHEET_TABLES) {
      const key = table.key ?? table.parentKey;
      if (key) {
        expect(authoritativeFields(table.name, table.fields)).toContain(key);
      }
    }
  });

  it('las columnas que la app recalcula quedan fuera de lo autoritativo', () => {
    const recipes = SHEET_TABLES.find((table) => table.name === 'recipes');
    const fields = authoritativeFields('recipes', recipes?.fields ?? []);

    expect(fields).toContain('categoryId');
    expect(fields).not.toContain('categoryName');
    expect(fields).not.toContain('lineCount');
    expect(fields).not.toContain('syncedAt');
  });
});

describe('canonicalRow', () => {
  const fields = ['id', 'name', 'baseUnit', 'priceAmount', 'currency', 'syncedAt'];

  it('devuelve solo lo autoritativo, en el orden del esquema', () => {
    const row: Record<string, unknown> = {
      id: 'ING-1',
      name: '  Harina  ',
      baseUnit: 'G',
      priceAmount: 2.5,
      currency: 'PEN',
      syncedAt: '2026-08-04T00:00:00.000Z',
    };

    const result = canonicalRow('supplies', fields, (field) => row[field]);

    expect(result).toEqual({ values: ['ing-1', 'Harina', 'g', '2.5', 'pen'] });
  });

  it('señala la celda culpable en vez de lanzar', () => {
    const result = canonicalRow('supplies', fields, (field) =>
      field === 'priceAmount' ? 'gratis' : 'x',
    );

    expect(result).toEqual({ unreadable: { field: 'priceAmount', value: 'gratis' } });
  });

  it('una columna sin clasificar se trata como dato, no se ignora', () => {
    // Prudencia: incluirla de más se nota (una falsa edición manual); ignorarla pierde datos.
    const result = canonicalRow('supplies', ['inventada'], () => ' Hola ');

    expect(result).toEqual({ values: ['Hola'] });
  });
});
