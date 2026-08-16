import { fingerprintMatches, fingerprintOf } from '../../infrastructure/sheet-hash';

/**
 * La huella es lo que distingue «esto lo escribió la app» de «esto lo tocó una persona». Un fallo aquí
 * no da error: hace que la corrección de alguien se pierda en silencio (si dos filas distintas dan la
 * misma huella) o que todo parezca editado a mano a la vez (si no es estable).
 */
describe('fingerprintOf', () => {
  it('los mismos valores dan la misma huella', async () => {
    const uno = await fingerprintOf(['ing-1', 'Harina', 'g', '2.5']);
    const otro = await fingerprintOf(['ing-1', 'Harina', 'g', '2.5']);

    expect(uno).toBe(otro);
  });

  it('cambiar un valor cambia la huella', async () => {
    const antes = await fingerprintOf(['ing-1', 'Harina', 'g', '2.5']);
    const despues = await fingerprintOf(['ing-1', 'Harina', 'g', '3']);

    expect(despues).not.toBe(antes);
  });

  it('el orden de las columnas importa', async () => {
    const uno = await fingerprintOf(['a', 'b']);
    const otro = await fingerprintOf(['b', 'a']);

    expect(uno).not.toBe(otro);
  });

  it('no confunde dos filas por dónde caiga el separador', async () => {
    // El separador tiene que ser algo que no se pueda teclear. Cada uno de estos es lo que colisionaría
    // con ['a','b'] si el separador fuese ese carácter imprimible.
    const dosColumnas = await fingerprintOf(['a', 'b']);
    const conEspacio = await fingerprintOf(['a b']);
    const conBarra = await fingerprintOf(['a|b']);
    const conTabulador = await fingerprintOf(['a\tb']);
    const pegadas = await fingerprintOf(['ab']);

    const todas = [dosColumnas, conEspacio, conBarra, conTabulador, pegadas];
    expect(new Set(todas).size).toBe(todas.length);
  });

  it('mover texto de una columna a la de al lado cambia la huella', async () => {
    // El caso real que esto protege: alguien arrastra media celda a la columna vecina.
    const antes = await fingerprintOf(['Baño', 'de manjar']);
    const despues = await fingerprintOf(['Baño de', 'manjar']);

    expect(despues).not.toBe(antes);
  });

  it('distingue un vacío de una columna que no está', async () => {
    const conVacio = await fingerprintOf(['a', '']);
    const sinNada = await fingerprintOf(['a']);

    expect(conVacio).not.toBe(sinNada);
  });

  it('es hexadecimal en minúsculas y de largo fijo', async () => {
    const huella = await fingerprintOf(['cualquier', 'cosa']);

    expect(huella).toMatch(/^[0-9a-f]{16}$/);
  });

  it('una fila sin columnas también tiene huella', async () => {
    await expect(fingerprintOf([])).resolves.toMatch(/^[0-9a-f]{16}$/);
  });

  it('aguanta acentos y saltos de línea', async () => {
    const uno = await fingerprintOf(['Baño de\nmanjar']);
    const otro = await fingerprintOf(['Baño de manjar']);

    expect(uno).not.toBe(otro);
    expect(uno).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('fingerprintMatches', () => {
  it('cuadra con la huella escrita', async () => {
    const huella = await fingerprintOf(['ing-1', 'Harina']);

    expect(fingerprintMatches(huella, huella)).toBe(true);
  });

  it('tolera lo que la hoja le haga alrededor', async () => {
    const huella = await fingerprintOf(['ing-1', 'Harina']);

    expect(fingerprintMatches(`  ${huella}  `, huella)).toBe(true);
    expect(fingerprintMatches(huella.toUpperCase(), huella)).toBe(true);
  });

  it('una huella ausente NO cuadra: la fila se trata como editada a mano', async () => {
    // Es lo prudente. Una fila sin huella es una fila de dueño desconocido, y asumir que es nuestra
    // sería sobrescribir lo que puso una persona.
    const huella = await fingerprintOf(['ing-1', 'Harina']);

    expect(fingerprintMatches('', huella)).toBe(false);
    expect(fingerprintMatches('   ', huella)).toBe(false);
    expect(fingerprintMatches('no-es-una-huella', huella)).toBe(false);
  });
});
