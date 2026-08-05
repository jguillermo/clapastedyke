import { TestBed } from '@angular/core/testing';
import {
  FakeCredentialsProvider,
  FakeSyncGateway,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';
import { PrepareSyncTarget } from '../../../application/use-cases/prepare-sync-target.use-case';
import { SyncShadow } from '../../../domain/services/sync-shadow';
import { SyncError } from '../../../domain/services/sync.gateway.types';

describe('PrepareSyncTarget', () => {
  let prepare: PrepareSyncTarget;
  let gateway: FakeSyncGateway;
  let targets: FakeSyncTargetRepository;
  let credentials: FakeCredentialsProvider;
  let shadow: SyncShadow;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    prepare = TestBed.inject(PrepareSyncTarget);
    gateway = TestBed.inject(FakeSyncGateway);
    targets = TestBed.inject(FakeSyncTargetRepository);
    credentials = TestBed.inject(FakeCredentialsProvider);
    shadow = TestBed.inject(SyncShadow);
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

  it('al reemplazar la hoja se olvida también la base de comparación', async () => {
    /*
     * Las dos cosas van juntas, y no es cosmético: la base dice «esto es lo que había en la hoja» y no
     * apunta a cuál. Si sobreviviera al reemplazo, la hoja nueva —que nace vacía— se compararía contra
     * una base llena: cada fila parecería borrada a mano, el tope de borrado masivo abortaría el ciclo, y
     * como el motivo no se arregla solo, lo abortaría en TODOS los siguientes. El usuario se quedaría con
     * una hoja vacía, un error permanente y sus recetas sin subir.
     */
    await prepare.execute();
    await shadow.put({
      table: 'supplies',
      rowId: 'ing-harina',
      fingerprint: 'a1b2c3d4',
      version: '0000000000000-0-dev00001',
      deleted: false,
    });
    gateway.targetAlive = false;

    await prepare.execute();

    expect(await shadow.all()).toEqual([]);
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
