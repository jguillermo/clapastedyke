// @ts-check
/**
 * ESLint (flat config) — `npm run lint`.
 *
 * Hace ejecutable la parte de `.claude/rules/*.md` que es analizable en el AST: las reglas de
 * Angular (signals en vez de decoradores, control flow nativo, OnPush, host bindings), la
 * accesibilidad de las plantillas y los **límites entre capas** (`components/` sin dependencias
 * de la app, `core/` aislado, features sin infraestructura, la suite E2E sin `src/`).
 *
 * Lo que NO es AST sigue siendo code review: mobile-first real a 375px, valores arbitrarios de
 * Tailwind dentro de una cadena de clases, la ubicación de los specs en `core/<ctx>/testing/`, y
 * que cada componente tenga su `*.stories.ts` con un único `Playground` con `play`.
 *
 * Sin type-aware linting a propósito (`recommended`, no `recommendedTypeChecked`): duplicar el
 * type-check que ya hacen `ng build` y los `tsc -p …` del CI solo añadiría minutos.
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

/** Alias de las áreas de `src/app`, para construir los patrones de import prohibido. */
const AREA = {
  components: ['@components/*', '@components/**'],
  core: ['@core/*', '@core/**'],
  features: ['@features/*', '@features/**'],
  platform: ['@platform/*', '@platform/**'],
};

/**
 * Los bounded contexts de `core/`. **Ninguno puede importar de otro**: lo que se comparte se sube a
 * `core/_common` (contratos y nombres de evento) y lo que se comunica va por el `EventBus`.
 *
 * Al añadir un contexto hay que añadirlo aquí, o su aislamiento no se comprueba.
 */
const CORE_CONTEXTS = ['auth', 'external-sync', 'recipe-book'];

/**
 * Bloque de reglas que aísla un contexto de sus hermanos. Los patrones llevan `**​/` delante para
 * cazar tanto el alias (`@core/otro/...`) como una ruta relativa que se escape (`../../otro/...`).
 */
const isolate = (context) => ({
  files: [`src/app/core/${context}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [...AREA.components, ...AREA.features, ...AREA.platform],
            message: 'core/ no importa de ninguna otra capa. Ver core-conventions.md.',
          },
          {
            group: CORE_CONTEXTS.filter((other) => other !== context).flatMap((other) => [
              `**/${other}`,
              `**/${other}/**`,
            ]),
            message:
              'Un bounded context NO depende de otro. Lo compartido se sube a core/_common (contrato o nombre de evento) y la comunicación va por eventos. Ver core-conventions.md.',
          },
        ],
      },
    ],
  },
});

/**
 * Los cerrojos que mantienen la suite E2E independiente de `src/`, como patrón reutilizable: las
 * reglas se sobrescriben por clave, así que el bloque de `specs/` tiene que repetir este patrón
 * al añadir el suyo (si no, lo perdería).
 */
const E2E_NO_SRC = {
  group: [
    '@app/*',
    '@app/**',
    ...AREA.components,
    ...AREA.core,
    ...AREA.features,
    ...AREA.platform,
    '**/src/app/**',
  ],
  message:
    'La suite E2E prueba el build como caja negra: no importa código de src/. Ver e2e-tests-conventions.md.',
};

export default tseslint.config(
  {
    // Artefactos, informes y los scripts JS sueltos (el estático de los E2E no se lintea).
    ignores: [
      'dist/**',
      // El artefacto de Hosting: lo escribe `ng build` dentro de la carpeta que publica Firebase.
      'firebase/public/**',
      // La función tiene su PROPIO ESLint (`firebase/functions/.eslintrc.js`, estilo Google) y su
      // propio `npm run lint`. Lintearla con la config de Angular del repo no tiene sentido.
      'firebase/functions/**',
      'dist-dev/**',
      'out-tsc/**',
      '.angular/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'documentation.json',
      'public/**',
      '**/*.mjs',
      '**/*.js',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TypeScript + Angular
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    // Hace que las reglas de plantilla se apliquen también a los `template:` inline (que es la
    // forma por defecto en este repo).
    processor: angular.processInlineTemplates,
    rules: {
      // Selectores: `migo-` para el design system, `app-` para las features. `attribute` porque
      // algunos componentes del DS se montan sobre el nativo (`button[migo-button]`).
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: ['migo', 'app'], style: 'kebab-case' },
      ],
      // Las directivas de atributo se escriben en camelCase (idioma de Angular y del CDK:
      // `migoSwiperSlide`, como `cdkTrapFocus`). Los componentes montados sobre un nativo
      // (`button[migo-button]`) sí van en kebab-case, y los cubre la regla de arriba.
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['migo', 'app'], style: 'camelCase' },
      ],

      // CLAUDE.md · "No `.component` suffix on files or classes". Estas dos reglas exigen justo
      // lo contrario (`class FooComponent`), así que se apagan a propósito.
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',

      // .claude/CLAUDE.md · OnPush siempre.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',

      // CLAUDE.md · evita `any`; `unknown` cuando el tipo es incierto.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // El noop de `ControlValueAccessor` (`private onChange = () => {}`) es el idioma del patrón:
      // el valor real lo instala `registerOnChange`. Los métodos vacíos siguen prohibidos.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

      // `cond ? this.next() : this.prev();` como sentencia se usa de forma consistente en el
      // repo y se lee mejor que un if/else de una línea. El corto-circuito (`a && b()`) no.
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],

      // La consola se usa a través del `Logger` (`core/_common/logger/`), NUNCA directamente —ni
      // siquiera `warn`/`error`—. Un `console.*` suelto no se puede apagar, ni filtrar por nivel, ni
      // llevar a otro destino. El único fichero autorizado es el adaptador, exceptuado más abajo.
      'no-console': 'error',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // El adaptador de consola: el ÚNICO sitio del proyecto que puede usar `console`
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['src/app/core/_common/logger/console-logger.ts'],
    rules: { 'no-console': 'off' },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Plantillas (incluidas las inline, vía processInlineTemplates)
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // .claude/CLAUDE.md · control flow nativo (@if/@for/@switch), no *ngIf/*ngFor/*ngSwitch.
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Límites entre capas — la regla de dependencias es estricta y asimétrica:
  // features/ → components/ + core/*/application + platform/
  // components/ y platform/ → NADA de la app · core/ → NADA de la app
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['src/app/components/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...AREA.core, ...AREA.features, ...AREA.platform],
              message:
                'components/ no importa de ninguna capa de la app: solo Angular, CDK, libs de UI aprobadas (swiper) y componentes hermanos. Ver components-conventions.md.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/platform/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Dos excepciones documentadas en platform-conventions.md, y solo dos. Ambas son
              // contratos de `core/_common/` sin dominio dentro: el shared kernel es la única parte
              // de `core/` que `platform/` puede tocar, porque la dependencia inversa es imposible
              // (`core/` no puede importar de `platform/`).
              group: [
                ...AREA.core,
                // Los patrones son estilo .gitignore y se evalúan en orden: para rescatar algo hay
                // que re-incluir ANTES su contenedor, porque no se puede desexcluir un hijo si su
                // padre sigue excluido. De ahí este vaivén: se rescata `_common`, se vuelve a
                // prohibir su contenido, y solo entonces se rescatan los dos contratos permitidos.
                '!@core/_common',
                '@core/_common/*',
                '@core/_common/*/**',
                // 1. El contrato `DomainError`, para leer su `code` al renderizar.
                '!@core/_common/error',
                '!@core/_common/error/**',
                // 2. El puerto `Logger`: platform/ también registra, y el puerto vive en
                //    core/_common porque core/ también registra y no puede importar de platform/.
                '!@core/_common/logger',
                '!@core/_common/logger/**',
                ...AREA.features,
              ],
              message:
                'platform/ no conoce el dominio ni las páginas: sin imports de core/ (salvo los contratos DomainError y Logger de core/_common) ni de features/. Ver platform-conventions.md.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...AREA.components, ...AREA.features, ...AREA.platform],
              message: 'core/ no importa de ninguna otra capa. Ver core-conventions.md.',
            },
          ],
        },
      ],
    },
  },

  // Cada bounded context, aislado de sus hermanos. Va DESPUÉS del bloque de arriba porque las
  // reglas se sobrescriben por clave: `isolate()` repite la prohibición de capas junto con la suya.
  ...CORE_CONTEXTS.map(isolate),
  {
    files: ['src/app/features/**/*.ts'],
    ignores: ['src/app/features/_common/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@core/*/infrastructure/*', '@core/*/infrastructure/**'],
              message:
                'Una feature nunca importa infrastructure/: inyecta el caso de uso. Ver features-conventions.md.',
            },
            {
              group: ['@core/*/domain/services/*.service'],
              message:
                'Una feature nunca inyecta un servicio de dominio, solo casos de uso (los `*.service.types` sí valen). Ver features-conventions.md.',
            },
            {
              group: [...AREA.features, '!@features/_common', '!@features/_common/**'],
              message:
                'Una feature no importa otra feature: extrae lo común a features/_common o compón en la ruta. Ver features-conventions.md.',
            },
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Suite E2E — independiente de `src/` por construcción (los dos cerrojos de
  // e2e/tsconfig.json). Esto lo repite como error de lint, con mensaje claro.
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['e2e/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [E2E_NO_SRC] }],
    },
  },
  {
    // Solo los SPECS toman `test`/`expect` del fixture. Los page objects sí importan de
    // '@playwright/test' — de ahí salen los tipos `Page`/`Locator` y el `expect` de sus esperas.
    files: ['e2e/specs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            E2E_NO_SRC,
            {
              group: ['@playwright/test'],
              message:
                '`test`/`expect` vienen del fixture `fixtures/app-fixture` (page objects, anulación de WebGL, guarda de errores). Ver e2e-tests-conventions.md.',
            },
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Tests y stories: mismo rigor, menos ceremonia
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.spec.ts', '**/*.stories.ts', '.storybook/**/*.ts', 'vitest.config.ts'],
    rules: {
      'no-console': 'off',
      // Los componentes host de un spec/story son harness, no parte del design system: llevan
      // prefijo `sb` para que se distingan de un componente real (`migo-`) o una vista (`app-`).
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: ['migo', 'app', 'sb'], style: 'kebab-case' },
      ],
    },
  },
);
