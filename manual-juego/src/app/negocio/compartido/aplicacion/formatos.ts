/**
 * Formatos de presentación que entrega el NEGOCIO (la vista nunca formatea):
 * los DTOs de los casos de uso salen listos para pintar.
 */

/** '03/06/2026' (es-PE). */
export function formatoFecha(iso: string | Date | null): string {
  if (!iso) return '—';
  const fecha = typeof iso === 'string' ? new Date(iso) : iso;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** 'lunes 01 jun 2026' (es-PE) — la cabecera del Resumen. */
export function formatoFechaLarga(fecha: Date = new Date()): string {
  const texto = fecha.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return texto.replace(/\./g, '').replace(/ de /g, ' ');
}
