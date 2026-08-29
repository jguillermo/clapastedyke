import { TestBed } from '@angular/core/testing';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { SignIn } from '../../../application/use-cases/sign-in.use-case';
import { SignOut } from '../../../application/use-cases/sign-out.use-case';
import {
  FakeLocalData,
  FakeSessionHintRepository,
  provideAuthTestDoubles,
  RecordingEventBus,
} from '../../auth-test-doubles';

describe('SignOut', () => {
  let signIn: SignIn;
  let signOut: SignOut;
  let hints: FakeSessionHintRepository;
  let local: FakeLocalData;
  let bus: RecordingEventBus;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    signIn = TestBed.inject(SignIn);
    signOut = TestBed.inject(SignOut);
    hints = TestBed.inject(FakeSessionHintRepository);
    local = TestBed.inject(FakeLocalData);
    bus = TestBed.inject(EventBus) as RecordingEventBus;
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

  it('sin sesión abierta no se borra nada: no había de quién', async () => {
    await signOut.execute();

    expect(local.wipes).toBe(0);
  });

  it('si el borrado falla, la sesión se cierra igual y se anuncia la salida', async () => {
    await signIn.execute();
    local.failWith = new Error('IndexedDB no responde');

    await signOut.execute();

    expect(bus.names()).toContain(IntegrationEventName.SIGN_OUT_SUCCEEDED);
  });
});
