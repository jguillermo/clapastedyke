import { TestBed } from '@angular/core/testing';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Account } from '../../domain/entities/account';
import { Session } from '../../domain/services/session';
import { Credential } from '../../domain/value-objects/credential';
import { SessionCredentialsProvider } from '../../infrastructure/session-credentials-provider';
import {
  FakeAuthenticator,
  FakeSessionHintRepository,
  provideAuthTestDoubles,
} from '../auth-test-doubles';

/**
 * Excepción consciente a «solo se testean dominio y casos de uso»: esta clase es la que decide, para
 * todos los demás contextos, si hay sesión o no. Su rama interesante —el token caducó pero la sesión
 * sigue viva— no se puede ejercitar desde un caso de uso sin montar medio contexto.
 */
describe('SessionCredentialsProvider', () => {
  let credentials: CredentialsProvider;
  let session: Session;
  let authenticator: FakeAuthenticator;
  let hints: FakeSessionHintRepository;

  const cuenta = (): Account => Account.of('cuenta-1', 'chef@example.test', 'Chef', null);
  const drive = ['https://www.googleapis.com/auth/drive.file'];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideAuthTestDoubles(),
        { provide: CredentialsProvider, useClass: SessionCredentialsProvider },
      ],
    });
    credentials = TestBed.inject(CredentialsProvider);
    session = TestBed.inject(Session);
    authenticator = TestBed.inject(FakeAuthenticator);
    hints = TestBed.inject(FakeSessionHintRepository);
    await hints.save({ accountId: 'cuenta-1', email: 'chef@example.test' });
  });

  it('sin sesión abierta no hay credenciales, y no se molesta al proveedor', async () => {
    expect(await credentials.current()).toBeNull();
    expect(authenticator.resumeCalls).toBe(0);
  });

  it('con una credencial vigente la entrega tal cual', async () => {
    session.open(cuenta(), Credential.of('t-vigente', 3600, drive, Date.now()));

    const result = await credentials.current();

    expect(result?.token).toBe('t-vigente');
    expect(authenticator.resumeCalls).toBe(0);
  });

  it('con la credencial caducada la renueva y entrega la nueva: la sesión no había muerto', async () => {
    session.open(cuenta(), Credential.of('t-viejo', 1, drive, 0));

    const result = await credentials.current();

    expect(result?.token).toBe('t-1');
    expect(result?.accountId).toBe('cuenta-1');
    expect(authenticator.resumeCalls).toBe(1);
  });

  it('si la renovación no sale, entonces sí es «no hay sesión»', async () => {
    session.open(cuenta(), Credential.of('t-viejo', 1, drive, 0));
    authenticator.canResume = false;

    expect(await credentials.current()).toBeNull();
  });
});
