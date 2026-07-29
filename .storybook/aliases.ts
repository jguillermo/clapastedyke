import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..');

/**
 * Alias `@` del proyecto para el resolver de **Vite**, espejo de `tsconfig.json` →
 * `compilerOptions.paths` (ver `.claude/rules/path-aliases-conventions.md`).
 *
 * Hay que declararlos a mano: **ni el preset de `@storybook/angular-vite` ni el plugin de Angular
 * leen los `paths` de TypeScript**, y el `browserTarget` del target `storybook` solo hereda del
 * target `build` cosas como `styles`/`assets`, no la resolución de módulos. Sin esto, cualquier
 * story de un componente que importe con alias (p.ej. `autocomplete.ts` →
 * `@components/form-field/form-field`) rompe con "Failed to resolve import".
 *
 * Fuente única para las dos entradas de la cadena de Storybook: `main.ts` (dev server y build) y
 * `vitest.config.ts` (corrida de los `play`). Si se añade un alias a `tsconfig.json`, añádelo aquí.
 */
export const angularPathAliases: Record<string, string> = {
  '@app': path.join(root, 'src/app'),
  '@components': path.join(root, 'src/app/components'),
  '@core': path.join(root, 'src/app/core'),
  '@features': path.join(root, 'src/app/features'),
  '@platform': path.join(root, 'src/app/platform'),
};
