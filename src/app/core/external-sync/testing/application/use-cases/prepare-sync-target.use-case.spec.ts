import { TestBed } from '@angular/core/testing';
import {
  FakeCredentialsProvider,
  FakeSyncGateway,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';
import { PrepareSyncTarget } from '../../../application/use-cases/prepare-sync-target.use-case';
import { SyncError } from '../../../domain/services/sync.gateway.types';

describe('PrepareSyncTarget', () => {
  let prepare: PrepareSyncTarget;
  let gateway: FakeSyncGateway;
  let targets: FakeSyncTargetRepository;
  let credentials: FakeCredentialsProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    prepare = TestBed.inject(PrepareSyncTarget);
    gateway = TestBed.inject(FakeSyncGateway);
    targets = TestBed.inject(FakeSyncTargetRepository);
    credentials = TestBed.inject(FakeCredentialsProvider);
  });

  it('la primera vez crea la hoja y recuerda dónde quedó', async () => {
    const result = await prepare.execute();

    expect(result).toEqual({ targetUrl: 'https://example.test/hoja', created: true });
    expect(gateway.created).toBe(1);
    expect(await targets.forAccount('cuenta-1')).not.toBeNull();
  });

  it('la segunda vez NO crea otra: el Drive del usuario no se llena de hojas', async () => {
    await prepare.execute();
    const result = await prepare.execute();

    expect(result.created).toBe(false);
    expect(gateway.created).toBe(1);
    expect(targets.count()).toBe(1);
  });

  it('si el usuario borró la hoja, se crea otra en su lugar', async () => {
    await prepare.execute();
    gateway.targetAlive = false;

    const result = await prepare.execute();

    expect(result.created).toBe(true);
    expect(gateway.created).toBe(2);
    // La anterior se olvida: queda una sola recordada, la nueva.
    expect((await targets.forAccount('cuenta-1'))?.id).toBe('target-2');
  });

  it('cada cuenta tiene su propia hoja', async () => {
    await prepare.execute();
    credentials.credentials = {
      token: 't-2',
      epoch: 2,
      accountId: 'cuenta-2',
      accountEmail: 'otra@example.test',
    };

    await prepare.execute();

    expect(targets.count()).toBe(2);
    expect((await targets.forAccount('cuenta-1'))?.id).not.toBe(
      (await targets.forAccount('cuenta-2'))?.id,
    );
  });

  it('si crear falla no se recuerda nada: la próxima vez se vuelve a intentar', async () => {
    gateway.failWith = new SyncError('NETWORK', 'Sin conexión.');

    await expect(prepare.execute()).rejects.toThrow(SyncError);
    expect(targets.count()).toBe(0);
  });

  it('recrear olvida la anterior y crea otra, sin borrar la vieja del Drive', async () => {
    await prepare.execute();

    const result = await prepare.recreate();

    expect(result.created).toBe(true);
    expect(gateway.created).toBe(2);
    expect(targets.count()).toBe(1);
  });

  it('sin cuenta conectada no hay Drive donde crear nada', async () => {
    credentials.credentials = null;

    await expect(prepare.execute()).rejects.toThrow(SyncError);
    expect(gateway.created).toBe(0);
  });
});
