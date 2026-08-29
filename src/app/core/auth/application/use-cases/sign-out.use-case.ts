import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { LocalData } from '../../../_common/local-data/local-data';
import { Logger } from '../../../_common/logger/logger';
import { AuthEvents } from '../../domain/events/auth-events';
import { SessionHintRepository } from '../../domain/repositories/session-hint.repository';
import { Authenticator } from '../../domain/services/authenticator';
import { Session } from '../../domain/services/session';

/**
 * Cierra la sesión y deja el navegador **como recién instalado**.
 *
 * **La sesión local se cierra pase lo que pase.** Si falla retirar la autorización en el proveedor
 * (típicamente, sin red), no se deja al usuario atrapado en su cuenta: se cierra igual y se publica
 * `SignOutFailed` en vez de `SignOutSucceeded`. Por eso quien limpie estado al salir tiene que
 * escuchar los dos eventos.
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
 * **antes** de tocar nada local —y antes incluso de retirar la autorización, que es red y tarda—:
 * cerrar quita la credencial (el ciclo se niega a arrancar) y cambia el número de sesión (lo que ya
 * estuviera en vuelo tira su resultado al volver).
 *
 * ## Por qué se borra ANTES de publicar
 *
 * El evento anuncia un hecho consumado, así que lo que cuenta ya tiene que ser cierto. Y al revés
 * sería directamente incorrecto: publicar deja el evento **en la cola**, que vive en IndexedDB, y el
 * borrado se lo llevaría por delante sin que nadie llegara a recibirlo.
 *
 * ## Las credenciales no se borran aquí porque nunca estuvieron aquí
 *
 * El token vive solo en memoria y muere con `session.close()`. El permiso duradero lo custodia el
 * backend, y `revoke` es lo que lo retira **y** vacía la cookie `HttpOnly` de este navegador: sin
 * ella, la próxima carga no tiene con qué reanudar y hay que volver a autorizar desde cero.
 */
@Injectable({ providedIn: 'root' })
export class SignOut extends UseCase<void, void> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly hints = inject(SessionHintRepository);
  private readonly local = inject(LocalData);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('auth/sign-out');

  async execute(): Promise<void> {
    const { account, credential } = this.session.snapshot();
    if (!account) {
      this.log.debug('no había sesión abierta, no se hace nada');
      return;
    }
    this.log.debug('cerrando sesión', { accountId: account.id.value, conCredencial: !!credential });

    // 1 · La pista, antes que nada: si sobreviviera a un fallo a mitad de camino, la próxima carga
    //     volvería a entrar sola y cerrar sesión no habría servido de nada.
    await this.hints.clear();

    // 2 · Se pierde la conexión AQUÍ, y todavía no se ha tocado ni un dato local. El orden es la
    //     salvaguarda del paso 4: mientras haya sesión, la sincronización puede correr, y un ciclo
    //     que leyera la base ya vaciada no vería «no hay nada que subir» — vería que **se ha
    //     borrado todo**, y escribiría esa matanza en la hoja del usuario.
    //
    //     Cerrar es instantáneo y hace dos cosas a la vez: deja de haber credencial (el ciclo se
    //     niega a arrancar) y cambia el número de sesión (lo que ya estuviera en vuelo descarta su
    //     resultado al volver). Por eso va antes de retirar la autorización, que es una llamada de
    //     red y podría tardar: durante esa espera ya no queda nada que pueda sincronizar.
    this.session.close();
    const { epoch } = this.session.snapshot();
    this.log.debug('sesión cerrada, ya no puede sincronizar nada', {
      accountId: account.id.value,
      epoch,
    });

    // 3 · Retirar la autorización en el proveedor. Con esto se va también la cookie con la que este
    //     navegador podía pedir tokens: sin ella, volver a entrar exige autorizar desde cero.
    let failure: string | null = null;
    if (credential) {
      try {
        await this.authenticator.revoke(credential);
        this.log.debug('autorización retirada en el proveedor');
      } catch (error) {
        failure = error instanceof Error ? error.message : 'Motivo desconocido.';
        // Nadie más va a contar esto: no se relanza (la sesión local ya está cerrada) y el usuario
        // se cree desconectado del todo cuando el proveedor aún tiene la autorización.
        this.log.warn(
          'no se pudo retirar la autorización: la sesión local se cierra igual',
          error,
          {
            accountId: account.id.value,
          },
        );
      }
    }

    // 4 · Y solo ahora, sin sesión y sin nadie que pueda sincronizar, se borra lo local.
    try {
      await this.local.wipe();
    } catch (error) {
      // No se relanza: la sesión ya está cerrada y devolver un error aquí haría creer que sigue
      // abierta. Se registra una sola vez, con la cadena entera — el adaptador solo traduce.
      this.log.error('no se han podido borrar los datos locales al cerrar sesión', error, {
        accountId: account.id.value,
      });
    }
    this.log.debug('cierre de sesión completado', {
      accountId: account.id.value,
      epoch,
      revocada: !failure,
    });

    await this.bus.publish([
      failure === null
        ? AuthEvents.signOutSucceeded(account.id.value, epoch)
        : AuthEvents.signOutFailed(account.id.value, epoch, failure),
    ]);
  }
}
