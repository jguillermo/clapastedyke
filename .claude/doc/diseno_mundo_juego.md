# Diseño UX — "Tu Pastelería": de la cocina de casa al pueblo

Documento de diseño de la interfaz del juego. Define el concepto, el lugar donde
ocurre cada fase, la progresión por objetivos, la cinemática y el lenguaje
visual.

> Fuentes que respeta: `.claude/doc/plan_de_negocio.md` (fases y modelo de
> negocio), `doc/diseno_visual_interfaz.html` (lenguaje visual), y `design_manual.md`
> (principios de animación).

---

## 1. Concepto

La aplicación **es** la pastelería hecha lugar, y ese lugar **crece con el
negocio**. El mundo no empieza siendo un pueblo: empieza siendo la **cocina de
una casa**. Una sola escena 3D low-poly —mismo facetado/`flatShading` y paleta
cálida que el chef actual— muestra primero el interior de esa cocina pequeña, y
solo cuando el negocio progresa el mundo se abre a la **ciudad y al pueblo de
edificios**.

No hay un "modo mapa" y un "modo sistema" separados, ni un tutorial que enseñe a
operar una hoja de cálculo. Hay **un mundo** y dentro de él se trabaja; las
funciones aparecen conforme se desbloquean (ver progresión en `plan_de_negocio.md`).

El estado del negocio se *ve* sin abrir nada: en la cocina, los **almacenes de
ingredientes** muestran su semáforo (rojo/amarillo/verde); en el pueblo, los KPIs
encabezan la vista y las alertas flotan como pines sobre el edificio que les
corresponde.

---

## 2. Mapa lugar ↔ fase

El **lugar** del juego cambia según la fase. La fuente de verdad de la progresión
es `plan_de_negocio.md`.

| Fase | Lugar | Qué se ve y se hace |
|---|---|---|
| **1 — Cocina en casa** | Interior de la cocina | Elegir receta, revisar ingredientes, comprar y registrar, cocinar. Almacenes simples con semáforo. |
| **2 — Redes sociales** | Cocina | Producir para mostrar; popularidad/visibilidad; pedidos informales. |
| **3 — Primer cliente** | Cocina | Cliente → pedido → producción → entrega → cobro (mínimo). |
| **4 — Primeras ventas** | Casa → **Ciudad** | Al completar 5 ventas: cinemática de salida; aparece la **pastelería**; la cocina crece. |
| **5+ — Avanzado** | **Pueblo de edificios** | Las funciones avanzadas se distribuyen en edificios (ver §3). |

---

## 3. El pueblo de edificios (Fase 4+)

El pueblo es el mundo del **modo avanzado**: aparece recién cuando se desbloquea
la tienda física. Cinco edificios alojan los flujos avanzados de la pastelería.
Cada edificio se va abriendo conforme se desbloquea su función (no por completar
un nivel-tutorial, sino por cumplir el **hito** correspondiente de la progresión).

| Edificio | Rol | Funciones que aloja | Alertas (pines) |
|---|---|---|---|
| **La Oficina** | Preparar el negocio | Configuración · Clientes · Reglas de empaque | — |
| **La Bodega** | Inventario | Insumos · Ajustar inventario | stock en rojo / bajo mínimo |
| **La Tienda** | Vender | Nuevo presupuesto · Ver presupuestos | presupuestos por vencer / vencidos |
| **El Obrador** | Producir y entregar | Ver pedidos · Recetas | pedidos por entregar |
| **El Mercado** | Abastecerse | Comprar materiales · Proveedores | — |

Cada acción monta la **pantalla operativa real**, que persiste en IndexedDB. Un
edificio cuya función aún no se desbloquea se ve "en obra" (candado flotante 🔒).

> Nota: la cocina de la casa (Fases 1–3) es el origen del **Obrador**; al
> desbloquear la tienda física, la producción pasa de la cocina de casa al pueblo,
> donde la cocina "crece" para soportar más pedidos.

---

## 4. Progresión por objetivos

La progresión **no** son tres niveles fijos que abren edificios al completar un
tutorial. Son **fases con objetivos medibles** (definidas en `plan_de_negocio.md`):
cumplir los objetivos de una fase abre la siguiente y sus funciones.

```
Inicio ─────────────► Cocina de casa (Fase 1: cocinar la 1ª receta)
Fase 1 lograda ─────► Producción para redes (Fase 2: popularidad)
Fase 2 lograda ─────► Clientes y pedidos (Fase 3: 1ª venta a cliente)
Fase 3 lograda ─────► Objetivo de ventas (Fase 4: completar 5 ventas)
5 ventas ───────────► Tienda física → pueblo de edificios (Fase 5+)
Fase 5+ ────────────► Cada función avanzada se desbloquea por su propio hito
```

Una función bloqueada (un edificio "en obra", una sección oculta) se abre al
cumplir su hito, no antes. La guía del jugador ocurre **dentro del mundo** (el
chef acompaña), no sobre maquetas de menús de Google Sheets.

---

## 5. Cinemática y transiciones

### 5.1 Arranque (Fase 1)

- **Vista aérea de la ciudad.** La cámara comienza alto, sobre la ciudad.
- **Zoom progresivo a la casa.** Desciende con un *dolly* suave hasta la casa del
  jugador.
- **Entrada a la cocina.** La cámara entra al interior; se ve la cocina pequeña.
- **Tutorial inicial.** Comienza la guía de Fase 1.

### 5.2 Desbloqueo de la tienda física (Fase 4)

Al completar las 5 ventas:

- El jugador **sale de su casa**.
- Se muestra **la ciudad** nuevamente.
- Aparece su **pequeña pastelería**.
- La cocina **mejora y crece**; el mundo pasa al pueblo de edificios.

### 5.3 Reglas de la cámara

La cámara orbita lento con parallax al puntero en las vistas abiertas; hace
*dolly* cinematográfico al enfocar una estación de la cocina o un edificio del
pueblo, y se retira al salir. Respeta `prefers-reduced-motion` (salta sin
animación) y degrada sin WebGL (la ruta accesible —lista de acciones/edificios—
opera todo igual).

---

## 6. Modelo de interacción

### 6.1 Cocina (Fases 1–3)

El interior de la cocina ocupa el viewport; las acciones (elegir receta, revisar
ingredientes, comprar/registrar, cocinar) suben como **paneles de vidrio
flotantes** (`backdrop-filter: blur`) sobre la escena. Los **almacenes de
ingredientes** se ven en la escena con su semáforo (vacío→rojo, poco→amarillo,
suficiente→verde). Una **ruta accesible** (lista de acciones) siempre está
disponible y opera todo sin depender del 3D.

### 6.2 Pueblo (Fase 4+)

El mundo 3D ocupa el 100% del viewport; encima flotan el HUD con KPIs ambientales
y un dock de edificios (también ruta accesible). Clic en un edificio operativo →
la cámara hace *dolly* a la puerta y sube un **room-menu** con sus acciones; cada
acción monta la **pantalla operativa real**. Clic en un edificio bloqueado →
indica el hito que falta para desbloquearlo.

---

## 7. Lenguaje visual

Idéntico a `doc/diseno_visual_interfaz.html`: paper `#f6efe5`, tinta `#241d18`,
acento rust `#bb5530`/`#9a4324`, verde `#4f8a5b`, ámbar `#cf9a32`, rojo `#bf412c`;
Fraunces (títulos) / Figtree (texto) / Space Mono (números, badges). Geometría
low-poly `MeshStandardMaterial`+`flatShading` con iluminación cálida. Overlays =
paneles "sheet" con sombra suave.

Semáforos: el rojo/amarillo/verde de los almacenes y de los pines de alerta usa la
misma paleta (rojo `#bf412c`, ámbar `#cf9a32`, verde `#4f8a5b`).

Accesibilidad: respeta `prefers-reduced-motion` y degrada sin WebGL; el canvas es
`aria-hidden` y la ruta accesible (lista de acciones/edificios) opera el juego
completo.

---

## 8. Qué cambia respecto al diseño anterior

- **El inicio ya no es el pueblo ni un tutorial de hoja de cálculo.** El juego
  empieza en la **cocina de casa**, con la cinemática aérea → casa → cocina.
- **El pueblo de 5 edificios es contenido de Fase 4+**, no el punto de partida; se
  alcanza tras desbloquear la tienda física (completar 5 ventas).
- **La progresión es por objetivos**, no por tres niveles fijos
  (básico/intermedio/avanzado) que abren edificios al completar un tutorial.
- **Se retira la maqueta de menús/hojas de Google Sheets** como mecanismo de
  enseñanza: el juego es autocontenido y la guía sucede dentro del mundo.
- **Se conservan** el lenguaje visual, el motor 3D low-poly, el chef como guía y
  las pantallas operativas reales (ahora reservadas al modo avanzado).
