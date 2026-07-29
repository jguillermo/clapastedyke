/**
 * Datos del seed del libro de recetas, tal como los siembra
 * `public/seed/recipe-book.seed.json` al arrancar sobre una IndexedDB vacía.
 *
 * Cada test arranca en un contexto de navegador nuevo (IndexedDB vacía), así que
 * este es **siempre** el estado inicial: no hace falta preparar nada. Si el JSON
 * del seed cambia, actualiza estas constantes.
 */

/** Categorías de sistema, en el orden alfabético en que las devuelve el catálogo. */
export const CATEGORIES = ['Coberturas', 'Queques', 'Rellenos'] as const;
export type CategoryName = (typeof CATEGORIES)[number];

/** Recetas sembradas por categoría (alfabéticas, como las ordena la vista). */
export const RECIPES: Record<CategoryName, readonly string[]> = {
  Coberturas: [
    'Baño de Manjar',
    'Buttercream de Vainilla',
    'Crema Chantilly',
    'Fudge de Chocolate',
    'Ganache de Chocolate',
    'Glaseado de Queso Crema',
  ],
  Queques: [
    'Bizcocho de Naranja',
    'Bizcocho de Vainilla',
    'Keke de Chocolate',
    'Keke de Limón',
    'Torta Húmeda de Chocolate',
    'Vainilla Clásica',
  ],
  Rellenos: [
    'Crema Chantilly',
    'Crema Pastelera',
    'Durazno con Crema',
    'Fresas con Crema',
    'Ganache de Chocolate',
    'Manjar Blanco',
  ],
};

/** Sabores del catálogo (select de «Sabor»). */
export const FLAVORS = ['Chocolate', 'Fresa', 'Limón', 'Manjar', 'Naranja', 'Vainilla'] as const;

/** Capacidades por porciones (select de «Tamaño», grupo Porciones). */
export const PORTIONS = ['10', '12', '24', '40'] as const;

/** Capacidades por molde (select de «Tamaño», grupo Molde). */
export const MOLDS = ['Molde grande', 'Molde mediano', 'Molde pequeño'] as const;

/** Nº de insumos sembrados (la lista de Insumos muestra estos + 1 renglón para agregar). */
export const SUPPLY_COUNT = 22;

/** Insumos de referencia usados por los tests, con su compra tal como se sembró. */
export const SUPPLIES = {
  /** Masa comprada por kilo: 1 kg por S/ 4.50 → S/ 0.0045 por g. */
  harina: { name: 'Harina sin preparar', packaging: '1', unit: 'kg', price: '4.5' },
  /** Conteo: 1 unidad por S/ 0.50. */
  huevos: { name: 'Huevos', packaging: '1', unit: 'u', price: '0.5' },
  /** Masa comprada por bolsa de 500 g. */
  azucarImpalpable: { name: 'Azúcar impalpable', packaging: '500', unit: 'g', price: '5.5' },
  /** Masa por kilo, el insumo más barato (buen candidato a reprecio). */
  sal: { name: 'Sal', packaging: '1', unit: 'kg', price: '1.5' },
  /** Comparte prefijo con otros dos: fuerza el desplegable del combobox. */
  azucarBlanca: { name: 'Azúcar blanca', packaging: '1', unit: 'kg', price: '4.2' },
} as const;

/** Receta con contenido rico, útil para aserciones sobre el overlay. */
export const GLASEADO = {
  name: 'Glaseado de Queso Crema',
  category: 'Coberturas' as CategoryName,
  lineCount: 4,
  total: 'S/ 28.80',
} as const;
