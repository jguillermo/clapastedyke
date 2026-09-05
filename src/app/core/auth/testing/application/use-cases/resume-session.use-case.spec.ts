import { TestBed } from '@angular/core/testing';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { ResumeSession } from '../../../application/use-cases/resume-session.use-case';
import { phaseOf, Session } from '../../../domain/services/session';
import { Credential } from '../../../domain/value-objects/credential';
import { Account } from '../../../domain/entities/account';
import {
  FakeAuthenticator,
  FakeSessionHintRepository,
  FakeSessionTokenRepository,
  provideAuthTestDoubles,
  RecordingEventBus,
} from '../../auth-test-doubles';

const DRIVE = 'https://www.googleapis.com/auth/drive.file';
const HINT = { accountId: 'cuenta-1', email: 'chef@example.test' };

describe('ResumeSession', () => {
  let resume: ResumeSession;
  let authenticator: FakeAuthenticator;
  let hints: FakeSessionHintRepository;
  let sessionTokens: FakeSessionTokenRepository;
  let bus: RecordingEventBus;
  let session: Session;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    resume = TestBed.inject(ResumeSession);
    authenticator = TestBed.inject(FakeAuthenticator);
    hints = TestBed.inject(FakeSessionHintRepository);
    sessionTokens = TestBed.inject(FakeSessionTokenRepository);
    bus = TestBed.inject(EventBus) as RecordingEventBus;
    session = TestBed.inject(Session);
  });

  it('con pista y proveedor dispuesto, vuelve a abrir la sesión sin pedir nada', async () => {
    await hints.save(HINT);

    const result = await resume.execute();

    expect(result.active).toBe(true);
    expect(session.snapshot().account?.id.value).toBe('cuenta-1');
    // Reanudar NO usa el flujo interactivo: eso enseñaría una ventana en cada recarga.
    expect(authenticator.interactiveCalls).toBe(0);
  });

  it('publica SessionResumed, NO AuthenticationSucceeded: lo pendiente es de esta cuenta', async () => {
    await hints.save(HINT);

    await resume.execute();

    expect(bus.names()).toEqual([IntegrationEventName.SESSION_RESUMED]);
  });

  it('sin pista no intenta nada: nadie había entrado en este navegador', async () => {
    const result = await resume.execute();

    expect(result.active).toBe(false);
    expect(authenticator.resumeCalls).toBe(0);
    expect(bus.names()).toEqual([]);
  });

  it('sin conexión deja la sesión sin conexión, no desconectada', async () => {
    await hints.save(HINT);
    authenticator.resumesWith = 'unreachable';

    const result = await resume.execute();

    expect(result.active).toBe(false);
    // Lo que se prueba es que NO se le ofrece «Conectar con Google» a quien ya tiene sesión.
    expect(phaseOf(session.snapshot())).toBe('offline');
    expect(bus.names()).toEqual([]);
  });

  it('sin conexión conserva el rastro para volver a intentarlo en la siguiente carga', async () => {
    await hints.save(HINT);
    await sessionTokens.save('sid-1');
    authenticator.resumesWith = 'unreachable';

    await resume.execute();

    expect(hints.stored()).toEqual(HINT);
    expect(sessionTokens.stored()).toBe('sid-1');
  });

  it('si el proveedor rechaza la sesión, la cierra y borra su rastro', async () => {
    await hints.save(HINT);
    await sessionTokens.save('sid-1');
    authenticator.resumesWith = 'invalid';

    const result = await resume.execute();

    expect(result.active).toBe(false);
    expect(phaseOf(session.snapshot())).toBe('disconnected');
    expect(hints.stored()).toBeNull();
    expect(sessionTokens.stored()).toBeNull();
  });

  it('una sesión rechazada NO se anuncia como cierre de sesión: la cola de sincronización es del usuario', async () => {
    await hints.save(HINT);
    authenticator.resumesWith = 'invalid';

    await resume.execute();

    expect(bus.names()).toEqual([]);
  });

  it('cuando vuelve la conexión, la sesión sin conexión pasa a activa', async () => {
    await hints.save(HINT);
    authenticator.resumesWith = 'unreachable';
    await resume.execute();

    authenticator.resumesWith = 'authenticated';
    const result = await resume.execute();

    expect(result.active).toBe(true);
    expect(phaseOf(session.snapshot())).toBe('active');
    // Hasta ahora no se podía sincronizar: quien sincroniza tiene que enterarse de que ya sí.
    expect(bus.names()).toEqual([IntegrationEventName.SESSION_RESUMED]);
  });

  it('al recuperar la conexión, la cuenta de verdad sustituye al esbozo de la pista', async () => {
    // La pista solo guarda identidad y correo, así que sin conexión la cuenta no tiene nombre. Si al
    // volver se renovara la credencial en vez de abrir la sesión, la pantalla enseñaría el correo en
    // lugar del nombre de la persona — y para siempre, porque nada volvería a tocar la cuenta.
    await hints.save(HINT);
    authenticator.resumesWith = 'unreachable';
    await resume.execute();
    expect(session.snapshot().account?.displayName).toBe('chef@example.test');

    authenticator.resumesWith = 'authenticated';
    await resume.execute();

    expect(session.snapshot().account?.displayName).toBe('Chef');
  });

  it('nunca lanza: un fallo al reanudar no puede impedir que la app arranque', async () => {
    hints.failOnRead = new Error('IndexedDB no disponible');

    await expect(resume.execute()).resolves.toEqual({ active: false });
  });

  it('con una credencial que aún vale no molesta al proveedor', async () => {
    await hints.save(HINT);
    await resume.execute();

    const again = await resume.execute();

    expect(again.active).toBe(true);
    expect(authenticator.resumeCalls).toBe(1);
  });

  it('con la credencial caducada la renueva SIN tocar el número de sesión', async () => {
    await hints.save(HINT);
    session.open(
      Account.of('cuenta-1', 'chef@example.test', 'Chef', null),
      Credential.of('viejo', 1, [DRIVE], 0),
    );
    const epochAntes = session.snapshot().epoch;

    const result = await resume.execute();

    expect(result.active).toBe(true);
    expect(session.snapshot().credential?.token).toBe('t-1');
    // El `epoch` intacto es lo que impide que una operación en vuelo tire su resultado.
    expect(session.snapshot().epoch).toBe(epochAntes);
  });

  it('renovar NO publica nada: para fuera no ha cambiado nada', async () => {
    await hints.save(HINT);
    session.open(
      Account.of('cuenta-1', 'chef@example.test', 'Chef', null),
      Credential.of('viejo', 1, [DRIVE], 0),
    );

    await resume.execute();

    expect(bus.names()).toEqual([]);
  });

  it('varios a la vez comparten un solo intento: no se piden tres tokens', async () => {
    await hints.save(HINT);

    const [a, b, c] = await Promise.all([resume.execute(), resume.execute(), resume.execute()]);

    expect([a.active, b.active, c.active]).toEqual([true, true, true]);
    expect(authenticator.resumeCalls).toBe(1);
  });
});
