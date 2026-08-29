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
a manual one-time setup documented in [`manual/api.md`](manual/api.md).

The reasoning behind that design — why a Google login is unavoidable, why a browser client can never
hold a refresh token, and which alternatives were measured and rejected — is in
[`manual/google-integration.md`](manual/google-integration.md). All technical documentation lives in
[`manual/`](manual/).

## Deployment

The app is published to **Firebase Hosting** by a **manual** workflow — merging to `main` does not
deploy anything. Run it from `Actions → Desplegar el FRONTEND → Run workflow`, picking a branch and
an environment. The Cloud Function has its own workflow; when a change needs both, **deploy the
backend first**.

**`deploy/` is the only place that knows Firebase — and it holds no deployment logic.** Compiling,
substituting and publishing live entirely in the two workflows; the folder keeps configuration, the
compiled artifact, and one script that registers a Google client and writes nothing.

**A value that must not be versioned is never written anywhere.** The file that needs it carries a
**placeholder** named after the variable — `public/config.json` has
`"googleClientId": "GOOGLE_OAUTH_CLIENT_ID"` and `"debug": "DEBUG"`, `api/auth/.env` has
`GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID` — and both files are versioned, placeholder and all.
The deploy workflow substitutes them **in the artifact**, right before publishing, and fails the job
if one survives.

A surviving placeholder does not break anything: the app only accepts a `googleClientId` ending in
`.apps.googleusercontent.com`, so anything else leaves the integration off with a `warn`, and
connecting fails with a local, diagnosable message instead of Google's `invalid_client`. That is why
a fresh clone runs with **nothing executed** — `npm ci && npm start` and you are working.

An environment is declared in its **GitHub environment**, not in this repo: two secrets
(`GOOGLE_OAUTH_CLIENT`, the client JSON kept whole, and `FIREBASE_SERVICE_ACCOUNT`) and two variables
(`PROJECT_ID`, `DEBUG`). Adding `stage` touches no file.
[`deploy/environments.example.json`](deploy/environments.example.json) shows that same picture as a
file you can read at a glance; nothing consumes it.

Publishing is `Actions → Desplegar el BACKEND / FRONTEND → Run workflow`, in that order — the app
calls `/api/auth/token` on boot, so a front published against an old API signs everyone out.

The folder's own guide — the placeholders, what each environment configures, publishing step by
step, and three things that look like mistakes but are not — is
[`deploy/README.md`](deploy/README.md). The one-time setup (one Firebase project and service account
per environment, the environment secret, OAuth origins) and the troubleshooting table are in
[`manual/firebase-deploy.md`](manual/firebase-deploy.md). Start there before the first deploy.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
