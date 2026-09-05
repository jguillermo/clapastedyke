import { TestBed } from '@angular/core/testing';
import { ConsoleLogger } from '@core/_common/logger/console-logger';
import { Logger } from '@core/_common/logger/logger';
import { SyncOutbox } from '@core/external-sync/domain/services/sync-outbox';
import { SyncStatus } from '@core/external-sync/domain/services/sync-status';
import { InMemorySyncStatus } from '@core/external-sync/infrastructure/in-memory-sync-status';
import { FakeSyncOutbox } from '@core/external-sync/testing/external-sync-test-doubles';
import { Session } from '@core/auth/domain/services/session';
import { InMemorySession } from '@core/auth/infrastructure/in-memory-session';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // El armazón monta el aviso de sincronización, que mira DOS cosas: en qué punto va el ciclo
      // (`WatchSyncStatus`) y si hay conexión con el servicio de sesión (`WatchSession`) — sin lo
      // segundo diría «Reconectar» a quien solo está sin cobertura. De ahí los dos grupos de dobles.
      //
      // No se enchufan `provideExternalSync()` ni `provideAuth()` porque traerían sus
      // app-initializers —el planificador, la puerta de arranque, la reanudación de sesión—, y aquí
      // solo se comprueba que el armazón se pinta. Las dos implementaciones son de memoria, así que
      // valen tal cual: doblarlas solo añadiría una mentira que mantener.
      providers: [
        { provide: Logger, useClass: ConsoleLogger },
        { provide: SyncStatus, useClass: InMemorySyncStatus },
        { provide: SyncOutbox, useClass: FakeSyncOutbox },
        { provide: Session, useClass: InMemorySession },
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
