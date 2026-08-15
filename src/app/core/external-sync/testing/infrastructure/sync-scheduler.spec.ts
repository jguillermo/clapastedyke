import { TestBed } from '@angular/core/testing';
import {
  SynchronizeResult,
  SynchronizeTables,
} from '../../application/use-cases/synchronize-tables.use-case';
import { SyncStatus } from '../../domain/services/sync-status';
import { SyncTarget } from '../../domain/value-objects/sync-target';
import { SyncScheduler } from '../../infrastructure/sync-scheduler';
import {
  FakeSyncCoordinator,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../external-sync-test-doubles';

/**
 * Cuándo se sincroniza.
 *
 * Todo lo que decide este planificador es tiempo, así que aquí se manipula el reloj. Y lo que más
 * importa no es que dispare, sino que **NO** dispare de más: el disparador por foco salta en cada cambio
 * de pestaña, y sin un intervalo mínimo compartido, alguien alternando entre ventanas se pasa de la
 * cuota que Google da por usuario y ve un error sin haber hecho nada raro.
 */
describe('SyncScheduler', () => {
  let scheduler: SyncScheduler;
  let coordinator: FakeSyncCoordinator;
  let status: SyncStatus;
  let cycles: number;

  beforeEach(async () => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    coordinator = TestBed.inject(FakeSyncCoordinator);
    status = TestBed.inject(SyncStatus);

    // El ciclo se dobla contando llamadas: aquí no se prueba lo que hace, sino cuándo se llama.
    cycles = 0;
    const cycle = TestBed.inject(SynchronizeTables);
    vi.spyOn(cycle, 'execute').mockImplementation(async () => {
      cycles += 1;
      return quieto(true);
    });

    // Un destino y una lectura válidos, para que nada se pare antes de tiempo.
    await TestBed.inject(FakeSyncTargetRepository).save(
      'cuenta-1',
      SyncTarget.of('hoja-1', 'https://example.test/hoja-1'),
    );

    scheduler = TestBed.inject(SyncScheduler);
  });

  afterEach(() => {
    scheduler.stopForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('al arrancar pide su turno y sincroniza una vez', async () => {
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(coordinator.claims).toBe(1);
    expect(cycles).toBe(1);
  });

  it('arrancar dos veces no pone dos intervalos', async () => {
    scheduler.start();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(cycles).toBe(1);
  });

  it('si otra pestaña tiene el turno, esta no sincroniza', async () => {
    coordinator.setLeader(false);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(5 * 60_000);

    expect(cycles).toBe(0);
  });

  describe('el intervalo mínimo', () => {
    it('varios disparos seguidos producen UN ciclo', async () => {
      // El caso real: alguien alternando de ventana. Sin esto serían treinta ciclos por minuto.
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);
      expect(cycles).toBe(1);

      for (let i = 0; i < 10; i += 1) {
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(100);
      }

      expect(cycles).toBe(1);
    });

    it('pasado el mínimo, el foco vuelve a disparar', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersByTimeAsync(21_000);
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);

      expect(cycles).toBe(2);
    });

    it('un cambio local NO espera el mínimo: ya lo limita su propio rebote', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      scheduler.afterLocalChange();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(cycles).toBe(2);
    });
  });

  describe('un cambio local', () => {
    it('se sube tras el rebote, no al instante', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(21_000);
      const antes = cycles;

      scheduler.afterLocalChange();
      await vi.advanceTimersByTimeAsync(1_000);
      expect(cycles).toBe(antes);

      await vi.advanceTimersByTimeAsync(5_000);
      expect(cycles).toBe(antes + 1);
    });

    it('cinco cambios seguidos mandan un solo ciclo', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(21_000);
      const antes = cycles;

      for (let i = 0; i < 5; i += 1) {
        scheduler.afterLocalChange();
        await vi.advanceTimersByTimeAsync(500);
      }
      await vi.advanceTimersByTimeAsync(6_000);

      expect(cycles).toBe(antes + 1);
    });
  });

  it('un fallo espera cada vez más, en vez de reintentar sin parar', async () => {
    const cycle = TestBed.inject(SynchronizeTables);
    vi.spyOn(cycle, 'execute').mockImplementation(async () => {
      cycles += 1;
      return { ...quieto(false), reason: 'failed' as const };
    });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(cycles).toBe(1);

    // El primer reintento a los 5 s; el siguiente al doble, no otra vez a los 5.
    await vi.advanceTimersByTimeAsync(5_000);
    expect(cycles).toBe(2);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(cycles).toBe(2);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(cycles).toBe(3);
  });

  describe('las demás pestañas', () => {
    it('cuando otra avisa, sube la revisión y NO se sincroniza', async () => {
      // Los datos ya están en IndexedDB: volver a hablar con la hoja no aportaría nada y gastaría cuota.
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);
      const antes = { ciclos: cycles, revision: status.revision() };

      coordinator.otherTabAnnounced();

      expect(status.revision()).toBe(antes.revision + 1);
      expect(cycles).toBe(antes.ciclos);
    });

    it('un ciclo que aplicó algo avisa a las demás y sube la revisión aquí', async () => {
      const cycle = TestBed.inject(SynchronizeTables);
      vi.spyOn(cycle, 'execute').mockResolvedValue({
        ...quieto(true),
        movements: { pushed: 0, applied: 3, removed: 0, merged: 0 },
      });

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(status.revision()).toBe(1);
      expect(coordinator.announces).toBe(1);
    });

    it('un ciclo que no cambió nada no avisa ni sube la revisión', async () => {
      // Sin esta condición, cada dos minutos se repintaría el libro entero para dejarlo igual.
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(coordinator.announces).toBe(0);
      expect(status.revision()).toBe(0);
    });
  });
});

/**
 * Un resultado de ciclo sin movimientos.
 *
 * Aquí no se prueba lo que hace el ciclo, sino **cuándo** se llama, así que el resultado solo tiene
 * que ser del tipo correcto y decir si salió bien.
 */
function quieto(synced: boolean): SynchronizeResult {
  return {
    synced,
    movements: { pushed: 0, applied: 0, removed: 0, merged: 0 },
    problems: { duplicates: 0, unreadable: 0, ignored: 0, barrier: null },
    byTable: {},
  };
}
