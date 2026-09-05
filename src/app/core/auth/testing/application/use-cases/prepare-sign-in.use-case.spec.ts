import { TestBed } from '@angular/core/testing';
import { PrepareSignIn } from '../../../application/use-cases/prepare-sign-in.use-case';
import { FakeAuthenticator, provideAuthTestDoubles } from '../../auth-test-doubles';

describe('PrepareSignIn', () => {
  let prepare: PrepareSignIn;
  let authenticator: FakeAuthenticator;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuthTestDoubles() });
    prepare = TestBed.inject(PrepareSignIn);
    authenticator = TestBed.inject(FakeAuthenticator);
  });

  it('avisa al proveedor para que conectar no tenga que esperarle dentro del clic', async () => {
    await prepare.execute();

    expect(authenticator.prepareCalls).toBe(1);
    // Preparar NO autentica: no abre ninguna ventana ni le pide nada al usuario.
    expect(authenticator.interactiveCalls).toBe(0);
  });
});
