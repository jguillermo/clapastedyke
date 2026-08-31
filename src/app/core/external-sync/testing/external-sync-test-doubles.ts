/**
 * Dobles de test del contexto `external-sync`: una cola en memoria con la misma máquina de estados
 * que la real, un destino que se puede programar para fallar, y fuentes falsas de credenciales y de
 * filas.
 *
 * El estado (`InMemorySyncStatus`) y el bus (`InMemoryEventBus`) se usan **de verdad**: ya son
 * implementaciones en memoria, así que doblarlos solo añadiría una mentira que mantener.
 */
import { Injectable, Provider, signal, Signal } from '@angular/core';
import {
  AppConfig,
  IntegrationConfig,
  SyncConfig,
} from '../../_common/infrastructure/config/app-config';
import { DomainEvent } from '../../_common/eventbus/domain-event';
import { EventBus, EventHandler } from '../../_common/eventbus/event-bus';
import {
  CredentialsProvider,
  UserCredentials,
} from '../../_common/credentials/credentials-provider';
import { DeviceIdentity } from '../domain/services/device-identity';
import { SyncCoordinator } from '../domain/services/sync-coordinator';
import { LocalRepository, TableRow } from '../domain/repositories/local.repository';
import {
  ReadRequest,
  RemoteRepository,
  RemoteSnapshot,
  RemoteWrite,
  WriteOutcome,
  WriteRequest,
} from '../domain/repositories/remote.repository';
import { ShadowRow, SyncShadow } from '../domain/services/sync-shadow';
import { SyncGateway } from '../domain/services/sync.gateway';
import { ProbeOutcome, ProbeRequest } from '../domain/services/sync.gateway.types';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncTargetRepository } from '../domain/repositories/sync-target.repository';
import { SyncStatus } from '../domain/services/sync-status';
import { SyncItem } from '../domain/value-objects/sync-item';
import { SyncTarget } from '../domain/value-objects/sync-target';
import { InMemorySyncStatus } from '../infrastructure/in-memory-sync-status';
import { ConsoleLogger } from '@core/_common/logger/console-logger';
import { Logger } from '@core/_common/logger/logger';

/**
 * Cola en memoria que replica la máquina de estados de la real (en cola → en vuelo → fuera),
 * incluida la conservación del turno al reencolar. Lo que NO replica es la durabilidad: eso solo se
 * puede comprobar contra IndexedDB, en E2E.
 */
@Injectable()
export class FakeSyncOutbox extends SyncOutbox {
  private readonly records = new Map<string, { item: SyncItem; seq: number; inFlight: boolean }>();
  private readonly count = signal(0);
  private seq = 0;

  readonly pending: Signal<number> = this.count.asReadonly();

  async enqueue(item: SyncItem): Promise<void> {
    const existing = this.records.get(item.key());
    this.records.set(item.key(), {
      item,
      seq: existing?.seq ?? ++this.seq,
      inFlight: false,
    });
    this.recount();
  }

  async take(): Promise<SyncItem[]> {
    const queued = [...this.records.values()]
      .filter((record) => !record.inFlight)
      .sort((a, b) => a.seq - b.seq);

    for (const record of queued) {
      record.inFlight = true;
    }
    this.recount();
    return queued.map((record) => record.item);
  }

  async ack(items: readonly SyncItem[]): Promise<void> {
    for (const item of items) {
      if (this.records.get(item.key())?.inFlight) {
        this.records.delete(item.key());
      }
    }
    this.recount();
  }

  async requeue(items: readonly SyncItem[]): Promise<void> {
    for (const item of items) {
      const record = this.records.get(item.key());
      if (record?.inFlight) {
        record.inFlight = false;
      }
    }
    this.recount();
  }

  async clear(): Promise<void> {
    this.records.clear();
    this.recount();
  }

  /** Lo que sigue guardado, en orden de turno — en cola o en vuelo. Para asertar en los tests. */
  stored(): string[] {
    return [...this.records.values()].sort((a, b) => a.seq - b.seq).map((r) => r.item.key());
  }

  /** Simula una recarga: lo que quedó en vuelo vuelve a la cola, como hace la cola real al arrancar. */
  restart(): void {
    for (const record of this.records.values()) {
      record.inFlight = false;
    }
    this.recount();
  }

  private recount(): void {
    this.count.set([...this.records.values()].filter((record) => !record.inFlight).length);
  }
}

/**
 * Bus falso: graba lo publicado y no reparte nada. Aquí no se prueba el bus —eso tiene su propio
 * test en `_common/eventbus/`—, solo que el caso de uso publica lo que debe.
 */
@Injectable()
export class FakeEventBus extends EventBus {
  readonly published: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  subscribe(_subscriber: string, _eventName: string, _handler: EventHandler): void {
    // los tests de este contexto no ejercitan el reparto
  }

  names(): string[] {
    return this.published.map((event) => event.name);
  }
}

/** Destino falso: registra lo que se le manda y puede programarse para fallar lo siguiente. */
@Injectable()
export class FakeSyncGateway extends SyncGateway {
  readonly probed: ProbeRequest[] = [];
  /** Cuántas hojas se han creado. Para asertar que no se crea una en cada conexión. */
  created = 0;
  /** `false` simula que el usuario borró su hoja o la mandó a la papelera. */
  targetAlive = true;
  failWith: Error | null = null;
  /**
   * Qué devuelve la comprobación de ida y vuelta. `null` = el eco correcto (lo que se mandó); un
   * string fuerza el caso interesante: el destino contesta bien pero lo leído no coincide.
   */
  echo: string | null = null;

  async create(): Promise<SyncTarget> {
    if (this.failWith) {
      throw this.failWith;
    }
    this.created += 1;
    return SyncTarget.of(`target-${this.created}`, 'https://example.test/hoja');
  }

  /**
   * Lo que la cuenta ya tiene en el destino, visto desde fuera de este navegador. `null` = no tiene
   * nada, y entonces sí toca crear. Es el caso de un dispositivo nuevo: aquí no hay nada recordado, pero
   * la hoja existe.
   */
  existing: SyncTarget | null = null;

  async locate(): Promise<SyncTarget | null> {
    return this.existing;
  }

  async exists(): Promise<boolean> {
    return this.targetAlive;
  }

  async probe(request: ProbeRequest): Promise<ProbeOutcome> {
    this.probed.push(request);
    if (this.failWith) {
      throw this.failWith;
    }
    return { echo: this.echo ?? request.probe.value };
  }
}

/** Las hojas recordadas, en memoria y por cuenta, con la misma semántica que la real. */
@Injectable()
export class FakeSyncTargetRepository extends SyncTargetRepository {
  private readonly byAccount = new Map<string, SyncTarget>();

  async forAccount(accountId: string): Promise<SyncTarget | null> {
    return this.byAccount.get(accountId) ?? null;
  }

  async save(accountId: string, target: SyncTarget): Promise<void> {
    this.byAccount.set(accountId, target);
  }

  async remove(accountId: string): Promise<void> {
    this.byAccount.delete(accountId);
  }

  /** Cuántas cuentas tienen hoja recordada. Para asertar que no se crea de más. */
  count(): number {
    return this.byAccount.size;
  }
}

/** Sesión falsa. `credentials = null` simula que no hay cuenta conectada. */
@Injectable()
export class FakeCredentialsProvider extends CredentialsProvider {
  credentials: UserCredentials | null = {
    token: 't-1',
    epoch: 1,
    accountId: 'cuenta-1',
    accountEmail: 'chef@example.test',
  };

  async current(): Promise<UserCredentials | null> {
    return this.credentials;
  }
}

/**
 * El destino, en memoria.
 *
 * Guarda lo que se le escribe con la misma forma con la que lo devuelve, así que un ciclo seguido de
 * otro ve lo que dejó el primero — que es lo que hace posible probar la idempotencia sin red.
 */
@Injectable()
export class FakeRemoteRepository extends RemoteRepository {
  snapshot: RemoteSnapshot = { tables: [] };
  readonly written: WriteRequest[] = [];
  readonly requested: ReadRequest[] = [];
  reads = 0;
  failWith: Error | null = null;
  /**
   * Un gancho para hacer que el mundo cambie **mientras** se lee.
   *
   * Es la única forma de provocar la carrera que de verdad ocurre: la pantalla de cuenta reemplaza la
   * hoja justo cuando un ciclo ya la estaba leyendo. Sin esto habría que doblar el doble.
   */
  beforeRead: (() => Promise<void>) | null = null;

  async read(request: ReadRequest): Promise<RemoteSnapshot> {
    this.reads += 1;
    this.requested.push(request);
    await this.beforeRead?.();
    if (this.failWith) {
      throw this.failWith;
    }
    return this.snapshot;
  }

  async write(request: WriteRequest): Promise<WriteOutcome> {
    this.written.push(request);
    if (this.failWith) {
      throw this.failWith;
    }
    return { applied: {}, requests: 1 };
  }

  /** Todas las escrituras de un tipo, aplanadas. Para asertar sin recorrer los lotes a mano. */
  writesOf<Kind extends RemoteWrite['kind']>(kind: Kind): Extract<RemoteWrite, { kind: Kind }>[] {
    return this.written
      .flatMap((request) => request.writes)
      .filter((write): write is Extract<RemoteWrite, { kind: Kind }> => write.kind === kind);
  }
}

/** Las tablas de aquí, en memoria, con la misma semántica que las de verdad. */
@Injectable()
export class FakeLocalRepository extends LocalRepository {
  readonly tables = new Map<string, TableRow[]>();
  /** Cuántas transacciones se han abierto. Para asertar que se escribe en bloque y no fila a fila. */
  writes = 0;

  async all(table: string): Promise<TableRow[]> {
    return [...(this.tables.get(table) ?? [])];
  }

  async putAll(table: string, rows: readonly TableRow[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    this.writes += 1;
    const current = new Map((this.tables.get(table) ?? []).map((row) => [row.id, row]));
    for (const row of rows) {
      current.set(row.id, row);
    }
    this.tables.set(table, [...current.values()]);
  }
}

/** La base de la fusión, en memoria, con la misma semántica que la real. */
@Injectable()
export class FakeSyncShadow extends SyncShadow {
  private readonly rows = new Map<string, ShadowRow>();

  async all(): Promise<ShadowRow[]> {
    return [...this.rows.values()];
  }

  async put(row: ShadowRow): Promise<void> {
    this.rows.set(`${row.table}:${row.rowId}`, row);
  }

  async putAll(rows: readonly ShadowRow[]): Promise<void> {
    for (const row of rows) {
      await this.put(row);
    }
  }

  async remove(table: string, rowId: string): Promise<void> {
    this.rows.delete(`${table}:${rowId}`);
  }

  async clear(): Promise<void> {
    this.rows.clear();
  }
}

/**
 * Identidad de dispositivo fija.
 *
 * Es un valor **estable y legible** a propósito: entra en la versión de cada fila, así que un
 * identificador aleatorio haría que los asertos sobre versiones cambiaran en cada corrida. Los specs
 * que necesiten dos dispositivos distintos cambian este campo.
 */
@Injectable()
export class FakeDeviceIdentity extends DeviceIdentity {
  deviceId = 'dev00001';

  async current(): Promise<string> {
    return this.deviceId;
  }
}

/**
 * Coordinación falsa entre pestañas. Por defecto esta pestaña es la que trabaja, que es el caso de una
 * sola pestaña; `leader = false` simula que otra la tiene.
 */
@Injectable()
export class FakeSyncCoordinator extends SyncCoordinator {
  private readonly leader = signal(true);
  readonly isLeader: Signal<boolean> = this.leader.asReadonly();

  claims = 0;
  announces = 0;
  private readonly handlers: (() => void)[] = [];

  claim(): void {
    this.claims += 1;
  }

  announce(): void {
    this.announces += 1;
  }

  onAnnounced(handler: () => void): void {
    this.handlers.push(handler);
  }

  /** Simula que otra pestaña acabó de sincronizar. */
  otherTabAnnounced(): void {
    for (const handler of this.handlers) {
      handler();
    }
  }

  setLeader(value: boolean): void {
    this.leader.set(value);
  }
}

/**
 * Config de despliegue falsa. `pollSeconds` empieza en el mismo valor que el default de producción
 * para no alterar los tiempos que ya prueban los specs existentes de `SyncScheduler`.
 */
@Injectable()
export class FakeAppConfig extends AppConfig {
  pollSeconds = 120;

  readonly debug = false;

  get integration(): IntegrationConfig {
    return { googleClientId: null, authApiUrl: null };
  }

  get sync(): SyncConfig {
    return { pollSeconds: this.pollSeconds };
  }
}

/** Providers listos para el TestBed de cualquier spec del contexto. */
export function makeExternalSyncFakes(): { providers: Provider[] } {
  return {
    providers: [
      { provide: Logger, useClass: ConsoleLogger },
      FakeAppConfig,
      FakeSyncOutbox,
      FakeSyncGateway,
      FakeSyncTargetRepository,
      FakeCredentialsProvider,
      FakeDeviceIdentity,
      FakeRemoteRepository,
      FakeLocalRepository,
      FakeSyncShadow,
      FakeSyncCoordinator,
      { provide: SyncCoordinator, useExisting: FakeSyncCoordinator },
      { provide: SyncOutbox, useExisting: FakeSyncOutbox },
      { provide: SyncGateway, useExisting: FakeSyncGateway },
      { provide: RemoteRepository, useExisting: FakeRemoteRepository },
      { provide: LocalRepository, useExisting: FakeLocalRepository },
      { provide: SyncShadow, useExisting: FakeSyncShadow },
      { provide: SyncTargetRepository, useExisting: FakeSyncTargetRepository },
      { provide: CredentialsProvider, useExisting: FakeCredentialsProvider },
      { provide: DeviceIdentity, useExisting: FakeDeviceIdentity },
      { provide: SyncStatus, useClass: InMemorySyncStatus },
      { provide: EventBus, useClass: FakeEventBus },
      { provide: AppConfig, useExisting: FakeAppConfig },
    ],
  };
}
