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
never talks to the Sheets or Drive APIs: it posts to a **Google Apps Script Web App**
(`apps-script/Code.gs`), which validates the user's token and writes the sheet on their behalf.

Setting it up needs a one-time manual pass through Google Cloud and Apps Script. Every step is in
[`appscript.md`](appscript.md) — start there. Once configured, users connect from the `/cuenta`
screen; without it the app keeps working exactly as before, fully local.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
