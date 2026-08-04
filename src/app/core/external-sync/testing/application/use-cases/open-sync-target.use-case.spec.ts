import { TestBed } from '@angular/core/testing';
import {
  FakeCredentialsProvider,
  FakeSyncGateway,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';
import { OpenSyncTarget } from '../../../application/use-cases/open-sync-target.use-case';
import { SyncError } from '../../../domain/services/sync.gateway.types';

describe('OpenSyncTarget', () => {
  let open: OpenSyncTarget;
  let gateway: FakeSyncGateway;
  let credentials: FakeCredentialsProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    open = TestBed.inject(OpenSyncTarget);
    gateway = TestBed.inject(FakeSyncGateway);
    credentials = TestBed.inject(FakeCredentialsProvider);
  });

  it('devuelve dónde ha quedado preparada la copia', async () => {
    const target = await open.execute();

    expect(target).toEqual({ id: 'target-1', url: 'https://example.test/hoja' });
  });

  it('repetirlo devuelve el mismo destino: preparar es idempotente', async () => {
    expect(await open.execute()).toEqual(await open.execute());
  });

  it('sin cuenta conectada no hay a dónde escribir', async () => {
    credentials.credentials = null;

    await expect(open.execute()).rejects.toThrow(SyncError);
  });

  it('propaga el fallo del destino para que la pantalla pueda contarlo', async () => {
    gateway.failWith = new SyncError('QUOTA', 'Inténtalo más tarde.');

    await expect(open.execute()).rejects.toThrow('Inténtalo más tarde.');
  });
});
