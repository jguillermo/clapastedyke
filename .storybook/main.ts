import type { StorybookConfig } from '@storybook/angular-vite';
import { mergeConfig } from 'vite';
import { angularPathAliases } from './aliases';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: {
      compodoc: true,
      compodocArgs: ['-e', 'json', '-d', '.'],
    },
  },
  // Los alias `@` de tsconfig no llegan solos al resolver de Vite (ver ./aliases.ts).
  // `mergeConfig` los combina con los que ya trae Storybook: da prioridad a los nuestros y
  // normaliza la forma (objeto/array) sin pisar nada.
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: { alias: angularPathAliases },
      // Subpaquetes del CDK que NINGUNA story importa al arrancar: Vite no los ve en el escaneo
      // inicial, los descubre a mitad de la corrida y recarga para pre-empaquetarlos. Esa recarga
      // deja dos copias de `@angular/core` en vuelo, y el `inject()` interno del servicio revienta
      // con NG0203. Declararlos aquí los pre-empaqueta desde el principio.
      optimizeDeps: { include: ['@angular/cdk/clipboard'] },
    }),
};
export default config;
