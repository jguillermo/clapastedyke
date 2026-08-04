import { TestBed } from '@angular/core/testing';
import {
  FakeCredentialsProvider,
  FakeSyncGateway,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';
import { VerifySyncConnection } from '../../../application/use-cases/verify-sync-connection.use-case';
import { SyncError } from '../../../domain/services/sync.gateway.types';

describe('VerifySyncConnection', () => {
  let verify: VerifySyncConnection;
  let gateway: FakeSyncGateway;
  let credentials: FakeCredentialsProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    verify = TestBed.inject(VerifySyncConnection);
    gateway = TestBed.inject(FakeSyncGateway);
    credentials = TestBed.inject(FakeCredentialsProvider);
  });

  it('manda un dato de prueba y lo da por bueno cuando vuelve igual', async () => {
    const result = await verify.execute();

    expect(result.targetUrl).toBe('https://example.test/hoja');
    expect(gateway.probed).toHaveLength(1);
  });

  it('cada comprobación manda un dato distinto, para no confundirlo con el de la anterior', async () => {
    await verify.execute();
    await verify.execute();

    expect(gateway.probed[0].probe.equals(gateway.probed[1].probe)).toBe(false);
  });

  it('falla cuando el destino contesta bien pero lo leído no es lo que se escribió', async () => {
    gateway.echo = 'otra-cosa';

    await expect(verify.execute()).rejects.toThrow(SyncError);
  });

  it('sin cuenta conectada no hay nada que comprobar', async () => {
    credentials.credentials = null;

    await expect(verify.execute()).rejects.toThrow(SyncError);
    expect(gateway.probed).toHaveLength(0);
  });
});
