/**
 * Evento de dominio: un hecho del negocio que ya ocurrió (nombre en pasado).
 * Inmutable. Los agregados los acumulan y los casos de uso los publican
 * tras persistir.
 */
export interface EventoDominio {
  /** Nombre del hecho, en pasado: 'ClienteCreado', 'PresupuestoAprobado'… */
  readonly nombre: string;
  /** Id del agregado que lo generó. */
  readonly agregadoId: string;
  readonly ocurridoEn: Date;
  /** Datos relevantes para los suscriptores (primitivos). */
  readonly datos: Readonly<Record<string, unknown>>;
}

export function eventoDominio(
  nombre: string,
  agregadoId: string,
  datos: Record<string, unknown> = {},
): EventoDominio {
  return Object.freeze({ nombre, agregadoId, ocurridoEn: new Date(), datos: Object.freeze({ ...datos }) });
}
