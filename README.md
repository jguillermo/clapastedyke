# Misaevol

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

End-to-end tests use [Playwright](https://playwright.dev/) and live **entirely** in the `e2e/`
folder (config, specs, page objects, fixtures and helpers). They exercise the views under
`src/app/features/` as complete user flows.

```bash
npm run test:e2e          # ng build + full suite (desktop 1280px + mobile 375px)
npm run test:e2e:ui       # the same, in Playwright's UI mode
npm run test:e2e:report   # open the last HTML report
```

The suite runs against the **compiled build** (`dist/misaevol/browser`), served by
`e2e/support/static-server.mjs` — no dev server needed. Conventions for writing them are in
[`.claude/rules/e2e-tests-conventions.md`](.claude/rules/e2e-tests-conventions.md).

## Google Sheets sync

Recipes and supplies can be backed up to a Google Sheets file in **each user's own Drive**. The app
creates that spreadsheet and writes it itself, through the Sheets and Drive REST APIs, using the
user's own token and the `drive.file` scope — which reaches only the files the app created. Nothing
is deployed into anyone's account, and users grant a single consent checkbox.

Publishing the app needs a one-time pass through Google Cloud (project, consent screen, OAuth Client
ID). Every step is in [`deploy/google-client-id.md`](deploy/google-client-id.md) — start there. Once
configured, users connect from the `/cuenta` screen; without it the app keeps working exactly as
before, fully local.

The reasoning behind that design — why a Google login is unavoidable, why the token travels in the
POST body, why reloading the page forces a reconnect, and which alternatives were measured and
rejected — is in [`manual/google-integration.md`](manual/google-integration.md). All technical
documentation lives in [`manual/`](manual/).

## Deployment

The app is published to **Firebase Hosting** by a **manual** workflow — merging to `main` does not
deploy anything. Run it from `Actions → Desplegar en Firebase Hosting → Run workflow`, picking a
branch and an environment.

Environments are **data, not code**:
[`deploy/firebase/environments.json`](deploy/firebase/environments.json) is the one and only place
where they are declared — which Firebase project each one deploys to, and the `config.json` it runs
with. Today there are two, `dev` and `prod`, backed by two separate Firebase projects; adding
`stage` or `lab` is one block in that file plus a matching GitHub Environment holding its service
account. The workflow itself never names an environment.

**`public/config.json` is generated**, not hand-written — `npm run config` rebuilds it from the
`dev` block, and a deploy does the same with the target environment's block. Edit
`environments.json`, never `config.json`.

The one-time setup (one Firebase project and service account per environment, the environment
secret, OAuth origins) and the troubleshooting table are in
[`manual/firebase-deploy.md`](manual/firebase-deploy.md). Start there before the first deploy.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
