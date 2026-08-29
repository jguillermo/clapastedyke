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

The suite runs against the **compiled build** (`firebase/public`), served by
`e2e/support/static-server.mjs` — no dev server needed. Conventions for writing them are in
[`.claude/rules/e2e-tests-conventions.md`](.claude/rules/e2e-tests-conventions.md).

## Google Sheets sync

Recipes and supplies can be backed up to a Google Sheets file in **each user's own Drive**. The app
creates that spreadsheet and writes it itself, through the Sheets and Drive REST APIs, using the
user's own token and the `drive.file` scope — which reaches only the files the app created. Nothing
is deployed into anyone's account, and users grant a single consent checkbox.

Publishing the app needs a one-time pass through Google Cloud (project, consent screen, OAuth Client
ID **and client secret**). Every step is in
[`firebase/README.md`](firebase/README.md) — start there, and run
`./create-google-client-id.sh` if you want it done for you. Once configured, users connect
from the `/cuenta` screen; without it the app keeps working exactly as before, fully local.

The session itself is the one piece of backend: [`firebase/functions`](firebase/functions/), a Cloud
Function that holds the long-lived grant behind an `HttpOnly` cookie so **reloading the page no
longer signs you out**. It never sees a recipe — the sync engine still runs entirely in the browser.
Setting up its environment (Firebase project, Blaze, Firestore, deploy service account) is a separate
concern, a manual one-time setup documented in [`manual/functions.md`](manual/functions.md).

The reasoning behind that design — why a Google login is unavoidable, why a browser client can never
hold a refresh token, and which alternatives were measured and rejected — is in
[`manual/google-integration.md`](manual/google-integration.md). All technical documentation lives in
[`manual/`](manual/).

## Deployment

The app is published to **Firebase Hosting** by a **manual** workflow — merging to `main` does not
deploy anything. Run it from `Actions → Desplegar (Firebase) → Run workflow`, picking a branch and an
environment.

**One workflow, one command, and it always ships everything.** `firebase deploy` — no `--only` —
publishes all three targets in `firebase/firebase.json`: firestore, functions and hosting. There is
no scope to pick, which is what keeps the app and the function serving its `/api/auth/**` from
drifting apart. What that command does *not* do is compile Angular, install the function's
dependencies (its `predeploy` hooks run on the runner, inside the deploy) or substitute the
placeholders; those are the four steps around it.

**`firebase/` is the only place that knows Firebase — and it holds no deployment logic.** Compiling,
substituting and publishing live entirely in the two workflows; the folder keeps the deploy config,
the backend source (`firebase/functions`) and the compiled artifact.

**`ng build` compiles straight into `firebase/public`** — the very folder Hosting publishes. There is
no intermediate `dist/` to copy: building *is* preparing the deploy, and that folder is gitignored
because it is an artifact, not source.

**A value that must not be versioned is never written anywhere.** The file that needs it carries a
**placeholder** named after the variable — `public/config.json` has
`"googleClientId": "GOOGLE_OAUTH_CLIENT_ID"` and `"debug": "DEBUG"`, `firebase/functions/.env` has
`GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID` — and both files are versioned, placeholder and all.
The deploy workflow substitutes them **on the runner**, right before publishing, and fails the job
if one survives.

A surviving placeholder does not break anything: the app only accepts a `googleClientId` ending in
`.apps.googleusercontent.com`, so anything else leaves the integration off with a `warn`, and
connecting fails with a local, diagnosable message instead of Google's `invalid_client`. That is why
a fresh clone runs with **nothing executed** — `npm ci && npm start` and you are working.

An environment is declared in its **GitHub environment**, not in this repo: two secrets
(`GOOGLE_OAUTH_CLIENT`, the client JSON kept whole, and `FIREBASE_SERVICE_ACCOUNT`) and **no
variables** — the Firebase project is read from the service account's own `project_id`, and `debug`
is a checkbox on the frontend workflow's Run form. Adding `stage` touches no file.

The two workflows `firebase init` generates — `firebase-hosting-merge.yml` and
`firebase-hosting-pull-request.yml` — were **deleted**: they deploy on merge, skip the placeholder
substitution and hardcode the project id. If it regenerates them, delete them again.

Publishing is `Actions → Desplegar (Firebase) → Run workflow` — which also removes the old ordering
trap: the app calls `/api/auth/token` on boot, so a front published against an old function used to
sign everyone out when the two manual launches happened in the wrong order.

The folder's own guide — the placeholders, what each environment configures, publishing step by
step, and three things that look like mistakes but are not — is
[`firebase/README.md`](firebase/README.md). The one-time setup (one Firebase project and service account
per environment, the environment secret, OAuth origins) and the troubleshooting table are in
[`manual/firebase-deploy.md`](manual/firebase-deploy.md). Start there before the first deploy.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
