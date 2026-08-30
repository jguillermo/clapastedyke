// ESLint (flat config) del paquete de funciones.
//
// IMPORTANTE: este fichero tiene que existir aunque solo herede lo básico.
// ESLint busca el fichero de configuración plana hacia ARRIBA desde el cwd; sin
// uno propio aquí, encontraría el `eslint.config.mjs` de la raíz del repo (el de
// la app Angular) y lintaría el backend con las reglas del frontend.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['lib/**', 'generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      quotes: ['error', 'double'],
      indent: ['error', 2],
    },
  },
);
