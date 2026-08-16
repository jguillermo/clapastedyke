import { TestBed } from '@angular/core/testing';
import { ConsoleLogger } from '@core/_common/logger/console-logger';
import { Logger } from '@core/_common/logger/logger';
import { SyncOutbox } from '@core/external-sync/domain/services/sync-outbox';
import { SyncStatus } from '@core/external-sync/domain/services/sync-status';
import { InMemorySyncStatus } from '@core/external-sync/infrastructure/in-memory-sync-status';
import { FakeSyncOutbox } from '@core/external-sync/testing/external-sync-test-doubles';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // El armazón monta el aviso de sincronización, que inyecta `WatchSyncStatus`. No se enchufa
      // `provideExternalSync()` porque traería sus app-initializers —el planificador y la puerta de
      // arranque—, y aquí solo se comprueba que el armazón se pinta.
      providers: [
        { provide: Logger, useClass: ConsoleLogger },
        { provide: SyncStatus, useClass: InMemorySyncStatus },
        { provide: SyncOutbox, useClass: FakeSyncOutbox },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
