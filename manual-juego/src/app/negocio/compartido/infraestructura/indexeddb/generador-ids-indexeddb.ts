import { GeneradorIds, IdEntidad, PrefijoId } from '../../dominio/id-entidad';
import { abrirBaseDatos, pedir } from './base-datos';

interface FilaContador {
  prefijo: string;
  ultimo: number;
}

/**
 * Secuencias de identidad persistentes (CL-0001, P-0042…), equivalentes a
 * siguienteId() de src/Util.js. El incremento ocurre dentro de una única
 * transacción readwrite del almacén 'contadores': dos llamadas concurrentes
 * no pueden devolver el mismo número.
 */
export class GeneradorIdsIndexedDb implements GeneradorIds {
  async siguiente(prefijo: PrefijoId): Promise<IdEntidad> {
    const bd = await abrirBaseDatos();
    const tx = bd.transaction('contadores', 'readwrite');
    const almacen = tx.objectStore('contadores');

    const fila = await pedir<FilaContador | undefined>(almacen.get(prefijo));
    const siguiente = (fila?.ultimo ?? 0) + 1;
    await pedir(almacen.put({ prefijo, ultimo: siguiente } satisfies FilaContador));

    return IdEntidad.crear(prefijo, siguiente);
  }
}
