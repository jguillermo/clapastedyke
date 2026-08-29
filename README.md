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

The suite runs against the **compiled build** (`deploy/dist/hosting`), served by
`e2e/support/static-server.mjs` — no dev server needed. Conventions for writing them are in
[`.claude/rules/e2e-tests-conventions.md`](.claude/rules/e2e-tests-conventions.md).

## Google Sheets sync

Recipes and supplies can be backed up to a Google Sheets file in **each user's own Drive**. The app
creates that spreadsheet and writes it itself, through the Sheets and Drive REST APIs, using the
user's own token and the `drive.file` scope — which reaches only the files the app created. Nothing
is deployed into anyone's account, and users grant a single consent checkbox.

Publishing the app needs a one-time pass through Google Cloud (project, consent screen, OAuth Client
ID **and client secret**). Every step is in
[`deploy/README.md`](deploy/README.md) — start there, and run
`./deploy/create-google-client-id.sh` if you want it done for you. Once configured, users connect
from the `/cuenta` screen; without it the app keeps working exactly as before, fully local.

The session itself is the one piece of backend: [`api/auth`](api/auth/README.md), a Cloud Function
that holds the long-lived grant behind an `HttpOnly` cookie so **reloading the page no longer signs
you out**. It never sees a recipe — the sync engine still runs entirely in the browser. Setting up
its environment (Firebase project, Blaze, Firestore, deploy service account) is a separate concern
with its own script, `./deploy/setup-firebase-project.sh`, documented in
[`manual/api.md`](manual/api.md).

The reasoning behind that design — why a Google login is unavoidable, why a browser client can never
hold a refresh token, and which alternatives were measured and rejected — is in
[`manual/google-integration.md`](manual/google-integration.md). All technical documentation lives in
[`manual/`](manual/).

## Deployment

The app is published to **Firebase Hosting** by a **manual** workflow — merging to `main` does not
deploy anything. Run it from `Actions → Desplegar el FRONTEND → Run workflow`, picking a branch and
an environment. The Cloud Function has its own workflow; when a change needs both, **deploy the
backend first**.

**`deploy/` is the only place that knows Firebase.** Nothing outside it names a project id, a region
or the CLI: the folder holds the environment declaration, the Cloud Function's source, the scripts,
and `deploy/dist/` — the compiled artifact that is actually published.

Environments are **data, not code**:
[`deploy/environments.json`](deploy/environments.json) is the one and only place where they are
declared. Each block holds `projectId`, `region`, and the public values split into `front` (what the
browser publishes) and `back` (what the Cloud Function resolves), each stating its own `destino` —
where those values get copied to. A third block, `secretos`, holds **no values**: only the key names
and where to put them by hand. Today there are three environments — `local`, `dev`, `prod` — and
adding one is a block in that file plus a matching GitHub Environment holding its secrets.

**Nothing generated is versioned**: `public/config.json`, `api/*/.env.*`,
`deploy/proxy.config.json` and `deploy/dist/`. After cloning, run `npm run wire -- local` to write
them. Edit `deploy/environments.json`, never a generated file.

```bash
npm run build -- dev --only hosting     # artifact of THAT environment → deploy/dist
./deploy/deploy.sh dev --only hosting   # the only place `firebase deploy` is invoked
```

The environment is chosen **at build time**, so the artifact that was tested is the one that ships —
`deploy.sh` refuses to publish a `deploy/dist` built for a different environment. The two workflows
run exactly these two commands.

The folder's own guide — the shape of `environments.json`, what each script does, where every secret
goes, and three things that look like mistakes but are not — is
[`deploy/README.md`](deploy/README.md). The one-time setup (one Firebase project and service account
per environment, the environment secret, OAuth origins) and the troubleshooting table are in
[`manual/firebase-deploy.md`](manual/firebase-deploy.md). Start there before the first deploy.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
