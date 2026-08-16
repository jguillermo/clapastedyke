import { SyncTarget } from '../value-objects/sync-target';
import { CredentialRequest, ProbeOutcome, ProbeRequest, TargetRequest } from './sync.gateway.types';

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

  /**
   * El destino que **esta aplicación ya creó** para esta cuenta, si lo hay. `null` si no hay ninguno.
   *
   * Es lo que evita una copia por dispositivo. Quién tiene qué destino se recuerda en local, y lo local
   * es por navegador: un móvil nuevo, otro navegador o unos datos del sitio borrados llegan sin saber
   * nada, y sin esta pregunta crearían **otra** copia en la misma cuenta. Preguntarlo al destino es lo
   * único que da una respuesta que no dependa del dispositivo.
   *
   * No hace falta ningún permiso extra: se busca **entre lo que la propia app creó**, que es justo el
   * alcance que el usuario concedió.
   */
  abstract locate(request: CredentialRequest): Promise<SyncTarget | null>;

  /**
   * `true` si el destino sigue estando. Se pregunta antes de dar por buena una hoja recordada: una que
   * el usuario tiró a la papelera sigue respondiendo, y escribir en ella es tirar los datos a un sitio
   * que él ya dio por borrado.
   */
  abstract exists(request: TargetRequest): Promise<boolean>;

  /**
   * Escribe el dato de prueba en el destino y **lo vuelve a leer de allí**, devolviendo lo leído.
   *
   * Es la única forma de saber que la cadena entera funciona *antes* de mandar nada del usuario: que
   * el destino exista no prueba que se pueda escribir en él, y que una escritura no dé error no
   * prueba que lo escrito esté. Quien llama compara lo leído con lo que mandó.
   */
  abstract probe(request: ProbeRequest): Promise<ProbeOutcome>;
}
