import { RemoteSnapshot, RemoteTable } from '../../domain/services/sync-reader.types';
import { schemaMigrationFor } from '../../infrastructure/schema-migration';
import { SCHEMA_VERSION, SHEET_TABLES } from '../../infrastructure/sheet-schema';

/**
 * La puesta al día de una hoja escrita con una versión anterior del esquema.
 *
 * Lo que este spec vigila sobre todo es lo que la migración **no** hace: no toca filas. Adoptarlas es
 * cosa de `reconcile`, que lo decide por la huella; si además se hiciera aquí, el catálogo entero
 * colisionaría en el mismo ciclo.
 */

/** Las cabeceras de la v3: sin columnas de servicio y sin el rótulo `(auto)`. */
function v3Headers(name: string): string[] {
  const table = SHEET_TABLES.find((candidate) => candidate.name === name);
  return (table?.headers ?? [])
    .filter((header) => !['version', 'origen', 'huella', 'borrado'].includes(header))
    .map((header) => header.replace(/\s*\(auto\)$/, ''));
}

function snapshotOf(schemaVersion: number | null, headersOf: (name: string) => string[]) {
  const tables: RemoteTable[] = SHEET_TABLES.map((table) => ({
    name: table.name,
    present: true,
    headers: headersOf(table.name),
    rows: [],
  }));
  return { tables, schemaVersion } satisfies RemoteSnapshot;
}

describe('schemaMigrationFor', () => {
  it('una hoja al día no necesita nada', () => {
    const migration = schemaMigrationFor(
      snapshotOf(SCHEMA_VERSION, (name) => [
        ...(SHEET_TABLES.find((table) => table.name === name)?.headers ?? []),
      ]),
    );

    expect(migration.needed).toBe(false);
    expect(migration.writes).toEqual([]);
  });

  it('una hoja de la v3 reescribe las cabeceras de todas sus pestañas', () => {
    const migration = schemaMigrationFor(snapshotOf(3, v3Headers));

    expect(migration.needed).toBe(true);
    expect(migration.from).toBe(3);
    expect(migration.writes).toHaveLength(SHEET_TABLES.length);
  });

  it('reescribe con las cabeceras nuevas, incluidas las de servicio y el rótulo (auto)', () => {
    const migration = schemaMigrationFor(snapshotOf(3, v3Headers));
    const recetas = migration.writes.find((write) => write.range.includes('Recetas'));

    expect(recetas?.headers).toContain('Categoría (auto)');
    expect(recetas?.headers).toContain('Nº de insumos (auto)');
    expect(recetas?.headers.slice(-4)).toEqual(['version', 'origen', 'huella', 'borrado']);
  });

  it('el rango cubre exactamente las columnas de la tabla', () => {
    const migration = schemaMigrationFor(snapshotOf(3, v3Headers));
    const insumos = migration.writes.find((write) => write.range.includes('Insumos'));
    const columnas = SHEET_TABLES.find((table) => table.name === 'supplies')?.fields.length ?? 0;

    // 13 columnas → hasta la M, y solo la fila 1.
    expect(columnas).toBe(13);
    expect(insumos?.range).toBe("'Insumos'!A1:M1");
  });

  it('una hoja que no dice su versión se trata como antigua', () => {
    const migration = schemaMigrationFor(snapshotOf(null, v3Headers));

    expect(migration.needed).toBe(true);
    expect(migration.from).toBeNull();
  });

  it('una cabecera a medias se reescribe aunque la hoja diga que ya es de esta versión', () => {
    // Alguien pudo editarla. Comparar los rótulos de verdad cuesta lo mismo que fiarse de `_meta`.
    const migration = schemaMigrationFor(
      snapshotOf(SCHEMA_VERSION, (name) =>
        name === 'flavors'
          ? ['id']
          : [...(SHEET_TABLES.find((t) => t.name === name)?.headers ?? [])],
      ),
    );

    expect(migration.writes).toHaveLength(1);
    expect(migration.writes[0]?.range).toContain('Sabores');
  });

  it('una pestaña que no está no se migra: la crea quien escriba, con sus cabeceras', () => {
    const migration = schemaMigrationFor({
      schemaVersion: 3,
      tables: SHEET_TABLES.map((table) => ({
        name: table.name,
        present: table.name !== 'flavors',
        headers: table.name === 'flavors' ? [] : v3Headers(table.name),
        rows: [],
      })),
    });

    expect(migration.writes.some((write) => write.range.includes('Sabores'))).toBe(false);
  });

  it('NO toca ninguna fila: adoptar es cosa de reconcile', () => {
    const migration = schemaMigrationFor(snapshotOf(3, v3Headers));

    // Todos los rangos son de la fila 1 y solo de la fila 1.
    for (const write of migration.writes) {
      expect(write.range).toMatch(/!A1:[A-Z]+1$/);
    }
  });
});
