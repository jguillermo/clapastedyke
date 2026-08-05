import { TestBed } from '@angular/core/testing';
import { SynchronizeWithRemote } from '../../application/use-cases/synchronize-with-remote.use-case';
import { SyncTarget } from '../../domain/value-objects/sync-target';
import { SyncScheduler } from '../../infrastructure/sync-scheduler';
import { SHEET_TABLES } from '../../infrastructure/sheet-schema';
import {
  FakeSyncCoordinator,
  FakeSyncReader,
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
  let cycles: number;

  beforeEach(async () => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    coordinator = TestBed.inject(FakeSyncCoordinator);

    // El ciclo se dobla contando llamadas: aquí no se prueba lo que hace, sino cuándo se llama.
    cycles = 0;
    const cycle = TestBed.inject(SynchronizeWithRemote);
    vi.spyOn(cycle, 'execute').mockImplementation(async () => {
      cycles += 1;
      return { synced: true, applied: 0, pushed: 0, removed: 0, rejected: 0 };
    });

    // Un destino y una lectura válidos, para que nada se pare antes de tiempo.
    await TestBed.inject(FakeSyncTargetRepository).save(
      'cuenta-1',
      SyncTarget.of('hoja-1', 'https://example.test/hoja-1'),
    );
    TestBed.inject(FakeSyncReader).snapshot = {
      schemaVersion: 4,
      tables: SHEET_TABLES.map((table) => ({
        name: table.name,
        present: true,
        headers: [...table.headers],
        rows: [],
      })),
    };

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

    it('el botón de la pantalla NO espera el mínimo', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      await scheduler.now();

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
    const cycle = TestBed.inject(SynchronizeWithRemote);
    vi.spyOn(cycle, 'execute').mockImplementation(async () => {
      cycles += 1;
      return { synced: false, applied: 0, pushed: 0, removed: 0, rejected: 0, reason: 'failed' };
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
    it('cuando otra avisa, se relee y NO se sincroniza', async () => {
      // Los datos ya están en IndexedDB: volver a hablar con la hoja no aportaría nada y gastaría cuota.
      let reloads = 0;
      scheduler.onDataChanged(() => {
        reloads += 1;
      });
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);
      const antes = cycles;

      coordinator.otherTabAnnounced();

      expect(reloads).toBe(1);
      expect(cycles).toBe(antes);
    });

    it('un ciclo que aplicó algo avisa a las demás y relee aquí', async () => {
      const cycle = TestBed.inject(SynchronizeWithRemote);
      vi.spyOn(cycle, 'execute').mockResolvedValue({
        synced: true,
        applied: 3,
        pushed: 0,
        removed: 0,
        rejected: 0,
      });
      let reloads = 0;
      scheduler.onDataChanged(() => {
        reloads += 1;
      });

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(reloads).toBe(1);
      expect(coordinator.announces).toBe(1);
    });

    it('un ciclo que no cambió nada no avisa: sería despertar a las demás para nada', async () => {
      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(coordinator.announces).toBe(0);
    });
  });
});
