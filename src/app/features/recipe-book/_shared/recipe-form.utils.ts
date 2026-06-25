import { MeasureInput } from '@core/recipe-book/domain/value-objects/measure-input';

/** Une defaults + usados, deduplicando sin distinguir mayúsculas (gana el primero). */
export function union(defaults: readonly string[], used?: readonly string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of [...defaults, ...(used ?? [])]) {
    const normalized = value.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.set(normalized, value);
    }
  }
  return [...seen.values()];
}

/** Mensaje legible de un error desconocido, listo para pintar. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.';
}

// --- Validaciones por tipo (reglas del dominio), pasadas al SelectTag ---

export function validateMass(value: string): string | null {
  return MeasureInput.parse(value, 'mass').isValid ? null : 'Escribe un peso válido (ej. 1 kg o 400 g).';
}

export function validateServings(value: string): string | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? null : 'Las porciones deben ser un número entero positivo.';
}

export function validateLabel(value: string): string | null {
  return value.trim() ? null : 'Escribe un valor.';
}

export function validateNumber(value: string): string | null {
  return Number.isFinite(Number(value)) && value.trim() !== '' ? null : 'Escribe un número.';
}

/** Validación de un valor según el tipo de propiedad (para el SelectTag dinámico). */
export function validateForType(type: 'text' | 'number' | 'weight'): (value: string) => string | null {
  if (type === 'weight') return validateMass;
  if (type === 'number') return validateNumber;
  return validateLabel;
}
