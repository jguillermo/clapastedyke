/**
 * Apertura y versionado de la base de datos del navegador (IndexedDB).
 * Un object store por agregado + 'contadores' para las secuencias de ids.
 * Las etapas siguientes (ventas, inventario, configuración) añaden almacenes
 * subiendo VERSION y extendiendo la migración — nunca se borran datos.
 */

export const NOMBRE_BD = 'negocio-costeo';
export const VERSION_BD = 4;

/** Almacenes por versión: el versionado solo AÑADE, nunca borra datos. */
const ALMACENES_V1 = ['clientes', 'proveedores', 'insumos', 'recetas', 'reglas_empaque'] as const;
const ALMACENES_V2 = ['configuracion'] as const;
const ALMACENES_V3 = ['presupuestos'] as const;
const ALMACENES_V4 = ['pedidos', 'ventas', 'compras', 'movimientos'] as const;

export type NombreAlmacen =
  | (typeof ALMACENES_V1)[number]
  | (typeof ALMACENES_V2)[number]
  | (typeof ALMACENES_V3)[number]
  | (typeof ALMACENES_V4)[number]
  | 'contadores';

let conexion: Promise<IDBDatabase> | null = null;

export function abrirBaseDatos(): Promise<IDBDatabase> {
  conexion ??= new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);

    solicitud.onupgradeneeded = () => {
      const bd = solicitud.result;
      for (const nombre of [...ALMACENES_V1, ...ALMACENES_V2, ...ALMACENES_V3, ...ALMACENES_V4]) {
        if (!bd.objectStoreNames.contains(nombre)) {
          bd.createObjectStore(nombre, { keyPath: 'id' });
        }
      }
      if (!bd.objectStoreNames.contains('contadores')) {
        bd.createObjectStore('contadores', { keyPath: 'prefijo' });
      }
    };

    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error ?? new Error('No se pudo abrir IndexedDB.'));
  });
  return conexion;
}

/** Solo para tests: olvida la conexión cacheada. */
export function reiniciarConexionParaTests(): void {
  conexion = null;
}

/** Promisifica una IDBRequest. */
export function pedir<T>(solicitud: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rechazar) => {
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error ?? new Error('Operación IndexedDB falló.'));
  });
}
