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
import { ExportableData, ExportedRows, ExportQuery } from '../../_common/export/exportable-data';
import { SyncGateway } from '../domain/services/sync.gateway';
import {
  ProbeOutcome,
  ProbeRequest,
  SyncOutcome,
  SyncRequest,
} from '../domain/services/sync.gateway.types';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncSetupSource } from '../domain/services/sync-setup-source';
import { SyncSetup } from '../domain/services/sync-setup.types';
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

/** Destino falso: registra los envíos y puede programarse para fallar el siguiente. */
@Injectable()
export class FakeSyncGateway extends SyncGateway {
  readonly sent: SyncRequest[] = [];
  readonly probed: ProbeRequest[] = [];
  failWith: Error | null = null;
  /**
   * Qué devuelve la comprobación de ida y vuelta. `null` = el eco correcto (lo que se mandó); un
   * string fuerza el caso interesante: el destino contesta bien pero lo leído no coincide.
   */
  echo: string | null = null;

  async send(request: SyncRequest): Promise<SyncOutcome> {
    this.sent.push(request);
    if (this.failWith) {
      throw this.failWith;
    }
    return { target: this.target(), applied: {} };
  }

  async open(): Promise<SyncTarget> {
    if (this.failWith) {
      throw this.failWith;
    }
    return this.target();
  }

  async probe(request: ProbeRequest): Promise<ProbeOutcome> {
    this.probed.push(request);
    if (this.failWith) {
      throw this.failWith;
    }
    return { target: this.target(), echo: this.echo ?? request.probe.value };
  }

  private target(): SyncTarget {
    return SyncTarget.of('target-1', 'https://example.test/hoja');
  }
}

/**
 * Fuentes falsas de la puesta en marcha. Por defecto viene todo resuelto; los tests vacían lo que
 * quieran para comprobar cómo se cuenta un hueco.
 */
@Injectable()
export class FakeSyncSetupSource extends SyncSetupSource {
  setup: SyncSetup = {
    snippets: [
      { id: 'script', value: 'function doPost() {}' },
      { id: 'manifest', value: '{ "runtimeVersion": "V8" }' },
      { id: 'clientId', value: '123-abc.apps.googleusercontent.com' },
      { id: 'origin', value: 'https://example.test' },
      { id: 'endpoint', value: 'https://script.example.test/exec' },
    ],
    configured: true,
  };

  async read(): Promise<SyncSetup> {
    return this.setup;
  }
}

/** Sesión falsa. `credentials = null` simula que no hay cuenta conectada. */
@Injectable()
export class FakeCredentialsProvider extends CredentialsProvider {
  credentials: UserCredentials | null = {
    token: 't-1',
    epoch: 1,
    accountEmail: 'chef@example.test',
  };

  async current(): Promise<UserCredentials | null> {
    return this.credentials;
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

/** Providers listos para el TestBed de cualquier spec del contexto. */
export function makeExternalSyncFakes(): { providers: Provider[] } {
  return {
    providers: [
      { provide: Logger, useClass: ConsoleLogger },
      FakeSyncOutbox,
      FakeSyncGateway,
      FakeSyncSetupSource,
      FakeCredentialsProvider,
      FakeExportableData,
      { provide: SyncOutbox, useExisting: FakeSyncOutbox },
      { provide: SyncGateway, useExisting: FakeSyncGateway },
      { provide: SyncSetupSource, useExisting: FakeSyncSetupSource },
      { provide: CredentialsProvider, useExisting: FakeCredentialsProvider },
      { provide: ExportableData, useExisting: FakeExportableData },
      { provide: SyncStatus, useClass: InMemorySyncStatus },
      { provide: EventBus, useClass: FakeEventBus },
    ],
  };
}
