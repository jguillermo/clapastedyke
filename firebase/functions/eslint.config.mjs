// ESLint (flat config) del paquete de funciones.
//
// IMPORTANTE: este fichero tiene que existir aunque solo herede lo básico.
// ESLint busca el fichero de configuración plana hacia ARRIBA desde el cwd; sin
// uno propio aquí, encontraría el `eslint.config.mjs` de la raíz del repo (el de
// la app Angular) y lintaría el backend con las reglas del frontend.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `lib/` y `lib-test/` son salida de `tsc`: JavaScript compilado que no se lintea.
  { ignores: ['lib/**', 'lib-test/**', 'generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Los DOS proyectos: `tsconfig.json` excluye los `*.test.ts` (no viajan al despliegue), así
        // que sin `tsconfig.test.json` los tests no pertenecerían a ninguno y el parser fallaría.
        //
        // Aquí estaba `tsconfig.dev.json`, que `firebase init` deja para lintar el `.eslintrc.js`
        // que él mismo genera. Ese fichero se sustituyó por este flat config, así que aquel tsconfig
        // se quedó apuntando a un fichero inexistente y tumbaba el lint con `TS18003` — y el lint es
        // el primer `predeploy`, así que tumbaba el despliegue entero. Se eliminó.
        project: ['tsconfig.json', 'tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      quotes: ['error', 'double'],
      indent: ['error', 2],
    },
  },
);
