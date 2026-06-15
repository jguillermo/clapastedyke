# E2E Test Conventions

Applies to files in `tests/e2e/`.

## Dos modos de testing E2E

Los tests E2E se dividen en **dos modos con reglas distintas**. Todo flujo o componente nuevo
debe tener cobertura E2E — **no es opcional**.

### Modo 1 — Flujos de negocio (features que tocan `core/`)

Todo flujo de negocio **debe** tener un test de flujo completo. No existe la opción de "lo
testeo después":

- El test empieza en el punto de entrada del usuario y termina en el **estado terminal observable**
  (dato guardado, ruta cambiada, elemento ocultado de forma permanente).
- Ningún test puede terminar en un estado intermedio (modal abierto, spinner visible, botón apareció).
- Naming con `→`: `"crear receta → guardar → aparece en listado"`.
- Aplica a todo lo que toque `core/` (recipe-book, progression, y cualquier contexto futuro).

### Modo 2 — Componentes UI (showcase `/ui`)

Los componentes del design system se testean **exhaustivamente** por estado y variante:

- Un `describe` por componente, un test por estado/variante/interacción.
- Validar DOM semántico: roles ARIA, `aria-label`, `aria-describedby`, `aria-disabled`.
- Validar interacción de teclado: Tab, Enter, Escape, flechas donde aplique.
- **No aplica la regla de "terminal state"**: el objetivo es cobertura de estados, no de flujos.
- Ejemplo: `Button → variant primary → click → dispara acción`, `Button → disabled → click → no dispara`.
- Usar `data-test-id` estables en el showcase; se añaden conforme se escribe cada test.

---

## CRITICAL: complete flows always win over intermediate state tests

**A complete flow test is always more valuable than an intermediate state test.**

An intermediate state test (button appeared, spinner visible, modal opened) only proves that one step worked — it says nothing about whether the feature actually works end-to-end. A complete flow test proves the entire user journey works. When you have to choose between the two, always write the complete flow test.

If a complete flow test would be "too long", that is not a reason to split it into intermediate tests — it is a reason to extract a helper function and keep the complete flow intact.

## Core principle: complete flows, not intermediate states

Every E2E test must exercise a **complete user flow** from entry point to final observable outcome. A test that only asserts an intermediate state (a button appeared, a spinner is visible, a modal opened) is not a complete flow test.

**Wrong — tests an intermediate state:**
```typescript
test('shows retry button when apply fails', async () => {
    server.mockApplyUpdate('error', { errorBehavior: 500 });
    await triggerApply();
    await expect(firstWindow.locator('[data-test-id="update-retry-apply-button"]')).toBeVisible();
});
```

**Correct — tests a complete flow:**
```typescript
test('server error (5xx) → retry → success → dismiss → update card hidden', async () => {
    server.mockApplyUpdate('error', { errorBehavior: 500 });
    await triggerApply();
    server.mockApplyUpdate('success');
    await firstWindow.locator('[data-test-id="update-retry-apply-button"]').click();
    await firstWindow.locator('[data-test-id="update-dismiss-button"]').waitFor({ state: 'visible', timeout: 10000 });
    await firstWindow.locator('[data-test-id="update-dismiss-button"]').click();
    await expect(firstWindow.locator('[data-test-id="update-now-button"]')).not.toBeVisible();
});
```

`waitFor()` calls are allowed and necessary to drive the UI between steps — they are not "intermediate assertions". The distinction is: **`waitFor` drives the flow, `expect` asserts the final outcome**.

## What counts as a final state

A final state is a point where the user can take no further meaningful action within the scope of the feature under test, or where the system has reached a stable terminal condition:

- A page/route has changed (navigated to a new screen)
- A UI element has been permanently hidden (card hidden, modal closed)
- The user is stuck and must interact with an external escape (e.g. navigate away via router)
- An error loop is stable (retry button persists, no alternative action available)

## Mapping flows before writing tests

Before writing tests for a feature, map the **state machine** of the component under test:

1. **Read the component's inputs** — they define the context-specific configuration
2. **Read the outputs and their handlers in the consuming template** — they define what constitutes a terminal state in this specific context
3. **Enumerate every path** through the state machine from entry to terminal state
4. **Write one test per path**

### Example — mapping `app-update` in settings context

Settings template:
```html
<app-update
    (noUpdates)="showUpdate.set(false)"
    (postponed)="showUpdate.set(false)"
    (dismissed)="showUpdate.set(false)"
    (cancelled)="showUpdate.set(false)"
/>
```

From the template: terminal state = `showUpdate.set(false)` = card hidden. Every test must end with the card hidden (or the stuck-on-error state if no exit exists).

State machine paths:
```
checking → noUpdates                                      → card hidden
checking → updatesFound → postpone                        → card hidden
checking → updatesFound → modal cancel                    → card hidden
checking → updatesFound → modal confirm → success → dismiss → card hidden
checking → checkError → retry → (any of the above)
applying → applyError → retry → success → dismiss         → card hidden
applying → applyError → retry fails → (no exit in settings, stuck on retry)
```

Each path becomes one test.

## Coverage requirement

All paths through the state machine must be covered. When a context adds configuration (e.g. `showCancelOnError=true` in setup vs `false` in settings), the paths diverge — cover both variants.

**Checklist before calling coverage complete:**
- [ ] Every terminal output of the component is reachable via at least one test
- [ ] Every error recovery path (retry, cancel-on-error) is exercised to completion
- [ ] Context-specific configuration differences are covered (e.g. cancel button present/absent)
- [ ] No path through the state machine is left untested

## Test naming

Test names must describe the complete flow, not the component state:

| Wrong | Correct |
|---|---|
| `shows retry button on check error` | `check error → retry → no updates → card hidden` |
| `clicking Update Now opens modal` | `updates found → Update Now → cancel modal → card hidden` |
| `success state is shown after apply` | `updates found → confirm → success → dismiss → card hidden` |

Use `→` as separator between steps in the name.

## Extracting helpers

When multiple tests share a repeated sequence of steps (≥ 4 lines), extract a named helper:

```typescript
/** Update Now → confirm modal → wait for dismiss → click dismiss. */
const confirmUpdateAndDismiss = async (): Promise<void> => {
    await firstWindow.locator('[data-test-id="update-now-button"]').waitFor({ state: 'visible', timeout: 10000 });
    await firstWindow.locator('[data-test-id="update-now-button"]').click();
    await firstWindow.locator('[data-test-id="update-warning-confirm-button"]').click();
    await firstWindow.locator('[data-test-id="update-dismiss-button"]').waitFor({ state: 'visible', timeout: 10000 });
    await firstWindow.locator('[data-test-id="update-dismiss-button"]').click();
};
```

- Helpers that are shared across `describe` groups → define at the outer `describe` scope
- Helpers only used within one group → define inside that `describe`
- Helper names must describe the action sequence, not the UI element

## How to validate a test file

When asked to "validate" or "revisar" a test file against these conventions, always:

1. **Read the current file from disk** — never use git history, diffs, or cached versions. The review must reflect the actual current state of the file.
2. **Check every test** against the rules below and produce a diagnostic:

### Diagnostic checklist

For each test in the file, verify:

| Rule | Check |
|---|---|
| Complete flow | Does the final `expect()` assert a terminal state, not an intermediate one? |
| Naming | Does the name use `→` and describe the full path, not a UI element? |
| No intermediate assertions | Are there any `expect()` calls mid-test before the final state? |

Then verify coverage across the whole file:

| Rule | Check |
|---|---|
| All paths covered | Is every path through the state machine represented by at least one test? |
| Config differences | Are context-specific inputs (showPostpone, showCancelOnError, etc.) exercised? |
| Error recovery | Are all retry/cancel paths exercised to their terminal state? |

### Diagnostic output format

Report findings grouped as:

- **Violations** — tests that break a rule (with the rule name and what to fix)
- **Missing flows** — paths through the state machine with no test
- **Verdict** — PASS (all rules satisfied, all flows covered) or FAIL (list what's wrong)

## Structure

```
tests/e2e/<feature>/
└── <feature>.<context>.spec.ts   # One spec per context (setup, settings, etc.)
```

Group tests by the phase/scenario they start from, not by the element they interact with:

```typescript
test.describe('No updates', () => { ... });
test.describe('Updates available', () => { ... });
test.describe('Check error', () => { ... });
test.describe('Apply error', () => { ... });
```

Each `describe` has a `beforeEach` that sets up server mocks and launches the app.