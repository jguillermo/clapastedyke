import { TargetRequest } from './sync.gateway.types';
import { RemoteSnapshot } from './sync-reader.types';

/**
 * Leer el destino entero.
 *
 * ## Por qué es un puerto aparte y no un método más de `SyncGateway`
 *
 * `SyncGateway` responde de **escribir la copia del usuario**: crearla, comprobar que sigue ahí,
 * mandarle datos y probar que la escritura llega. Leer es la otra mitad, y con ella el destino deja de
 * ser un espejo para convertirse en **la fuente de la verdad** — un cambio de papel, no un método más.
 *
 * Separarlos deja además un sitio donde ese cambio se ve: hay código que solo lee (el diagnóstico, el
 * arranque) y le viene bien no poder escribir ni por accidente.
 *
 * ## El puerto no sabe qué hay al otro lado
 *
 * Ni hoja de cálculo, ni pestañas, ni celdas de Google: **tablas con filas**. Qué tablas hay y en qué
 * columnas van sus campos es cosa del adaptador. Cambiar de destino sigue siendo escribir otro
 * adaptador y tocar una línea de `external-sync.providers.ts`.
 *
 * ## Dos exigencias que el adaptador NO puede relajar
 *
 * 1. **Los valores, sin formatear.** Si el destino aplica el formato de la celda y la configuración
 *    regional de quien la creó, un precio puede volver como `2,50` o como `1.234,56` según el idioma
 *    de la hoja, y la huella dependería del país del usuario. Ver `sheet-canonical.ts`.
 * 2. **Ninguna fila se descarta**, ni las que vengan en blanco. El índice de fila es la única forma de
 *    volver a escribir esa misma fila, y se desplaza en cuanto se salta una.
 */
export abstract class SyncReader {
  abstract read(request: TargetRequest): Promise<RemoteSnapshot>;
}
