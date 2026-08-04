import { inject, Injectable } from '@angular/core';
import {
  CredentialsProvider,
  UserCredentials,
} from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { ResumeSession } from '../application/use-cases/resume-session.use-case';
import { Session } from '../domain/services/session';

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

    if (!snapshot.account) {
      // Quien pregunta solo ve `null` y lo trata como «desconectado». Distinguir POR QUÉ es la
      // diferencia entre «no ha entrado» y «se le caducó el token», que se arreglan distinto.
      this.log.debug('sin sesión abierta');
      return null;
    }

    this.log.debug('credencial caducada, se intenta renovar sin molestar al usuario', {
      accountId: snapshot.account.id.value,
    });
    await this.resume.execute();

    const renewed = this.session.snapshot();
    if (!renewed.account || !renewed.credential || renewed.credential.isExpired(Date.now())) {
      this.log.debug('no se pudo renovar: hará falta volver a conectar a mano');
      return null;
    }
    return { account: renewed.account, credential: renewed.credential, epoch: renewed.epoch };
  }
}
