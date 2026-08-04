import { TestBed } from '@angular/core/testing';
import { SignIn } from '../../../application/use-cases/sign-in.use-case';
import { SignOut } from '../../../application/use-cases/sign-out.use-case';
import { FakeSessionHintRepository, provideAuthTestDoubles } from '../../auth-test-doubles';

describe('SignOut', () => {
  let signIn: SignIn;
  let signOut: SignOut;
  let hints: FakeSessionHintRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    signIn = TestBed.inject(SignIn);
    signOut = TestBed.inject(SignOut);
    hints = TestBed.inject(FakeSessionHintRepository);
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
});
