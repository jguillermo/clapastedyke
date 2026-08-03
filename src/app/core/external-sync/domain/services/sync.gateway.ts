import { SyncOutcome, SyncRequest } from './sync.gateway.types';

/**
 * Envía un lote del recetario al destino donde el usuario guarda su copia.
 *
 * El puerto **no sabe qué hay al otro lado**. No aparece aquí ninguna URL, ningún formato de
 * transporte y ninguna tecnología: entra un lote con una credencial y sale dónde quedó guardado.
 * Esa es toda la conversación. La implementación concreta —con su destino, su formato y su
 * configuración— vive entera en `infrastructure/`.
 *
 * Es un **servicio**, no un repositorio: no lee ni escribe agregados de este contexto, coordina una
 * operación remota (el destino decide dónde guardar, lo crea si falta y aplica el upsert).
 *
 * El contrato es idempotente por construcción: mandar dos veces el mismo `SyncBatch` deja el destino
 * igual que mandarlo una.
 */
export abstract class SyncGateway {
  abstract send(request: SyncRequest): Promise<SyncOutcome>;
}
