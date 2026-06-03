# Assets Conventions

Applies to files in `src/assets/`.

## What is assets

`src/assets/` contains **static files** served as-is by the Angular build: images, icons, translation files, and other binary or JSON resources. No TypeScript, no logic — only files that the app references at runtime via URL paths.

## Structure

```
src/assets/
├── icons/              # Electron app icons (favicon.ico, .icns, multiple sizes)
├── images/
│   ├── brand/          # Brand assets: logos, SVGs for the UI
│   ├── backgrounds/    # Background images and illustrations
│   └── ...             # Feature-specific images in named subfolders
└── i18n/               # Translation JSON files (Transloco)
    ├── es-ES.json
    ├── en-US.json
    └── de-DE.json
```

## Naming

- **All file names use kebab-case**: `activity-locked.svg`, `shells-placeholder.webp`
- **No snake_case**: `simulation_placeholder.png` is wrong, `simulation-placeholder.png` is correct
- **Folders use kebab-case** too: `app-icons/`, `empty-courses/`

## Icons vs brand images

| Folder | Purpose | Consumed by |
|---|---|---|
| `icons/` | Application icons for Electron packaging (favicon, .icns, multiple sizes) | `angular.json`, `electron-builder` config |
| `images/brand/` | Brand SVGs and logos rendered in the UI | Angular components via `<img>` or CSS |

Do not confuse the two — `icons/` is for the OS-level app icon, not for UI icons.

## Translation files (i18n)

- One JSON file per locale, named with the full BCP 47 tag: `es-ES.json`, `en-US.json`, `de-DE.json`
- Loaded at runtime by Transloco via HTTP
- Keys should be organized by feature or context, not by screen

## What does NOT belong in assets

- **Simulation data or user-generated content** — never commit UUIDs, attempt data, or runtime-generated files. These belong in test fixtures or `.gitignore`
- **TypeScript files** — assets is for static resources only
- **Test fixtures** — keep them co-located with the specs that use them
- **Development-only data** — add to `.gitignore` if needed locally

## Referencing assets from code

Use root-relative paths from `src/assets/`:

```html
<!-- In templates -->
<img src="assets/images/brand/seabery.svg" alt="Seabery">
```

```scss
// In styles
background-image: url('/assets/images/backgrounds/activity-locked.svg');
```

Do not use `../../../assets/` relative paths from components — always use the `assets/` root path, which Angular serves from the configured assets folder.
