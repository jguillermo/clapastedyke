/**
 * Dobles de test del contexto `external-sync`: una cola en memoria con la misma máquina de estados
 * que la real, un destino que se puede programar para fallar, y fuentes falsas de credenciales y de
 * filas.
 *
 * El estado (`InMemorySyncStatus`) y el bus (`InMemoryEventBus`) se usan **de verdad**: ya son
 * implementaciones en memoria, así que doblarlos solo añadiría una mentira que mantener.
 */
import { Injectable, Provider, signal, Signal } from '@angular/core';
import { DomainEvent } from '../../_common/eventbus/domain-event';
import { EventBus, EventHandler } from '../../_common/eventbus/event-bus';
import {
  CredentialsProvider,
  UserCredentials,
} from '../../_common/credentials/credentials-provider';
import {
  ExportableData,
  ExportedRows,
  ExportQuery,
  ExportRef,
} from '../../_common/export/exportable-data';
import { ApplyOutcome, ImportableData, ImportChange } from '../../_common/import/importable-data';
import { DeviceIdentity } from '../domain/services/device-identity';
import { SyncReader } from '../domain/services/sync-reader';
import { RemoteSnapshot } from '../domain/services/sync-reader.types';
import { ShadowRow, SyncShadow } from '../domain/services/sync-shadow';
import { SyncGateway } from '../domain/services/sync.gateway';
import {
  MigrateRequest,
  ProbeOutcome,
  ProbeRequest,
  SyncOutcome,
  SyncRequest,
} from '../domain/services/sync.gateway.types';
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
  readonly sent: SyncRequest[] = [];
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

  async exists(): Promise<boolean> {
    return this.targetAlive;
  }

  async send(request: SyncRequest): Promise<SyncOutcome> {
    this.sent.push(request);
    if (this.failWith) {
      throw this.failWith;
    }
    return { applied: {} };
  }

  /** Cuántas veces se ha puesto al día la forma del destino, y con qué se llamó. */
  readonly migrated: MigrateRequest[] = [];

  async migrate(request: MigrateRequest): Promise<void> {
    this.migrated.push(request);
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

/** Lector falso: se le programa el estado remoto que debe devolver. */
@Injectable()
export class FakeSyncReader extends SyncReader {
  snapshot: RemoteSnapshot = { tables: [], schemaVersion: null };
  failWith: Error | null = null;
  reads = 0;

  async read(): Promise<RemoteSnapshot> {
    this.reads += 1;
    if (this.failWith) {
      throw this.failWith;
    }
    return this.snapshot;
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

/** Origen falso: devuelve una fila por cada referencia pedida (o una fija cuando se pide todo). */
@Injectable()
export class FakeExportableData extends ExportableData {
  readonly queries: ExportQuery[] = [];
  rows: ExportedRows | null = null;

  async export(query: ExportQuery): Promise<ExportedRows> {
    this.queries.push(query);
    if (this.rows) {
      return this.rows;
    }
    const refs = query.all ? [{ aggregate: 'recipe', id: 'todo' }] : query.refs;
    return { data: refs.map((ref) => ({ id: ref.id, aggregate: ref.aggregate })) };
  }
}

/**
 * Destino falso de lo que se trae de fuera. Por defecto acepta todo; `rejectIds` fuerza el caso
 * interesante: una fila que el origen no puede leer.
 */
@Injectable()
export class FakeImportableData extends ImportableData {
  readonly changes: ImportChange[] = [];
  /** Ids que se rechazan, para ejercitar la cuarentena. */
  rejectIds: string[] = [];

  async apply(change: ImportChange): Promise<ApplyOutcome> {
    this.changes.push(change);

    const refs: ExportRef[] = Object.entries(change.tables).flatMap(([table, rows]) =>
      rows.map((row) => ({
        aggregate: aggregateOf(table),
        id: String((row as Record<string, unknown>)['id'] ?? ''),
      })),
    );

    return {
      applied: [...refs.filter((ref) => !this.rejectIds.includes(ref.id)), ...change.deleted],
      rejected: refs
        .filter((ref) => this.rejectIds.includes(ref.id))
        .map((ref) => ({ ref, reason: 'la fila del test se rechaza a propósito' })),
    };
  }
}

/** Los nombres que usa el recetario, para que el doble hable como el de verdad. */
function aggregateOf(table: string): string {
  return (
    {
      supplies: 'supply',
      recipes: 'recipe',
      categories: 'category',
      flavors: 'flavor',
      capacities: 'capacity',
    }[table] ?? table
  );
}

/** Providers listos para el TestBed de cualquier spec del contexto. */
export function makeExternalSyncFakes(): { providers: Provider[] } {
  return {
    providers: [
      { provide: Logger, useClass: ConsoleLogger },
      FakeSyncOutbox,
      FakeSyncGateway,
      FakeSyncTargetRepository,
      FakeCredentialsProvider,
      FakeExportableData,
      FakeDeviceIdentity,
      FakeSyncReader,
      FakeSyncShadow,
      FakeImportableData,
      { provide: ImportableData, useExisting: FakeImportableData },
      { provide: SyncOutbox, useExisting: FakeSyncOutbox },
      { provide: SyncGateway, useExisting: FakeSyncGateway },
      { provide: SyncReader, useExisting: FakeSyncReader },
      { provide: SyncShadow, useExisting: FakeSyncShadow },
      { provide: SyncTargetRepository, useExisting: FakeSyncTargetRepository },
      { provide: CredentialsProvider, useExisting: FakeCredentialsProvider },
      { provide: ExportableData, useExisting: FakeExportableData },
      { provide: DeviceIdentity, useExisting: FakeDeviceIdentity },
      { provide: SyncStatus, useClass: InMemorySyncStatus },
      { provide: EventBus, useClass: FakeEventBus },
    ],
  };
}
