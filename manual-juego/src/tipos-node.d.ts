/**
 * Declaraciones mínimas de Node para el spec de export (corre bajo Vitest/Node).
 * Evita depender de @types/node solo para esto.
 */
declare module 'node:fs' {
  export function readFileSync(ruta: string, codificacion: string): string;
  export function writeFileSync(ruta: string, datos: string, codificacion?: string): void;
  export function mkdirSync(ruta: string, opciones?: { recursive?: boolean }): void;
  export function existsSync(ruta: string): boolean;
}

declare module 'node:path' {
  export function join(...partes: string[]): string;
  export function resolve(...partes: string[]): string;
}

declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};
