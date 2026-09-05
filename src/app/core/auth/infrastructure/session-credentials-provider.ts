import { inject, Injectable } from '@angular/core';
import {
  CredentialsProvider,
  UserCredentials,
} from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { ResumeSession } from '../application/use-cases/resume-session.use-case';
import { phaseOf, Session, SessionPhase } from '../domain/services/session';

/** Por qué se está pidiendo una reanudación. Cada situación se arregla de una forma distinta. */
const WHY_RESUMING: Readonly<Record<SessionPhase, string>> = {
  disconnected: 'sin sesión en memoria, se intenta reanudar la de este navegador',
  offline: 'sesión conocida pero sin autorización, se intenta recuperarla',
  active: 'credencial caducada, se intenta renovar sin molestar al usuario',
};

/**
 * Adaptador de salida de `auth` hacia el contrato `CredentialsProvider` del shared kernel.
 *
 * Es lo que permite que otro contexto actúe en nombre del usuario **sin conocer este**: entrega los
 * primitivos justos (credencial, número de sesión, id y correo) y nunca la sesión ni sus value
 * objects.
 *
 * ## Una credencial caducada se renueva, no se convierte en «no hay sesión»
 *
 * El token de Google dura una hora. Antes, pasada esa hora, esto devolvía `null` y todo lo que
 * dependiera de él se comportaba como si el usuario hubiera cerrado sesión: la sincronización paraba
 * y la persona no se enteraba hasta mirar la pantalla de cuenta. Pero la sesión no había muerto —
 * solo el token—, y el proveedor sabe emitir otro sin molestar a nadie.
 *
 * Así que aquí se intenta la renovación, **una vez y compartida** (de eso responde `ResumeSession`), y
 * solo se devuelve `null` si tampoco eso funciona. Ahí sí es cierto: hace falta volver a conectar.
 *
 * ## «No hay sesión en memoria» tampoco es «no hay sesión»
 *
 * En un arranque en frío la credencial vive **solo en memoria**, así que a los pocos milisegundos de
 * bootstrap no hay ninguna: la reanudación es un app-initializer que corre **sin que nadie la espere**
 * (`void inject(ResumeSession).execute()`, deliberado para que la app no se bloquee ante Google). Si
 * este puerto contestara `null` en cuanto el snapshot viene vacío, todo el que preguntara al arrancar
 * concluiría «desconectado» **en cada carga**, y ~300 ms después aparecería una sesión que ya nadie
 * mira.
 *
 * Para la sincronización eso no es un detalle cosmético: quien decide al arrancar si hay que **bajar
 * antes de subir** preguntaría aquí, oiría «desconectado», arrancaría en local-only y luego subiría
 * datos viejos encima de una hoja más fresca. La pérdida es real y silenciosa.
 *
 * Por eso los dos casos —sin sesión y con credencial caducada— hacen **lo mismo**: esperar a
 * `ResumeSession` y volver a leer. Sale gratis para un usuario anónimo, porque `ResumeSession` vuelve
 * enseguida cuando este navegador no tiene pista de nadie («no hay pista: nadie había entrado»), y es
 * single-flight, así que N preguntas concurrentes al arrancar comparten un único intento.
 *
 * > **Por qué un adaptador llama a un caso de uso.** Es la única flecha de este contexto que apunta
 * > de infraestructura hacia aplicación, y es deliberada: la promesa del puerto es «las credenciales
 * > de la sesión activa», y mantenerla viva es parte de esa promesa, no del trabajo de quien la
 * > consume. La alternativa era duplicar aquí el flujo de reanudación entero — dos sitios que
 * > divergen, y un segundo dueño para el mismo fallo.
 */
@Injectable()
export class SessionCredentialsProvider extends CredentialsProvider {
  private readonly session = inject(Session);
  private readonly resume = inject(ResumeSession);
  private readonly log = inject(Logger).scoped('auth/credentials');

  async current(): Promise<UserCredentials | null> {
    const usable = await this.usableSession();
    if (!usable) {
      return null;
    }

    const { account, credential, epoch } = usable;
    this.log.debug('credencial vigente', { accountId: account.id.value, epoch });
    return {
      token: credential.token,
      epoch,
      accountId: account.id.value,
      accountEmail: account.email,
    };
  }

  /**
   * La sesión, ya con una credencial que sirve. `null` cuando no hay forma de tenerla.
   *
   * Se relee el estado después de renovar en lugar de usar lo que devuelva la renovación: entre las
   * dos cosas ha habido un `await`, y en ese hueco el usuario puede haber cerrado sesión o entrado
   * con otra cuenta. Lo único cierto es lo que hay ahora.
   */
  private async usableSession(): Promise<{
    account: NonNullable<ReturnType<Session['snapshot']>['account']>;
    credential: NonNullable<ReturnType<Session['snapshot']>['credential']>;
    epoch: number;
  } | null> {
    const snapshot = this.session.snapshot();
    if (snapshot.account && snapshot.credential && !snapshot.credential.isExpired(Date.now())) {
      return { account: snapshot.account, credential: snapshot.credential, epoch: snapshot.epoch };
    }

    // Quien pregunta solo ve `null` y lo trata como «desconectado». Distinguir POR QUÉ es la
    // diferencia entre «no ha entrado», «se quedó sin cobertura» y «se le caducó el token».
    this.log.debug(WHY_RESUMING[phaseOf(snapshot)]);
    await this.resume.execute();

    const renewed = this.session.snapshot();
    if (!renewed.account || !renewed.credential || renewed.credential.isExpired(Date.now())) {
      this.log.debug('sin credencial utilizable: hará falta conectar a mano');
      return null;
    }
    return { account: renewed.account, credential: renewed.credential, epoch: renewed.epoch };
  }
}
