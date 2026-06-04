/**
 * Funciones del juego que la progresión puede encender (lo que se desbloquea).
 * Fuente de verdad: .claude/doc/plan_de_negocio.md §4.1.
 */
export enum Feature {
  KITCHEN = 'KITCHEN', // cocina de casa (activa desde el inicio)
  SOCIAL = 'SOCIAL', // producción para redes
  CUSTOMERS = 'CUSTOMERS', // módulo de clientes
  ORDERS = 'ORDERS', // pedidos
  PHYSICAL_STORE = 'PHYSICAL_STORE', // tienda física → pueblo
  QUOTING = 'QUOTING', // presupuestos con costo y margen
  TAX = 'TAX', // IGV / formalización
  SUPPLIERS = 'SUPPLIERS', // proveedores y compra formal
  OPERATING_COSTS = 'OPERATING_COSTS', // costos operativos
  SPOILAGE = 'SPOILAGE', // mermas y deterioro
  PACKAGING_RULES = 'PACKAGING_RULES', // reglas de empaque
  ADVANCED_ORDERS = 'ADVANCED_ORDERS', // pedidos avanzados
  EQUIPMENT = 'EQUIPMENT', // equipamiento / producción masiva
  EMPLOYEES = 'EMPLOYEES', // empleados
  DELIVERY = 'DELIVERY', // delivery
  MARKETING = 'MARKETING', // marketing
  FINANCE = 'FINANCE', // finanzas
  BRANCHES = 'BRANCHES', // sucursales
}

/** Funciones activas al empezar la partida (Fase 1, sin desbloquear nada). */
export const INITIAL_FEATURES: readonly Feature[] = [Feature.KITCHEN];
