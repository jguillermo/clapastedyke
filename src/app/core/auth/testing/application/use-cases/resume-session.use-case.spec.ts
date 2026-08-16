import { TestBed } from '@angular/core/testing';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { ResumeSession } from '../../../application/use-cases/resume-session.use-case';
import { Session } from '../../../domain/services/session';
import { Credential } from '../../../domain/value-objects/credential';
import { Account } from '../../../domain/entities/account';
import {
  FakeAuthenticator,
  FakeSessionHintRepository,
  provideAuthTestDoubles,
  RecordingEventBus,
} from '../../auth-test-doubles';

describe('ResumeSession', () => {
  let resume: ResumeSession;
  let authenticator: FakeAuthenticator;
  let hints: FakeSessionHintRepository;
  let bus: RecordingEventBus;
  let session: Session;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    resume = TestBed.inject(ResumeSession);
    authenticator = TestBed.inject(FakeAuthenticator);
    hints = TestBed.inject(FakeSessionHintRepository);
    bus = TestBed.inject(EventBus) as RecordingEventBus;
    session = TestBed.inject(Session);
  });

  it('con pista y proveedor dispuesto, vuelve a abrir la sesión sin pedir nada', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });

    const result = await resume.execute();

    expect(result.active).toBe(true);
    expect(session.snapshot().account?.id.value).toBe('cuenta-1');
    // Reanudar NO usa el flujo interactivo: eso enseñaría una ventana en cada recarga.
    expect(authenticator.interactiveCalls).toBe(0);
  });

  it('publica SessionResumed, NO AuthenticationSucceeded: lo pendiente es de esta cuenta', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });

    await resume.execute();

    expect(bus.names()).toEqual([IntegrationEventName.SESSION_RESUMED]);
  });

  it('sin pista no intenta nada: nadie había entrado en este navegador', async () => {
    const result = await resume.execute();

    expect(result.active).toBe(false);
    expect(authenticator.resumeCalls).toBe(0);
    expect(bus.names()).toEqual([]);
  });

  it('si el proveedor no reanuda, se arranca sin sesión y sin ruido', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
    authenticator.canResume = false;

    const result = await resume.execute();

    expect(result.active).toBe(false);
    expect(session.snapshot().account).toBeNull();
    expect(bus.names()).toEqual([]);
  });

  it('nunca lanza: un fallo al reanudar no puede impedir que la app arranque', async () => {
    hints.failOnRead = new Error('IndexedDB no disponible');

    await expect(resume.execute()).resolves.toEqual({ active: false });
  });

  it('con una credencial que aún vale no molesta al proveedor', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
    await resume.execute();

    const again = await resume.execute();

    expect(again.active).toBe(true);
    expect(authenticator.resumeCalls).toBe(1);
  });

  it('con la credencial caducada la renueva SIN tocar el número de sesión', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
    session.open(
      Account.of('cuenta-1', 'chef@example.test', 'Chef', null),
      Credential.of('viejo', 1, ['https://www.googleapis.com/auth/drive.file'], 0),
    );
    const epochAntes = session.snapshot().epoch;

    const result = await resume.execute();

    expect(result.active).toBe(true);
    expect(session.snapshot().credential?.token).toBe('t-1');
    // El `epoch` intacto es lo que impide que una operación en vuelo tire su resultado.
    expect(session.snapshot().epoch).toBe(epochAntes);
  });

  it('renovar NO publica nada: para fuera no ha cambiado nada', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
    session.open(
      Account.of('cuenta-1', 'chef@example.test', 'Chef', null),
      Credential.of('viejo', 1, ['https://www.googleapis.com/auth/drive.file'], 0),
    );

    await resume.execute();

    expect(bus.names()).toEqual([]);
  });

  it('varios a la vez comparten un solo intento: no se piden tres tokens', async () => {
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });

    const [a, b, c] = await Promise.all([resume.execute(), resume.execute(), resume.execute()]);

    expect([a.active, b.active, c.active]).toEqual([true, true, true]);
    expect(authenticator.resumeCalls).toBe(1);
  });
});
