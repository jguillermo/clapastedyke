# Provider Conventions

Applies to `*.providers.ts` files across the application.

## Core principle

Each bounded context **owns its own DI bindings**. There is no central `default.providers.ts`. The composition root (`app.config.ts`) only aggregates — it does not decide implementations.

## Provider function pattern

Every context exposes a `provide*()` function that returns `EnvironmentProviders` via `makeEnvironmentProviders`. This follows the same pattern Angular uses internally (`provideRouter()`, `provideHttpClient()`).

```typescript
// core/device/device.providers.ts
export function provideDevice(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: DeviceIdentityService, useClass: LocalDeviceIdentityService },
        { provide: DeviceControlService, useClass: LocalDeviceControlService },
        { provide: DeviceSettingsService, useClass: LocalDeviceSettingsService },
    ]);
}
```

## Composition in app.config.ts

`app.config.ts` composes providers from all layers. It does not decide which implementation to use — that decision belongs to each context's `*.providers.ts`.

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        // core
        provideAuth(),
        provideDevice(),
        provideConnectivity(),
        provideLicense(),
        // platform
        providePlatform(),
    ],
};
```

## File location

| Layer | File | Example |
|---|---|---|
| Bounded context | `core/<context>/<context>.providers.ts` | `core/auth/auth.providers.ts` |
| Platform module | `platform/<module>/<module>.providers.ts` | `platform/error/error.providers.ts` |
| Platform aggregate | `platform/platform.providers.ts` | Composes all platform module providers |

## Rules

- **One providers file per context** — do not split bindings across multiple files within the same context
- **Never add bindings to `app.config.ts` directly** — always go through a `provide*()` function
- **Abstract → Concrete** — providers bind an abstract domain service to its concrete infrastructure implementation: `{ provide: DeviceIdentityService, useClass: LocalDeviceIdentityService }`
- **`providedIn: 'root'`** — use cases, guards, and non-domain feature/UI services use `@Injectable({ providedIn: 'root' })` and do NOT need to be listed in providers files. Only domain service → infrastructure bindings go in providers. Non-domain services are those without an abstract/concrete split that need to be swapped per environment — e.g. a virtual keyboard state holder, a UI-only coordinator, or a feature-local singleton.
- **No module-based providers** — there is no `AppModule`, `CoreModule`, or `SharedModule`. The app uses `bootstrapApplication` with `ApplicationConfig`.

## Testing

Provider functions make it easy to swap implementations in tests:

```typescript
TestBed.configureTestingModule({
    providers: [
        { provide: DeviceIdentityService, useClass: MockDeviceIdentityService },
    ],
});
```
