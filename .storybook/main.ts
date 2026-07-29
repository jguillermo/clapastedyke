import type { StorybookConfig } from '@storybook/angular-vite';
import { mergeConfig } from 'vite';
import { angularPathAliases } from './aliases';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/angular-vite",
    "options": {
      "compodoc": true,
      "compodocArgs": [
        "-e",
        "json",
        "-d",
        "."
      ]
    }
  },
  // Los alias `@` de tsconfig no llegan solos al resolver de Vite (ver ./aliases.ts).
  // `mergeConfig` los combina con los que ya trae Storybook: da prioridad a los nuestros y
  // normaliza la forma (objeto/array) sin pisar nada.
  viteFinal: async (viteConfig) => mergeConfig(viteConfig, { resolve: { alias: angularPathAliases } })
};
export default config;
