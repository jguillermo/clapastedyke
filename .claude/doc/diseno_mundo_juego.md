# Diseño UX — "Tu Pastelería": el mundo-pueblo

Documento de diseño de la interfaz del juego. Define el concepto, el mapa
edificio↔feature, la progresión, el modelo de interacción y el lenguaje visual.
Acompaña al prototipo navegable ya implementado (`/town`).

> Fuentes que respeta: `.claude/doc/plan_de_negocio.md` (modelo de negocio),
> `doc/diseno_visual_interfaz.html` (lenguaje visual), y la arquitectura Angular
> DDD existente (`core/` casos de uso sobre IndexedDB, `platform/three`).

---

## 1. Concepto

La aplicación **es** la pastelería hecha lugar. Una sola escena 3D low-poly —
mismo facetado/`flatShading` y paleta cálida que las islas y el chef actuales —
muestra un pueblo que el jugador opera entrando a sus edificios. No hay un "modo
mapa" y un "modo sistema" separados: hay **un mundo** y dentro de él se trabaja.

La hoja **Resumen** del plan de negocio deja de ser pantalla y se vuelve el
**ambiente del pueblo**: los KPIs encabezan la vista y las alertas flotan como
pines sobre el edificio que les corresponde. El estado del negocio se *ve* sin
abrir nada.

---

## 2. Mapa edificio ↔ feature

Cinco edificios cubren todo el modelo de negocio. Fuente de verdad en código:
`src/app/features/game/model/buildings.ts`.

| Edificio | Nivel | Rol | Acciones (pantallas reales montadas) | Alertas (pines) |
|---|---|---|---|---|
| **La Oficina** | básico | Preparar el negocio | Configuración · Clientes · Reglas de empaque | — |
| **La Bodega** | básico | Inventario | Insumos · Ajustar inventario | stock en rojo / bajo mínimo |
| **La Tienda** | intermedio | Vender | Nuevo presupuesto · Ver presupuestos | presupuestos por vencer / vencidos |
| **El Obrador** | intermedio | Producir y entregar | Ver pedidos · Recetas | pedidos por entregar |
| **El Mercado** | avanzado | Abastecerse | Comprar materiales · Proveedores | — |

Cada acción monta la **pantalla operativa real** (`features/*/...-screen`), que
inyecta casos de uso y persiste en IndexedDB — no la maqueta del tutorial.

---

## 3. Progresión básico → avanzado

Se reutiliza el contenido de 3 niveles tal cual (`content.ts`). Cada nivel
**abre edificios**. Un edificio queda operativo cuando todos los niveles
anteriores al suyo están al 100% (`isBuildingOperational`):

```
Reset ─────────────► Oficina + Bodega operativas (nivel básico)
Básico 100% ───────► + Tienda + Obrador (nivel intermedio)
Intermedio 100% ───► + Mercado (nivel avanzado) → pueblo completo
```

Un edificio bloqueado se ve "en obra" (gris, sin luz en la puerta) y, al tocarlo,
enruta a la misión guiada que lo abre (`/mission/:unlockMissionId`).

---

## 4. Tutorial vs. operación: una sola puerta

- **Primera vez** (flujo no aprendido / edificio bloqueado) → modo **guiado**:
  el tutorial existente (chef + `GuideCursor` + valores de muestra).
- **Reingreso** (edificio operativo) → modo **libre**: la pantalla real con data
  real, sin guía. Entras a la Tienda y vendes.

---

## 5. Modelo de interacción (estados y wireframes)

### 4bis. Escena de calle viva

El mundo es una **calle** vista de frente, no un diorama estático:
- **La Tienda (bakery) al frente-centro**; el resto de edificios flanquean detrás
  en una V poco profunda, todos mirando a la cámara.
- **Todos los edificios texturizados**; los bloqueados se marcan con un **candado
  flotante 🔒** encima (sprite de canvas), no con material gris.
- **Calle** al frente (tejas `road-tile` + acera) con **autos en movimiento**
  (`car/taxi/suv`, dos carriles, wrap en los bordes) y **gente caminando**
  (personas low-poly por primitivas, ya que el pack no trae personajes).
- **El chef** (geometría reutilizable en `chef-mesh.ts`, compartida con el
  tutorial) parado frente a la pastelería **saludando** con el brazo en alto.
- Cámara más alejada (`z 13.5`, fov 42) para que toda la calle se lea.

Capturas: `docs/town-street-preview.png` y `docs/town-street-detail.png`.

### 5.0 Layout a pantalla completa

El mundo 3D ocupa el **100% del viewport** y todo flota dentro como capas (no hay
página con scroll). `TownShell` es `:host { position: fixed; inset: 0 }` con:
- **`.mundo`** (z 0): `<app-town-3d>` a `inset:0` (canvas full-bleed).
- **`.hud-top`** (z 2): chip de marca (izq.) + KPI chips translúcidos (der.).
- **`.dock`** (z 2): tira inferior de chips de edificio — selección rápida y
  **ruta accesible / sin-WebGL** (siempre presente).
- **Overlays** (z 60): room-menu y pantallas reales como **panel de vidrio
  flotante** (`backdrop-filter: blur`), con el mundo difuminado detrás.

En rutas `/town*` el shell global (`App`) oculta el HUD del tutorial y el fondo
decorativo (señal `immersive`); el tutorial (`/mission`, `/level`) conserva su
HUD sticky y scroll normal.

### 5.1 Vista pueblo (hub orbital)

```
┌──────────────────────────────────────────────────────────┐
│  TU PASTELERÍA                                             │
│  El pueblo de tu negocio                                   │
│  ( 3 pend. ) ( 1 por vencer ) ( 2 por entregar ) ( 1 rojo )│   ← KPIs ambientales
│                                                            │
│            🔺Bodega          🔺Tienda(●)   🔺Obrador        │
│        🏠 Oficina        ▢ plaza ▢        🏠 Mercado🔒     │   ← canvas 3D (cámara orbita)
│                  · · partículas · ·                        │
│                                                            │
│  [ La Oficina ][ La Bodega ][ La Tienda ][ Obrador ][Merc.]│   ← lista accesible (sin WebGL)
└──────────────────────────────────────────────────────────┘
   (●) = pin de alerta flotando · 🔒 = bloqueado/en obra
```

La cámara orbita lento con parallax al puntero. Hover sobre un edificio: se eleva
y agranda, cursor `pointer`.

### 5.2 Clic en edificio operativo → zoom + room-menu

La cámara hace dolly hacia la puerta (`focusBuilding`) y el pueblo se difumina;
sube un panel:

```
        ┌───────────────────────────────────┐
        │ ENTRASTE A                      ✕  │
        │ La Tienda                          │
        │ El corazón: arma presupuestos…     │
        │                                    │
        │   [ Nuevo presupuesto      → ]     │
        │   [ Ver presupuestos       → ]     │
        └───────────────────────────────────┘
```

### 5.3 Acción → pantalla real (la data carga aquí)

```
┌──────────────────────────────────────────────────────────┐
│ ← Volver        La Tienda                           ✕ Cerrar│
├──────────────────────────────────────────────────────────┤
│  (QuoterScreen real: clientes/recetas de IndexedDB,        │
│   cálculo de precio en vivo, guardar)                      │
└──────────────────────────────────────────────────────────┘
```

Las pantallas reales son **rutas hijas de `/town`** (p. ej. `/town/quotes/new`)
renderizadas en un `<router-outlet>` dentro del overlay. `← Volver` vuelve al
room-menu (`/town`, cámara sigue enfocada); `✕ Cerrar` sale del edificio
(zoom-out + recarga de KPIs). Al guardar un presupuesto el `QuoterScreen` navega
a `/town/quotes` — **se queda dentro del pueblo** (ya no salta a `/system`).

### 5.4 Clic en edificio bloqueado

Enruta a la misión guiada que lo abre. El jugador aprende el flujo y, al
completar el nivel, el edificio queda operativo.

---

## 5bis. Modelos 3D (SimplePoly City)

El pueblo usa el pack **SimplePoly City** (FBX) cargado en runtime con
`FBXLoader`. Mapeo edificio→modelo:

| Edificio | Modelo FBX | Textura |
|---|---|---|
| La Tienda | `bakery.fbx` | `bakery.png` |
| El Mercado | `super-market.fbx` | `super-market.png` |
| La Bodega | `factory.fbx` | `factory.png` |
| El Obrador | `restaurant.fbx` | `restaurant.png` |
| La Oficina | `books-shop.fbx` | `books-shop.png` |

Decorado no interactivo: árboles (`tree-fir`, `tree-cube`), farolas
(`street-light`) alrededor de una plaza. Assets servidos desde
`public/assets/city/` (copiados y renombrados a kebab-case desde
`3d/SimplePoly City.FBX/`).

Detalles técnicos:
- Cada modelo es **una sola malla** → se le aplica su atlas PNG como `map` de un
  único `MeshStandardMaterial`, y el raycast acierta en cualquier punto.
- **Normalización por bounding box**: los FBX vienen en escalas dispares (bakery
  ~13 u, factory ~27 u); el motor escala cada uno a una huella de ~2.7 u y lo
  apoya en el suelo, así conviven al mismo tamaño.
- **Carga asíncrona con caché**: una plantilla por url, clonada por uso; mientras
  carga se ve un pad de plot para no romper el layout.
- **Bloqueado** = mismas mallas con material gris (`under construction`);
  **operativo** = textura a color. Pines de alerta flotan encima.

## 6. Lenguaje visual

Idéntico a `doc/diseno_visual_interfaz.html`:
paper `#f6efe5`, tinta `#241d18`, acento rust `#bb5530`/`#9a4324`, verde
`#4f8a5b`, ámbar `#cf9a32`, rojo `#bf412c`; Fraunces (títulos) / Figtree (texto) /
Space Mono (números, badges). Edificios `MeshStandardMaterial`+`flatShading` con
iluminación hemisférica+direccional cálida. Overlays = paneles "sheet" con sombra
suave. Color de cada edificio: Oficina ámbar, Bodega taupe, Tienda rust (el
corazón), Obrador verde, Mercado azul.

Accesibilidad: respeta `prefers-reduced-motion` (dibuja un frame, sin órbita) y
degrada sin WebGL (la lista de edificios opera todo igual). El canvas es
`aria-hidden`; la ruta accesible es la lista.

---

## 7. Arquitectura del prototipo (resumen)

| Pieza | Archivo |
|---|---|
| Motor 3D del pueblo (FBXLoader, normalización, decor) | `src/app/platform/three/town-engine.ts` |
| Assets de ciudad | `public/assets/city/*.fbx` + `*.png` |
| Canvas Angular | `src/app/features/game/components/town/town-3d.ts` |
| Home unificado | `src/app/features/game/components/town/town-shell.{ts,html,scss}` |
| Mapa edificio↔feature | `src/app/features/game/model/buildings.ts` (+ `.spec.ts`) |
| Ruta | `/town` (home por defecto) en `src/app/app.routes.ts` |
| i18n | bloque `town.*` en `public/i18n/game/{es,en}.json` |

El dominio (`core/`) y los formularios **no se tocan**: el cambio es de capa de
presentación/navegación. Reutiliza el `WorldEngine`/`ChefEngine` como hermanos.

---

## 8. Camino completo

1. ~~Plegar `/system/*` dentro del pueblo~~ ✅ **Hecho.** Las pantallas operativas
   son rutas hijas de `/town` y se renderizan en el `<router-outlet>` del overlay
   (`TownShell` es ahora layout). `/system/*` redirige a `/town/*`; el
   `QuoterScreen` y el HUD apuntan a `/town`. `dashboard-screen` y el layout
   `System` quedan huérfanos (sin ruta) — candidatos a borrar.
2. ~~Retirar `/map`~~ ✅ **Hecho.** La ruta `/map` ahora redirige a `/town`; las
   navegaciones del tutorial (guards, `challenge-card`, `level-completed`, `hud`)
   apuntan a `/town`. Borrados los huérfanos: `world-map/` (WorldMap + Map3d),
   `platform/three/world-engine.ts`, `features/system/` y `features/dashboard/`
   (el dashboard vive como KPIs ambientales en `TownShell`). El tutorial
   (misiones + `level-completed`) sigue vivo y su "casa" es el pueblo.
3. Animaciones de ambiente y transición de cámara — ✅ **Parcial.** Hecho: humo
   de chimenea (sprites que suben y se desvanecen) sobre los edificios
   operativos, balanceo suave de árboles, y una **transición de cámara
   cinematográfica** (dolly con `easeInOut`, ~0.9s al entrar / ~0.8s al salir) con
   leve "idle sway" mientras estás enfocado. Pendiente: mini-celebración al abrir
   un edificio nuevo (reusar confetti de `level-completed`).
4. `GetDashboard` aún devuelve `route: '/system/...'` en las alertas (no se usa
   en el pueblo: las alertas son pines). Actualizar a `/town/...` si se hacen
   clicables.
