import { TestBed } from '@angular/core/testing';
import { BootSync } from '../../../application/use-cases/boot-sync.use-case';
import {
  SynchronizeResult,
  SynchronizeTables,
} from '../../../application/use-cases/synchronize-tables.use-case';
import { FakeCredentialsProvider, makeExternalSyncFakes } from '../../external-sync-test-doubles';

/**
 * La puerta de arranque.
 *
 * Lo que se prueba es el compromiso: con conexión se espera a tener la hoja aplicada, pero **el plazo
 * existe**. Sin plazo, una hoja lenta o una cuota agotada dejaría la app sin abrir; y lo que se abandona
 * al vencer es la espera, nunca el ciclo — cortarlo a medias sería lo peor de los dos mundos.
 */
describe('BootSync', () => {
  let boot: BootSync;
  let credentials: FakeCredentialsProvider;
  let cycle: SynchronizeTables;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    boot = TestBed.inject(BootSync);
    credentials = TestBed.inject(FakeCredentialsProvider);
    cycle = TestBed.inject(SynchronizeTables);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const ok = ciclo(true);

  it('sin cuenta no espera nada: la app es local-first', async () => {
    credentials.credentials = null;
    const spy = vi.spyOn(cycle, 'execute');

    const result = await boot.execute();

    expect(result).toEqual({ synced: false, reason: 'disconnected' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('con cuenta espera a que la hoja esté aplicada', async () => {
    vi.spyOn(cycle, 'execute').mockResolvedValue(ok);

    await expect(boot.execute()).resolves.toEqual({ synced: true });
  });

  it('si el ciclo tarda demasiado, se entra igual', async () => {
    // Sin esto, una hoja lenta o una cuota agotada dejaría la app sin arrancar.
    vi.spyOn(cycle, 'execute').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(ok), 60_000)),
    );

    const pending = boot.execute();
    await vi.advanceTimersByTimeAsync(8_000);

    await expect(pending).resolves.toEqual({ synced: false, reason: 'timeout' });
  });

  it('el plazo abandona la ESPERA, no el ciclo', async () => {
    // Cortar la sincronización a mitad la dejaría a medias en el momento más delicado. Sigue su curso y
    // su resultado llega al estado por su cuenta.
    let finished = false;
    vi.spyOn(cycle, 'execute').mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            finished = true;
            resolve(ok);
          }, 20_000),
        ),
    );

    const pending = boot.execute();
    await vi.advanceTimersByTimeAsync(8_000);
    await pending;
    expect(finished).toBe(false);

    await vi.advanceTimersByTimeAsync(12_000);
    expect(finished).toBe(true);
  });

  it('un ciclo que falla no impide arrancar', async () => {
    vi.spyOn(cycle, 'execute').mockResolvedValue({ ...ok, synced: false, reason: 'failed' });

    await expect(boot.execute()).resolves.toEqual({ synced: false, reason: 'failed' });
  });
});

/** Un resultado de ciclo sin movimientos: aquí solo importa si salió bien y cuánto tardó. */
function ciclo(synced: boolean): SynchronizeResult {
  return {
    synced,
    movements: { pushed: 0, applied: 0, removed: 0, merged: 0 },
    problems: { duplicates: 0, unreadable: 0, ignored: 0, barrier: null },
    byTable: {},
  };
}
