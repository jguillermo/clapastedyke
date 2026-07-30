/**
 * Para qué se usa un insumo. Todo lo que se compra para preparar el pastel es un
 * `Supply`; `usage` es solo una etiqueta de uso (cómo se agrupa el insumo) — NO
 * cambia cómo se compra ni se precia. No hay distinción en el precio.
 */
export type SupplyUsage = 'recipe' | 'topper' | 'box' | 'base';

export const SUPPLY_USAGES: readonly SupplyUsage[] = ['recipe', 'topper', 'box', 'base'];

export function isSupplyUsage(value: string): value is SupplyUsage {
  return (SUPPLY_USAGES as readonly string[]).includes(value);
}
