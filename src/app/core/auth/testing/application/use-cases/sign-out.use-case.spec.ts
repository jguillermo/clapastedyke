import { TestBed } from '@angular/core/testing';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { SignIn } from '../../../application/use-cases/sign-in.use-case';
import { SignOut } from '../../../application/use-cases/sign-out.use-case';
import { phaseOf, Session } from '../../../domain/services/session';
import {
  FakeAuthenticator,
  FakeLocalData,
  FakeSessionHintRepository,
  FakeSessionTokenRepository,
  provideAuthTestDoubles,
  RecordingEventBus,
} from '../../auth-test-doubles';

describe('SignOut', () => {
  let signIn: SignIn;
  let signOut: SignOut;
  let authenticator: FakeAuthenticator;
  let hints: FakeSessionHintRepository;
  let sessionTokens: FakeSessionTokenRepository;
  let local: FakeLocalData;
  let bus: RecordingEventBus;
  let session: Session;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    signIn = TestBed.inject(SignIn);
    signOut = TestBed.inject(SignOut);
    authenticator = TestBed.inject(FakeAuthenticator);
    hints = TestBed.inject(FakeSessionHintRepository);
    sessionTokens = TestBed.inject(FakeSessionTokenRepository);
    local = TestBed.inject(FakeLocalData);
    bus = TestBed.inject(EventBus) as RecordingEventBus;
    session = TestBed.inject(Session);
  });

  it('entrar deja anotada la cuenta, para poder reanudar al recargar', async () => {
    await signIn.execute();

    expect(hints.stored()).toEqual({ accountId: 'cuenta-1', email: 'chef@example.test' });
  });

  it('salir borra la pista: si no, la próxima carga volvería a entrar sola', async () => {
    await signIn.execute();

    await signOut.execute();

    expect(hints.stored()).toBeNull();
  });

  it('salir borra el identificador de sesión de este navegador', async () => {
    await signIn.execute();
    await sessionTokens.save('sid-1');

    await signOut.execute();

    expect(sessionTokens.stored()).toBeNull();
  });

  it('salir cierra la sesión en el servicio, no solo aquí', async () => {
    await signIn.execute();

    await signOut.execute();

    expect(authenticator.remoteSessionsClosed).toBe(1);
  });

  it('salir borra TODO lo guardado en el navegador, no solo la sesión', async () => {
    await signIn.execute();

    await signOut.execute();

    expect(local.wipes).toBe(1);
  });

  it('primero se pierde la conexión y solo después se borra: si no, el ciclo subiría la base vacía como bajas', async () => {
    await signIn.execute();

    await signOut.execute();

    expect(local.sessionOpenAtWipe).toBe(false);
  });

  it('sin conexión no cierra nada: los datos del dispositivo se quedan donde están', async () => {
    await signIn.execute();
    authenticator.remoteSessionReachable = false;

    await expect(signOut.execute()).rejects.toThrow(/sin conexión/i);

    expect(local.wipes).toBe(0);
    expect(phaseOf(session.snapshot())).toBe('active');
    expect(hints.stored()).not.toBeNull();
  });

  it('sin sesión abierta no se borra nada, pero se limpia el rastro que quedara', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
    await sessionTokens.save('sid-huerfano');

    await signOut.execute();

    expect(local.wipes).toBe(0);
    expect(hints.stored()).toBeNull();
    expect(sessionTokens.stored()).toBeNull();
  });

  it('si el borrado falla, la sesión se cierra igual y se anuncia la salida', async () => {
    await signIn.execute();
    local.failWith = new Error('IndexedDB no responde');

    await signOut.execute();

    expect(bus.names()).toContain(IntegrationEventName.SIGN_OUT_SUCCEEDED);
  });
});
