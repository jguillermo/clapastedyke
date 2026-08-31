import { inject, Injectable, Provider } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { EventBus, EventHandler } from '@core/_common/eventbus/event-bus';
import { LocalData } from '@core/_common/local-data/local-data';
import { ConsoleLogger } from '@core/_common/logger/console-logger';
import { Logger } from '@core/_common/logger/logger';
import { AuthSettingsRepository } from '../domain/repositories/auth-settings.repository';
import { SessionHint, SessionHintRepository } from '../domain/repositories/session-hint.repository';
import { Account } from '../domain/entities/account';
import { Authentication, Authenticator } from '../domain/services/authenticator';
import { Session } from '../domain/services/session';
import { Credential } from '../domain/value-objects/credential';
import { InMemorySession } from '../infrastructure/in-memory-session';

/**
 * Los dobles del contexto `auth`.
 *
 * El **logger es el adaptador real**, no un doble: los casos de uso inyectan `Logger`, así que un
 * `TestBed` que los instancie sin él revienta con `NullInjectorError`. Escribe solo cuando lo llaman,
 * y en tests `LOG_DEBUG` vale `false`, así que la traza no ensucia la salida.
 *
 * La **sesión también es la real** (`InMemorySession`): ya es una implementación en memoria, y
 * doblarla solo añadiría una mentira que mantener.
 */

/** Proveedor de identidad falso. Distingue entrar (interactivo) de reanudar (silencioso). */
@Injectable()
export class FakeAuthenticator extends Authenticator {
  /** `false` simula que no hay sesión en el proveedor o que hace falta consentir otra vez. */
  canResume = true;
  interactiveCalls = 0;
  resumeCalls = 0;
  revoked: Credential[] = [];
  failWith: Error | null = null;

  async authenticate(): Promise<Authentication> {
    this.interactiveCalls += 1;
    if (this.failWith) {
      throw this.failWith;
    }
    return this.authentication();
  }

  async resume(): Promise<Authentication | null> {
    this.resumeCalls += 1;
    return this.canResume ? this.authentication() : null;
  }

  async revoke(credential: Credential): Promise<void> {
    this.revoked.push(credential);
  }

  /**
   * La credencial se emite **desde ahora**, no desde el epoch 0: una nacida en 1970 llega caducada,
   * y entonces todo el que la pidiera intentaría renovarla en bucle. Los tests que quieren una
   * caducada la construyen ellos.
   */
  private authentication(): Authentication {
    return {
      account: Account.of('cuenta-1', 'chef@example.test', 'Chef', null),
      credential: Credential.of(
        't-1',
        3600,
        ['https://www.googleapis.com/auth/drive.file'],
        Date.now(),
      ),
    };
  }
}

/**
 * Ajustes falsos: por defecto el despliegue está completo (identificador de cliente y dirección del
 * servicio de sesión), que es el caso normal. Poner cualquiera de los dos a `null` ejercita la rama
 * de «este despliegue no puede autenticar a nadie».
 */
@Injectable()
export class FakeAuthSettingsRepository extends AuthSettingsRepository {
  configured: string | null = '123-abc.apps.googleusercontent.com';
  apiUrl: string | null = 'https://auth.example.test';

  async clientId(): Promise<string | null> {
    return this.configured;
  }

  async authApiUrl(): Promise<string | null> {
    return this.apiUrl;
  }
}

/** La pista de sesión, en memoria. `failOnRead` fuerza la rama de «esto no puede tumbar el arranque». */
@Injectable()
export class FakeSessionHintRepository extends SessionHintRepository {
  private hint: SessionHint | null = null;
  failOnRead: Error | null = null;

  async read(): Promise<SessionHint | null> {
    if (this.failOnRead) {
      throw this.failOnRead;
    }
    return this.hint;
  }

  async save(hint: SessionHint): Promise<void> {
    this.hint = hint;
  }

  async clear(): Promise<void> {
    this.hint = null;
  }

  /** Para asertar que cerrar sesión no deja rastro con el que volver a entrar solo. */
  stored(): SessionHint | null {
    return this.hint;
  }
}

/** El borrado local, contado: lo que importa es si se pidió, y `failWith` cubre que no tumbe la salida. */
@Injectable()
export class FakeLocalData extends LocalData {
  private readonly session = inject(Session);

  wipes = 0;
  failWith: Error | null = null;

  /**
   * Si todavía había sesión abierta cuando se pidió el borrado. **Tiene que ser `false`**: borrar con
   * la sesión viva deja que un ciclo de sincronización lea la base ya vacía y suba esa matanza a la
   * hoja del usuario. `null` mientras no se haya borrado nada.
   */
  sessionOpenAtWipe: boolean | null = null;

  async wipe(): Promise<void> {
    this.wipes += 1;
    this.sessionOpenAtWipe = this.session.snapshot().account !== null;
    if (this.failWith) {
      throw this.failWith;
    }
  }
}

/** Bus que graba lo publicado y no reparte nada: aquí solo importa QUÉ evento sale. */
@Injectable()
export class RecordingEventBus extends EventBus {
  readonly published: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  subscribe(_subscriber: string, _eventName: string, _handler: EventHandler): void {
    // los tests de este contexto no ejercitan el reparto
  }

  names(): string[] {
    return this.published.map((event) => event.name);
  }
}

export function provideAuthTestDoubles(): Provider[] {
  return [
    { provide: Logger, useClass: ConsoleLogger },
    FakeAuthenticator,
    FakeAuthSettingsRepository,
    FakeSessionHintRepository,
    FakeLocalData,
    { provide: Authenticator, useExisting: FakeAuthenticator },
    { provide: AuthSettingsRepository, useExisting: FakeAuthSettingsRepository },
    { provide: SessionHintRepository, useExisting: FakeSessionHintRepository },
    { provide: LocalData, useExisting: FakeLocalData },
    { provide: Session, useClass: InMemorySession },
    { provide: EventBus, useClass: RecordingEventBus },
  ];
}
