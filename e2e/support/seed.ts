/**
 * Estado inicial de cada test, **leído del seed publicado** en
 * `public/seed/recipe-book.seed.json` — el mismo fichero que la app siembra al arrancar
 * sobre una IndexedDB vacía.
 *
 * Cada test arranca en un contexto de navegador nuevo (IndexedDB vacía), así que este es
 * **siempre** el estado inicial: no hace falta preparar nada.
 *
 * ### Por qué se lee el JSON y no se copia
 * Antes estas constantes eran una transcripción a mano del seed, con una nota de «si el
 * JSON cambia, actualiza esto». Eso es deriva silenciosa: el día que cambiara el seed, los
 * tests fallarían por la razón equivocada o —peor— pasarían asertando lo que ya no existe.
 * Ahora los **hechos** (nombres, categorías, recetas, capacidades, cuántos insumos hay) se
 * derivan del fichero y no pueden desalinearse.
 *
 * ### Lo que sigue siendo literal, y por qué
 * Lo que un test **espera ver en pantalla** se escribe literal: el importe total de una
 * receta (`GLASEADO.total`) lo calcula el negocio (`PreviewRecipeCost`) y el empaque de un
 * insumo lo normaliza la vista (1000 g se pinta como «1 kg»). Recalcular eso aquí sería
 * duplicar la lógica bajo prueba: el test asertaría su propia aritmética en vez de la de la
 * app. En su lugar, cada literal lleva una **guarda** contra el dato crudo del JSON, así que
 * si el seed cambia el módulo falla al importarse con un mensaje claro.
 *
 * Leer de `public/` está permitido: es un asset publicado (lo sirve el build que prueban los
 * E2E), no código de `src/` — ver `e2e-tests-conventions.md`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Presentación de compra tal como la guarda el seed (`purchasePrice.per`). */
interface SeedPer {
  value: number;
  unit: string;
}

interface SeedSupply {
  id: string;
  name: string;
  baseUnit: string;
  usage: string;
  purchasePrice: { amount: number; per: SeedPer; currency: string };
}

interface SeedFile {
  enabled: boolean;
  version: number;
  flavors: readonly { id: string; label: string }[];
  recipeCapacities: readonly { id: string; group: string; label: string; factor: number }[];
  supplies: readonly SeedSupply[];
  categories: readonly { id: string; name: string }[];
  recipes: readonly { id: string; categoryId: string; name: string; lines: readonly unknown[] }[];
}

/** El seed publicado. `__dirname` = `e2e/support/`, así que la raíz del repo está dos arriba. */
const SEED: SeedFile = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'public', 'seed', 'recipe-book.seed.json'), 'utf-8'),
) as SeedFile;

/** Falla el módulo entero con un mensaje accionable en cuanto el seed deja de encajar. */
function assertSeed(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[e2e/seed] ${message} — revisa public/seed/recipe-book.seed.json`);
  }
}

assertSeed(SEED.enabled, 'el seed está deshabilitado: ningún test tendría datos');

/** Orden alfabético en español, el mismo criterio con el que las vistas ordenan sus listas. */
const alphabetical = (a: string, b: string): number => a.localeCompare(b, 'es');

/* ------------------------------------------------------------------ categorías y recetas */

/**
 * Categorías de sistema. La unión se declara para que los specs tengan autocompletado, y se
 * comprueba contra el JSON: si el seed añade o renombra una categoría, salta la guarda.
 */
export type CategoryName = 'Coberturas' | 'Queques' | 'Rellenos';

const DECLARED_CATEGORIES: readonly CategoryName[] = ['Coberturas', 'Queques', 'Rellenos'];

/** Categorías en el orden alfabético en que las devuelve el catálogo. */
export const CATEGORIES = SEED.categories
  .map((category) => category.name)
  .sort(alphabetical) as readonly CategoryName[];

assertSeed(
  CATEGORIES.length === DECLARED_CATEGORIES.length &&
    CATEGORIES.every((name, i) => name === DECLARED_CATEGORIES[i]),
  `las categorías del seed (${CATEGORIES.join(', ')}) ya no son las declaradas ` +
    `(${DECLARED_CATEGORIES.join(', ')}): actualiza CategoryName`,
);

const CATEGORY_BY_ID = new Map(SEED.categories.map((category) => [category.id, category.name]));

/** Recetas sembradas por categoría (alfabéticas, como las ordena la vista). */
export const RECIPES: Record<CategoryName, readonly string[]> = (() => {
  const grouped = new Map<string, string[]>(CATEGORIES.map((name) => [name, []]));
  for (const recipe of SEED.recipes) {
    const category = CATEGORY_BY_ID.get(recipe.categoryId);
    assertSeed(!!category, `la receta «${recipe.name}» apunta a una categoría inexistente`);
    grouped.get(category!)!.push(recipe.name);
  }
  const byCategory = {} as Record<CategoryName, readonly string[]>;
  for (const name of CATEGORIES) {
    byCategory[name] = grouped.get(name)!.sort(alphabetical);
  }
  return byCategory;
})();

/* ------------------------------------------------------------- sabores y capacidades */

/** Sabores del catálogo (select de «Sabor»). */
export const FLAVORS = SEED.flavors.map((flavor) => flavor.label).sort(alphabetical);

const capacityLabels = (group: string): string[] =>
  SEED.recipeCapacities
    .filter((capacity) => capacity.group === group)
    .map((capacity) => capacity.label)
    .sort(alphabetical);

/** Capacidades por porciones (select de «Tamaño», grupo Porciones). */
export const PORTIONS = capacityLabels('portions');
/** Capacidades por molde (select de «Tamaño», grupo Molde). */
export const MOLDS = capacityLabels('mold');

/* --------------------------------------------------------------------------- insumos */

/** Nº de insumos sembrados (la lista de Insumos muestra estos + 1 renglón para agregar). */
export const SUPPLY_COUNT = SEED.supplies.length;

const SUPPLY_BY_ID = new Map(SEED.supplies.map((supply) => [supply.id, supply]));

/**
 * Insumos de referencia usados por los tests.
 *
 * `id` ancla la entrada al seed; `packaging`/`unit` son lo que **la vista pinta** en el
 * renglón (la normalización de 1000 g → «1 kg» es suya), y `per` es el dato crudo del que
 * salen: la guarda de abajo verifica que sigue siendo ese, para que el literal no envejezca
 * en silencio.
 */
const SUPPLY_REFS = {
  /** Masa comprada por kilo: 1 kg por S/ 4.50 → S/ 0.0045 por g. */
  harina: { id: 'ing-harina', per: { value: 1000, unit: 'g' }, packaging: '1', unit: 'kg' },
  /** Conteo: 1 unidad por S/ 0.50. */
  huevos: { id: 'ing-huevos', per: { value: 1, unit: 'u' }, packaging: '1', unit: 'u' },
  /** Masa comprada por bolsa de 500 g. */
  azucarImpalpable: {
    id: 'ing-azucar-impalpable',
    per: { value: 500, unit: 'g' },
    packaging: '500',
    unit: 'g',
  },
  /** Masa por kilo, el insumo más barato (buen candidato a reprecio). */
  sal: { id: 'ing-sal', per: { value: 1000, unit: 'g' }, packaging: '1', unit: 'kg' },
  /** Comparte prefijo con otros dos: fuerza el desplegable del combobox. */
  azucarBlanca: {
    id: 'ing-azucar-blanca',
    per: { value: 1000, unit: 'g' },
    packaging: '1',
    unit: 'kg',
  },
} as const;

/** Insumo de referencia: nombre y precio salen del seed; el empaque es lo que pinta la vista. */
export interface SeededSupply {
  readonly name: string;
  readonly packaging: string;
  readonly unit: string;
  readonly price: string;
}

export const SUPPLIES: Record<keyof typeof SUPPLY_REFS, SeededSupply> = Object.fromEntries(
  Object.entries(SUPPLY_REFS).map(([key, ref]) => {
    const supply = SUPPLY_BY_ID.get(ref.id);
    assertSeed(!!supply, `el insumo «${ref.id}» (${key}) ya no está en el seed`);
    const { amount, per } = supply!.purchasePrice;
    assertSeed(
      per.value === ref.per.value && per.unit === ref.per.unit,
      `«${ref.id}» se compra ahora por ${per.value} ${per.unit} y no por ` +
        `${ref.per.value} ${ref.per.unit}: revisa packaging/unit de ${key}`,
    );
    return [
      key,
      { name: supply!.name, packaging: ref.packaging, unit: ref.unit, price: String(amount) },
    ];
  }),
) as Record<keyof typeof SUPPLY_REFS, SeededSupply>;

/* ------------------------------------------------------------------ receta de referencia */

const GLASEADO_NAME = 'Glaseado de Queso Crema';
/** Total que calcula el negocio para esta receta con los precios del seed. */
const GLASEADO_TOTAL = 'S/ 28.80';

const glaseado = SEED.recipes.find((recipe) => recipe.name === GLASEADO_NAME);
assertSeed(!!glaseado, `la receta de referencia «${GLASEADO_NAME}» ya no está en el seed`);

/** Receta con contenido rico, útil para aserciones sobre el overlay. */
export const GLASEADO = {
  name: GLASEADO_NAME,
  category: CATEGORY_BY_ID.get(glaseado!.categoryId) as CategoryName,
  lineCount: glaseado!.lines.length,
  total: GLASEADO_TOTAL,
} as const;
