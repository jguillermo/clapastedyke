import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { LocalData } from '../../../_common/local-data/local-data';
import { Logger } from '../../../_common/logger/logger';
import { AuthEvents } from '../../domain/events/auth-events';
import { SessionHintRepository } from '../../domain/repositories/session-hint.repository';
import { SessionTokenRepository } from '../../domain/repositories/session-token.repository';
import { Authenticator } from '../../domain/services/authenticator';
import { Session } from '../../domain/services/session';

/** Lo que se le dice a quien pulsó el botón cuando no hay forma de cerrar la sesión de verdad. */
const OFFLINE_MESSAGE =
  'No se puede cerrar sesión sin conexión: hay que avisar al servidor para que la olvide, ' +
  'y cerrar aquí borra todos los datos de este dispositivo sin vuelta atrás. ' +
  'Inténtalo cuando vuelvas a tener internet.';

/**
 * Cierra la sesión de **este** navegador y deja el aparato **como recién instalado**.
 *
 * ## Qué se cierra, y qué no
 *
 * Muere la sesión de este navegador y nada más. Los demás dispositivos de esa persona siguen dentro,
 * y en el proveedor no se retira ninguna autorización: eso lo hace ella desde su cuenta de Google, y
 * ni siquiera se podría acotar a un dispositivo (revocar tumba la concesión entera).
 *
 * ## Sin conexión no se cierra, y no es una limitación técnica
 *
 * Es la consecuencia de lo de abajo: esto **borra todo lo local**, y borrar sin poder avisar al
 * servidor dejaría lo peor de los dos mundos — el usuario sin sus datos y la sesión viva al otro
 * lado. Así que si no se puede avisar, no se toca nada y se lo decimos.
 *
 * ## Salir borra TODO lo local, no solo la sesión
 *
 * Se vacía el almacenamiento entero del navegador (ver {@link LocalData}): recetario, insumos, cola
 * de sincronización, base de comparación con la hoja, enlace a la hoja, marcador de siembra y cola de
 * eventos. Cerrar sesión es «este aparato vuelve a ser de nadie», y media limpieza es peor que
 * ninguna: la siguiente persona que lo abra vería recetas ajenas y, en cuanto conectara su cuenta,
 * se le subirían a *su* hoja.
 *
 * **Nada de eso se pierde para su dueño**: lo que estuviera sincronizado sigue en su hoja de Drive y
 * baja de vuelta al conectar otra vez. Lo que no llegó a subir sí se pierde — por eso quien pregunta
 * («¿seguro?») es la pantalla de cuenta, que es la que sabe cuántos cambios quedaban en la cola.
 *
 * El recetario de ejemplo vuelve solo en el siguiente arranque: al borrarse el marcador de siembra,
 * `RecipeBookSeed` se vuelve a aplicar.
 *
 * ## Primero se pierde la conexión, después se borra
 *
 * El orden no es de estilo: es lo que impide que cerrar sesión **destruya la hoja del usuario**.
 * Mientras haya sesión, la sincronización puede arrancar en cualquier momento; un ciclo que leyera
 * la base local ya vaciada no concluiría «no hay nada que subir», concluiría que el usuario ha
 * borrado su recetario entero, y escribiría esas bajas en la hoja. Por eso `session.close()` va
 * **antes** de tocar nada local: cerrar quita la credencial (el ciclo se niega a arrancar) y cambia
 * el número de sesión (lo que ya estuviera en vuelo tira su resultado al volver).
 *
 * ## Por qué se borra ANTES de publicar
 *
 * El evento anuncia un hecho consumado, así que lo que cuenta ya tiene que ser cierto. Y al revés
 * sería directamente incorrecto: publicar deja el evento **en la cola**, que vive en IndexedDB, y el
 * borrado se lo llevaría por delante sin que nadie llegara a recibirlo.
 */
@Injectable({ providedIn: 'root' })
export class SignOut extends UseCase<void, void> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly hints = inject(SessionHintRepository);
  private readonly sessionTokens = inject(SessionTokenRepository);
  private readonly local = inject(LocalData);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('auth/sign-out');

  async execute(): Promise<void> {
    const { account } = this.session.snapshot();
    if (!account) {
      // No había de quién cerrar, pero puede quedar rastro con el que la próxima carga intentaría
      // reanudar una sesión que ya no existe.
      await this.forgetHowToComeBack();
      this.log.debug('no había sesión abierta, solo se limpia el rastro');
      return;
    }
    this.log.debug('cerrando sesión', { accountId: account.id.value });

    if ((await this.authenticator.closeRemoteSession()) === 'unreachable') {
      this.log.debug('sin conexión: no se cierra nada, los datos se quedan donde están');
      throw new Error(OFFLINE_MESSAGE);
    }

    await this.forgetHowToComeBack();

    this.session.close();
    const { epoch } = this.session.snapshot();
    this.log.debug('sesión cerrada, ya no puede sincronizar nada', {
      accountId: account.id.value,
      epoch,
    });

    await this.wipeEverything(account.id.value);

    await this.bus.publish([AuthEvents.signOutSucceeded(account.id.value, epoch)]);
  }

  /** Las dos cosas con las que este navegador podría volver a entrar solo. */
  private async forgetHowToComeBack(): Promise<void> {
    await this.hints.clear();
    await this.sessionTokens.clear();
  }

  /**
   * Sin relanzar: la sesión ya está cerrada y devolver un error aquí haría creer que sigue abierta.
   * Se registra una sola vez, con la cadena entera.
   */
  private async wipeEverything(accountId: string): Promise<void> {
    try {
      await this.local.wipe();
      this.log.debug('datos locales borrados', { accountId });
    } catch (error) {
      this.log.error('no se han podido borrar los datos locales al cerrar sesión', error, {
        accountId,
      });
    }
  }
}
