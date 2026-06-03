# Main Process Conventions

Applies to files in `app/src/`.

## Structure

The main process is **flat** at the top level — no DDD layers (`domain/`, `infrastructure/`, `application/`). The `device/` module is the exception: it uses subfolders that mirror the `DeviceApi` interface declared in `src/window-interface/device/device-api.d.ts`.

```
app/src/
├── _common/                # Structural utilities — no state, no lifecycle
│   ├── ipc-context.ts      # IpcContext, IpcModule, ServiceContainer interfaces
│   ├── shell.ts            # Centralized command execution (promisified execFile)
│   └── env.preload.ts      # Environment variables exposed to renderer
├── _infra/                 # Infrastructure services — state, lifecycle, managed by ServiceContainer
│   ├── logger/             # electron-log configuration and export
│   ├── event-bus/          # RabbitMQ/NATS generic transport
│   ├── external-display/   # Secondary display window management
│   ├── streaming/          # Media streaming service
│   ├── usb/                # USB device listing and monitoring
│   └── asset-protocol/     # `atsp-asset://` custom scheme router (see asset-protocol-conventions.md)
├── service-container.ts    # Composition root — creates and wires all services
├── ipc-handlers.ts         # Aggregator — registers all IpcModules
├── preload.ts              # Aggregator — exposes APIs via contextBridge
├── device/                 # Compound module — mirrors DeviceApi
│   ├── device.preload.ts   # Composes sub-APIs → DeviceApi shape
│   ├── device.handlers.ts  # Delegates to sub-module IpcModules
│   ├── identity/           # getId, getInfo
│   ├── control/            # restart, shutdown, factoryReset
│   ├── connectivity/       # getStatus, network, wifi
│   ├── peripherals/        # USB devices
│   └── settings/           # get, update, restore
├── hub-discovery/          # Domain module
├── license/                # Domain module
├── simulation/             # Domain module
├── device-config/          # External config loader (/etc/atsp-launcher/config.json)
└── ...
```

## Module structure

Each domain module follows the pattern established by `hub-discovery/` (reference implementation):

```
app/src/<module>/
├── <module>.handlers.ts     # Main process side — ipcMain.handle(), exports IpcModule
├── <module>.preload.ts      # Renderer side — ipcRenderer.invoke(), thin gateway
├── <module>.enum.ts         # IPC channel names as string enum (shared by both sides)
├── <module>.service.ts      # Business logic (filesystem, OS, network, subprocess)
├── <module>.types.ts        # IPC contract types (NOT Angular domain types)
├── <module>.validator.ts    # Input validation at the IPC boundary
├── <module>.error-mapper.ts # Translates JS errors → typed IPC errors
├── <module>.logger.ts       # Logger with scoped name
└── <module>.namespace.ts    # Optional — `AssetNamespaceHandler` if the module owns an `atsp-asset://` namespace
```

### The `device/` compound module

`device/` is organized into subfolders that mirror the `DeviceApi` interface:

```
app/src/device/
├── device.preload.ts          # Composes sub-APIs into DeviceApi shape
├── device.handlers.ts         # Aggregates sub-module IpcModules
├── identity/
│   ├── identity.enum.ts
│   ├── identity.handlers.ts
│   ├── identity.preload.ts
│   ├── identity.service.ts
│   └── identity.types.ts
├── control/
│   ├── control.enum.ts
│   ├── control.handlers.ts
│   └── control.preload.ts
├── connectivity/
│   ├── connectivity.enum.ts
│   ├── connectivity.handlers.ts
│   ├── connectivity.preload.ts
│   ├── connectivity.monitor.ts
│   ├── network.service.ts
│   └── wifi.service.ts
├── peripherals/
│   ├── peripherals.enum.ts
│   ├── peripherals.handlers.ts
│   ├── peripherals.preload.ts
│   └── usb.service.ts
└── settings/
    ├── settings.enum.ts
    ├── settings.handlers.ts
    ├── settings.preload.ts
    ├── settings.service.ts
    └── settings.schema.ts
```

`device.preload.ts` composes all sub-preloads into a single object matching `DeviceApi`:

```typescript
export const DeviceApi = {
    getId: identityApi.getId,
    getInfo: identityApi.getInfo,
    restart: controlApi.restart,
    shutdown: controlApi.shutdown,
    factoryReset: controlApi.factoryReset,
    connectivity: connectivityApi,
    peripherals: peripheralsApi,
    settings: settingsApi,
};
```

`device.handlers.ts` delegates registration to each sub-module:

```typescript
export const deviceModule: IpcModule = {
    register(ctx): void {
        identityModule.register(ctx);
        controlModule.register(ctx);
        connectivityModule.register(ctx);
        peripheralsModule.register(ctx);
        settingsModule.register(ctx);
    },
};
```

### Naming: handlers vs preload

Each IPC module has two sides:

| File | Process | Role | Contains |
|---|---|---|---|
| `*.handlers.ts` | **Main** | Receives IPC calls | `ipcMain.handle()`, exports `IpcModule` |
| `*.preload.ts` | **Renderer** | Sends IPC calls | `ipcRenderer.invoke()`, thin typed gateway |

Both files live in the same module folder and share the same `*.enum.ts` for channel names.

### IPC channel naming convention

Channel names use `camelCaseNamespace:camelCaseAction`:

```typescript
// Correct
enum IdentityEnum {
    GET_ID = 'deviceIdentity:getId',
    GET_INFO = 'deviceIdentity:getInfo',
}

// Wrong — kebab-case
enum IdentityEnum {
    GET_ID = 'device-identity:id',
}
```

### IpcModule pattern

Each `*.handlers.ts` exports an `IpcModule`. Handlers receive services from `IpcContext` — they never instantiate services directly.

```typescript
// license/license.handlers.ts
export const licenseModule: IpcModule = {
    register({ app, services }): void {
        ipcMain.handle(LicenseEnum.GET, () => services.domain.license.get(app.getPath('userData')));
    },
};
```

Not all modules need all files. The minimum is:

- `*.handlers.ts` — always (IpcModule with register function)
- `*.preload.ts` — always (preload API for the renderer)
- `*.enum.ts` — always (typed IPC channels, no string literals)
- `*.service.ts` — when there is logic beyond simple read/write

## Service container and dependency injection

The main process uses a **simple DI container** — no framework, no decorators, just constructor injection and a centralized composition root.

### Composition root: `service-container.ts`

All services are instantiated once in `createServiceContainer()`. This is the only place where `new` is called for services. The container is split into two sub-interfaces — `DomainServices` (business logic) and `InfrastructureServices` (generic mechanisms):

```typescript
// service-container.ts
export interface DomainServices {
    license: LicenseService;
    connectivity: ConnectivityService;
    identity: DeviceIdentityService;
    settings: DeviceSettingsService;
}

export interface InfrastructureServices {
    usb: UsbService;
    eventBus: RabbitMQDeviceEventBus;
    streaming: StreamingService;
    externalDisplay: ExternalDisplayService;
}

export interface ServiceContainer {
    domain: DomainServices;
    infra: InfrastructureServices;
}

export function createServiceContainer(options: ServiceContainerOptions): ServiceContainer {
    const domain: DomainServices = {
        license: new LicenseService(),
        connectivity: new ConnectivityService(),
        identity: new DeviceIdentityService(),
        settings: new DeviceSettingsService(),
    };

    const infra: InfrastructureServices = {
        usb: new UsbService(),
        eventBus: new RabbitMQDeviceEventBus(),
        streaming: new StreamingService(),
        externalDisplay: new ExternalDisplayService(options.serve, options.preloadPath),
    };

    return { domain, infra };
}
```

### Rules

| Rule | Detail |
|---|---|
| Services receive dependencies via constructor | Never instantiate dependencies inside a service — receive them as constructor parameters |
| Handlers never instantiate services | Handlers receive services from `IpcContext.services` |
| `service-container.ts` is the only `new` site | Adding a new service means adding it here and to `DomainServices` or `InfrastructureServices` |
| `_common/ipc-context.ts` imports `ServiceContainer` | But does NOT import concrete service classes — only the interface from `service-container.ts` |

### Adding a new service

1. Create the service class with constructor injection for its dependencies
2. Add it to `DomainServices` (business logic) or `InfrastructureServices` (generic mechanism) in `service-container.ts`
3. Instantiate it in `createServiceContainer()`, wiring its dependencies
4. If it manages long-lived resources, add init/cleanup calls to `initServiceContainer()` and `destroyServiceContainer()`
5. Use it in handlers via `services.domain.myService` or `services.infra.myService`

```typescript
// 1. Service with constructor injection
export class MyService {
    constructor(private readonly dep: SomeDependency) {}
    init(): void { /* start listeners, connections */ }
    stop(): void { /* cleanup */ }
}

// 2-3. Add to the appropriate sub-interface
export interface DomainServices {
    // ...existing services
    myService: MyService;
}

export function createServiceContainer(options: ServiceContainerOptions): ServiceContainer {
    const domain: DomainServices = {
        // ...existing wiring
        myService: new MyService(existingDep),
    };
    // ...
    return { domain, infra };
}

// 4. Register lifecycle
export async function initServiceContainer(services: ServiceContainer): Promise<void> {
    services.domain.myService.init();
}

export async function destroyServiceContainer(services: ServiceContainer): Promise<void> {
    services.domain.myService.stop();
}

// 5. Use in handler
register({ services }): void {
    ipcMain.handle(Channel.DO_THING, () => services.domain.myService.doThing());
}
```

## Service lifecycle

`service-container.ts` exposes symmetric lifecycle functions — `initServiceContainer()` and `destroyServiceContainer()`. `main.ts` calls them on `app.on('ready')` and `app.on('will-quit')` respectively:

```typescript
// main.ts
app.on('ready', async () => {
    services = registerIpcHandlers(win, app);
    await initServiceContainer(services);
});

app.on('will-quit', async () => {
    await destroyServiceContainer(services);
});
```

`main.ts` does not know which services require initialization or cleanup — that is an internal detail of the container.

```typescript
// service-container.ts
export async function initServiceContainer(services: ServiceContainer): Promise<void> {
    services.infra.externalDisplay.init();
    await services.infra.eventBus.init();
}

export async function destroyServiceContainer(services: ServiceContainer): Promise<void> {
    services.infra.externalDisplay.stop();
    services.infra.usb.stopMonitor();
    services.infra.streaming.stop();
    await services.infra.eventBus.destroy();
}
```

When adding a new service with resources, always:
1. Add an init method to the service if it requires async setup
2. Call it in `initServiceContainer()`
3. Add a cleanup method (`destroy()`, `stop()`, `disconnect()`)
4. Call it in `destroyServiceContainer()`

## `_common/` vs `_infra/`

The main process has two cross-cutting folders with distinct purposes:

### `_common/` — structural utilities

Stateless functions, types, and constants used by the app's wiring. No lifecycle, no state, no `ServiceContainer` presence.

| File | Purpose |
|---|---|
| `ipc-context.ts` | `IpcContext`, `IpcModule` interfaces |
| `shell.ts` | Centralized `execFile` wrapper |
| `env.preload.ts` | Static environment variables for the renderer |

**Rule:** if it has no state and no lifecycle, it belongs in `_common/`.

### `_infra/` — infrastructure services

Services with state, lifecycle, or connections — managed by `ServiceContainer.infra`. They carry no business semantics; if the underlying technology changes (e.g., RabbitMQ → NATS), the API shape stays the same.

| Module | Purpose |
|---|---|
| `logger/` | electron-log configuration and scoped logging |
| `event-bus/` | RabbitMQ/NATS generic transport |
| `external-display/` | Secondary display window management |
| `streaming/` | Media streaming service |
| `usb/` | USB device listing and monitoring |
| `asset-protocol/` | `atsp-asset://` custom scheme router. Dispatches by URL host to per-domain `AssetNamespaceHandler`s. Concrete handlers live in their domain module (`<module>.namespace.ts`), not here — see [asset-protocol-conventions.md](asset-protocol-conventions.md) |

**Rule:** if it goes in `ServiceContainer.infra`, it lives in `_infra/`.

Domain modules (`hub-discovery/`, `license/`, `device/`) do NOT belong in either folder.

### `_dev/` — dev-only implementations, stripped from packaged builds

Subfolder inside a domain module that holds implementations only meant to run during local development (typically swapping a production class for a stubbed variant gated by an env var). The folder is excluded from the `.deb` via `electron-builder.json` (`!**/_dev/**`), so its contents never ship to production.

| Example | Purpose |
|---|---|
| `simulation/_dev/stub-simulation-launcher.ts` | Alternative `SimulationLauncher` that spawns `tests/stubs/simulation/run-stub.ts` instead of the real binary when `ATSP_SIM_DEV_MODE=true` |

**Rules:**

- Production code must NOT statically import from `_dev/` — that would break when the folder is absent. Load conditionally inside `service-container.ts` via `require()` (gated by the env var), e.g.:
  ```ts
  if (process.env.ATSP_SIM_DEV_MODE === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { StubSimulationLauncher } = require('./simulation/_dev/stub-simulation-launcher');
      return new StubSimulationLauncher();
  }
  ```
- `_dev/` implementations must satisfy the same domain interface as their production counterparts (`SimulationLauncher`, etc.) — the swap happens entirely at the composition root.
- Do NOT use `_dev/` for tests or fixtures. Tests live in `tests/`; fixtures co-located with their spec. `_dev/` is strictly for runtime implementations used by `npm start`.

## Logging

All main process files must import the logger from `_infra/logger` — never directly from `electron-log`. This ensures consistent configuration (log levels, file rotation, file name).

```typescript
// Correct
import Log from '../_infra/logger';

// For scoped logging
import Logger from '../_infra/logger';
const Log = Logger.scope('ModuleName');

// Wrong — bypasses centralized configuration
import * as Log from 'electron-log';
```

The renderer writes to the same log file via `window.logger`, which is exposed through the preload and backed by the same `_common/logger` instance.

Log file: `~/.config/atsp-launcher/logs/atsp-launcher.log` (5MB max, rotated to `archive/`).

## Shell commands

All command execution in the main process must go through `_common/shell.ts` — never import `execFile` or `exec` directly from `child_process`. This centralizes the `promisify` + type assertion workaround needed in Electron and keeps a single pattern across modules.

```typescript
// Correct — use shell()
import { shell } from '../_common/shell';

const { stdout } = await shell('apt-cache', ['policy']);
const { stdout } = await shell('lsusb', []);

// Wrong — direct child_process import
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
```

**Exception:** `spawn` is used directly when streaming output is needed (e.g., `udevadm monitor` in `UsbService`). `shell()` is only for fire-and-wait commands.

## Filesystem access

Use `fs/promises` directly for file operations — never wrap it in a custom class. The `_common/filesystem.service.ts` class is **deprecated** and must not be used in new code.

```typescript
// Correct — fs/promises directly
import { readFile, writeFile } from 'fs/promises';

const content = await readFile(path, 'utf-8');

// Wrong — custom FileSystem class
import FileSystem from '../_common/filesystem.service';
const fs = new FileSystem();
const content = await fs.readFile(path);
```

## Module isolation

| Rule | Example |
|---|---|
| No imports between top-level modules | `hub-discovery/` does not import `license/license.service.ts` |
| Services never depend on services from other modules | `DeviceIdentityService` must NOT receive `LicenseService` via constructor |
| IPC types are module-scoped | `hub-discovery.types.ts` defines `HubInfo`, does not reuse types from other modules |
| Within `device/`, sub-modules may import sibling services | `identity.service.ts` receives `ConnectivityService` — this is wired in `service-container.ts` |

## Cross-module orchestration belongs in handlers

When an IPC response requires data from **multiple modules**, the handler orchestrates — not the service. Services must only contain logic from their own module. The handler has access to all services via `ServiceContainer`, making it the natural composition point.

```typescript
// Correct — handler orchestrates cross-module data
ipcMain.handle(IdentityEnum.GET_INFO, async (): Promise<DeviceInfoPayload> => {
    const deviceId = await services.domain.identity.getId();
    const licenseData = services.domain.license.decode(app.getPath('userData'));
    const ipAddress = services.domain.connectivity.getIpAddress();
    const channel = await services.domain.identity.getChannel(licenseData.assignment?.['type'].toLowerCase());
    return { deviceId, licenseData, ipAddress, channel };
});

// Wrong — service imports from another module
export class DeviceIdentityService {
    constructor(
        private readonly license: LicenseService,  // ← cross-module dependency
    ) {}

    async getInfo(): Promise<DeviceInfoPayload> {
        const licenseData = this.license.decode(...);  // ← belongs in handler
    }
}
```

**Rule of thumb:** if a service needs to import from another top-level module, the logic belongs in the handler instead.

## Services must not know about BrowserWindow

Services contain business logic — they spawn processes, read files, manage connections. They must **never** receive or use `BrowserWindow` (or `webContents`). The handler is responsible for deciding what to communicate to the renderer and when.

```typescript
// Correct — service exposes a callback, handler decides where to send the result
export class SimulationService {
    onExit(callback: ExitCallback): void { ... }
}

// Handler bridges service → renderer
simulation.onExit((result, error) => {
    win.webContents.send(SimulationEnum.STATE_CHANGE, { state: 'completed' });
});

// Wrong — service coupled to BrowserWindow
export class SimulationService {
    constructor(private readonly win: BrowserWindow) {}

    async launch(): Promise<void> {
        this.win.webContents.send(STATE_CHANGE, { state: 'running' }); // ← coupled
    }
}
```

**Why:**

| Concern | Service with `win` | Service without `win` |
|---|---|---|
| Unit testing | Must mock `BrowserWindow` + `webContents` | Test callback invocation with plain assertions |
| Reusability | Emits IPC as side effect — callers can't opt out | Any caller (handler, health-check, another service) consumes the result its own way |
| Responsibility | Mixes "what happened" with "who to tell" | Only knows "what happened" — handler decides "who to tell" |

**Rule:** services know how to **do** things; handlers know **who to tell** that things happened. This mirrors Angular's separation — domain services don't know about HTTP, infrastructure adapters do.

## Types

Main process types are IPC contract types — they are NOT the Angular domain types. Each side of the boundary owns its own types:

```
Main process (IPC contract)          Angular domain
──────────────────────────           ──────────────
HubInfo { hubId, name, ip }    ←──   Hub { id, name, ip }
DiscoveryProgressEvent         ←──   DiscoveryState
HubDiscoveryResponse<T>        ←──   PairingResult
```

The **mapper** in Angular's `infrastructure/` translates between both worlds.

## Preload aggregator

`preload.ts` is the single entry point for the renderer process. It composes all preload APIs and exposes them via `contextBridge`:

| Window property | Source | Type |
|---|---|---|
| `window.device` | `device/device.preload.ts` | Domain — `DeviceApi` |
| `window.simulation` | `simulation/simulation.preload.ts` | Domain |
| `window.license` | `license/license.preload.ts` | Domain |
| `window.hubDiscovery` | `hub-discovery/hub-discovery.preload.ts` | Domain |
| `window.eventBus` | `_common/event-bus/event-bus.preload.ts` | Infrastructure |
| `window.logger` | `_common/logger/logger.preload.ts` | Infrastructure |
| `window.env` | `_common/env.preload.ts` | Infrastructure |
| `window.deviceConfigApi` | `device-config/device-config.ts` | Infrastructure |

The type contract for `window.device` is declared in `src/window-interface/device/device-api.d.ts`. The main process structure under `device/` mirrors this interface 1:1.

## Testing

### Unit tests

Unit tests for the main process use Jest (not Karma/Jasmine which is Angular-only). They are co-located with the source file: `foo.service.spec.ts` next to `foo.service.ts`.

```bash
npm run test:main:unit   # Run main process unit tests
```

Config: `jest.config.js` + `tsconfig.main-spec.json`.

### Integration tests

Integration tests verify behavior against real infrastructure (RabbitMQ, filesystem, network). They run in CI (see `.github/workflows/cicd.yml`) and locally require `docker compose up -d`.

```bash
docker compose up -d     # Start infrastructure (RabbitMQ, Keycloak)
npm run test:integration # Run integration tests
```

Config: `jest.integration.config.js` (extends `tsconfig.main-spec.json`). Environment overrides for Docker defaults live in `jest.integration.setup.js`.

#### Conventions

- File naming: `*.integration.spec.ts` — this is what separates them from unit tests
- Each test suite manages its own cleanup (delete queues, close connections)
- Use unique resource names per test to avoid cross-test contamination
- Tests must not depend on execution order
- `afterEach` / `afterAll` cleanup must be resilient (`.catch(() => {})`) to avoid cascading timeouts
