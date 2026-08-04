import { SyncSetup } from './sync-setup.types';

/**
 * De dónde salen los datos que hay que llevarse para **poner en marcha el destino**: el código que
 * pegar, el manifiesto, el identificador que autorizar y la dirección donde quedó.
 *
 * Es un puerto aparte de {@link SyncGateway} a propósito. El gateway habla con un destino que **ya
 * existe**; esto es lo de antes: lo que hay que hacer una vez, a mano, para que exista. Son dos
 * conversaciones distintas y con dueños distintos —una la tiene la app con el destino, la otra la
 * tiene una persona con la consola de su proveedor—, y meterlas en el mismo puerto obligaría a
 * cualquier destino futuro a implementar la ceremonia de puesta en marcha del actual.
 *
 * El puerto **no sabe qué destino es**: entrega textos con una identidad, y la pantalla los coloca en
 * su paso. Aquí no aparecen ni Google, ni Apps Script, ni una URL.
 */
export abstract class SyncSetupSource {
  /** Nunca lanza: lo que no se pueda resolver viene vacío, que es una información en sí misma. */
  abstract read(): Promise<SyncSetup>;
}
