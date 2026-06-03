/**
 * Presentation formats provided by the BUSINESS layer (views never format):
 * use case DTOs come out ready to paint.
 */

/** '03/06/2026' (es-PE). */
export function formatDate(iso: string | Date | null): string {
  if (!iso) return '—';
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** 'lunes 01 jun 2026' / 'Monday, Jun 01, 2026' — the dashboard header. */
export function formatLongDate(date: Date = new Date(), language: 'es' | 'en' = 'es'): string {
  const locale = language === 'en' ? 'en-US' : 'es-PE';
  const text = date.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return text.replace(/\./g, '').replace(/ de /g, ' ');
}
