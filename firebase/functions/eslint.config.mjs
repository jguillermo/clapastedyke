// ESLint de la FUNCIÓN, en formato flat.
//
// CRITICAL: este fichero tiene que existir, y tiene que ser flat.
//
// `firebase init` deja un `.eslintrc.js` con `root: true` y el script `eslint --ext .js,.ts .`.
// Eso funciona en un repositorio suelto y AQUÍ NO, porque esta carpeta cuelga de un repo que ya
// tiene su propio flat config en la raíz (`eslint.config.mjs`): ESLint sube directorios buscando
// uno, encuentra el de la raíz, se pone en modo flat — y en modo flat `--ext` ya no existe. El
// `root: true` no protege de esto: es un mecanismo de eslintrc, y el descubrimiento de flat config
// lo ignora. El síntoma era «Invalid option '--ext'» reventando el `predeploy` de firebase.json,
// o sea el despliegue entero.
//
// Teniendo su propio flat config, la búsqueda para aquí y la raíz deja de influir. (La raíz, por su
// lado, ignora `firebase/functions/**`, así que nadie lintea esto dos veces.)
//
// Qué se conserva del `.eslintrc.js` original: `eslint:recommended`, las reglas recomendadas de
// typescript-eslint, y las dos que el scaffold fijaba a mano (comillas dobles, indentación de 2).
// Lo que NO se conserva es `eslint-config-google`: solo existe en formato eslintrc y no se puede
// cargar desde un flat config sin un adaptador. Sigue declarado en package.json por si se decide
// recuperarlo con `FlatCompat`.
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // La salida de `tsc` y lo generado: no son fuente.
  {ignores: ["lib/**", "generated/**"]},

  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {project: ["./tsconfig.json"], sourceType: "module"},
    },
    plugins: {"@typescript-eslint": tsPlugin},
    rules: {
      ...js.configs.recommended.rules,
      // Apaga las reglas de core que TypeScript ya cubre mejor (`no-undef`, `no-unused-vars`…).
      ...tsPlugin.configs["eslint-recommended"].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      "quotes": ["error", "double"],
      "indent": ["error", 2],
    },
  },
];
