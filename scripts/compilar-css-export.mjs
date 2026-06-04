#!/usr/bin/env node
/**
 * Compila src/estilos/formularios.css con Tailwind v4 (vía @tailwindcss/postcss)
 * y escribe tmp/export.css — el CSS que el export inline-a en cada src/XForm.html.
 * Evita depender de @tailwindcss/cli: usa los paquetes ya instalados.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = join(RAIZ, 'src', 'estilos', 'formularios.css');
const SALIDA = join(RAIZ, 'tmp', 'export.css');

const css = readFileSync(ENTRADA, 'utf8');
const resultado = await postcss([tailwindcss({ base: RAIZ })]).process(css, {
  from: ENTRADA,
  to: SALIDA,
});

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(SALIDA, resultado.css, 'utf8');
console.log(`✓ CSS de export compilado: ${SALIDA} (${(resultado.css.length / 1024).toFixed(1)} kB)`);
