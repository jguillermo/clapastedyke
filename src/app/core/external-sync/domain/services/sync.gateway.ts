import { SyncTarget } from '../value-objects/sync-target';
import {
  OpenRequest,
  ProbeOutcome,
  ProbeRequest,
  SyncOutcome,
  SyncRequest,
} from './sync.gateway.types';

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

  /**
   * Se asegura de que el destino exista y dice dónde está, sin mandar ningún dato.
   *
   * Existe para que conectar una cuenta pueda contarse por pasos: «preparar dónde se va a guardar»
   * es una operación con su propio resultado visible (la dirección de la copia) y su propio fallo
   * —el permiso, la cuota— que nada tiene que ver con las filas que se manden después.
   *
   * Idempotente: llamarlo dos veces no crea dos destinos.
   */
  abstract open(request: OpenRequest): Promise<SyncTarget>;

  /**
   * Escribe el dato de prueba en el destino y **lo vuelve a leer de allí**, devolviendo lo leído.
   *
   * Es la única forma de saber que la cadena entera funciona *antes* de mandar nada del usuario: que
   * el destino exista no prueba que se pueda escribir en él, y que una escritura no dé error no
   * prueba que lo escrito esté. Quien llama compara lo leído con lo que mandó.
   */
  abstract probe(request: ProbeRequest): Promise<ProbeOutcome>;
}
