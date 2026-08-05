import { SyncTarget } from '../value-objects/sync-target';
import {
  CredentialRequest,
  MigrateRequest,
  ProbeOutcome,
  ProbeRequest,
  SyncOutcome,
  SyncRequest,
  TargetRequest,
} from './sync.gateway.types';

/**
 * Escribe la copia del usuario donde el usuario la tiene.
 *
 * El puerto **no sabe qué hay al otro lado**. No aparece aquí ninguna URL, ningún formato de
 * transporte y ninguna tecnología: entra una credencial, un destino y un lote, y sale cuántas filas
 * quedaron aplicadas. Esa es toda la conversación.
 *
 * Es un **servicio**, no un repositorio: no lee ni escribe agregados de este contexto, coordina una
 * operación remota.
 *
 * El contrato es idempotente por construcción: mandar dos veces el mismo `SyncBatch` deja el destino
 * igual que mandarlo una.
 */
export abstract class SyncGateway {
  /**
   * Crea el destino del usuario, listo para recibir datos. Devuelve dónde quedó.
   *
   * No comprueba si ya existía otro parecido — para eso está el repositorio, que recuerda el de cada
   * cuenta. Llamarlo dos veces crea dos destinos, y eso es responsabilidad de quien orquesta.
   */
  abstract create(request: CredentialRequest): Promise<SyncTarget>;

  /** `true` si el destino sigue estando donde se dejó. `false` si lo borraron o está en la papelera. */
  abstract exists(request: TargetRequest): Promise<boolean>;

  abstract send(request: SyncRequest): Promise<SyncOutcome>;

  /**
   * Pone la **forma** del destino al día con la del esquema actual, sin tocar ningún dato.
   *
   * Existe porque un destino escrito por una versión anterior de la app le falta la forma que la
   * versión de ahora espera —columnas de servicio, rótulos— y escribir sin arreglarla antes dejaría
   * columnas nuevas debajo de celdas en blanco: el usuario vería aparecer columnas sin nombre.
   *
   * Recibe lo que ya se leyó para no volver a leerlo, y es **idempotente**: con un destino al día no
   * hace nada y no cuesta ninguna llamada.
   */
  abstract migrate(request: MigrateRequest): Promise<void>;

  /**
   * Escribe el dato de prueba en el destino y **lo vuelve a leer de allí**, devolviendo lo leído.
   *
   * Es la única forma de saber que la cadena entera funciona *antes* de mandar nada del usuario: que
   * el destino exista no prueba que se pueda escribir en él, y que una escritura no dé error no
   * prueba que lo escrito esté. Quien llama compara lo leído con lo que mandó.
   */
  abstract probe(request: ProbeRequest): Promise<ProbeOutcome>;
}
