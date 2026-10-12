---
name: manual-usuario
description: >-
  Genera el MANUAL DE USUARIO de una aplicación web en PDF (tamaño carta, vertical) a partir de
  CAPTURAS REALES de la app, con círculos rojos numerados sobre cada control y los pasos con el mismo
  número, portada e índice; las páginas se componen con HyperFrames (HTML → `snapshot`) y Chrome
  headless las junta en el PDF. Pensada para manuales internos simples para usuarios no técnicos.
  Actívate SIEMPRE que el usuario diga frases como "hazme un manual de usuario", "manual del portal
  en PDF", "guía de uso con capturas", "documenta cómo se usa la app para los usuarios", "manual con
  hyperframes", "actualiza el manual con las pantallas nuevas", o pida explicar los módulos de un
  sistema con pantallas numeradas. Complementa a eecheverria-senior-dev (subagentes y verificar antes
  de entregar) y a eecheverria-launch-video (el video presume; esta skill enseña a usarlo). No la uses
  para videos, tutoriales guiados dentro de la app ni el changelog de un despliegue.
---

# Manual de usuario en PDF (HyperFrames)

Produce **un PDF** que un usuario sin conocimientos técnicos lee de corrido: portada, índice, un
capítulo por módulo y, en cada página, **una pantalla real** de la app con círculos rojos numerados
y debajo los pasos con el mismo número. Lo más simple posible: una idea por página, botones con su
texto exacto en negrita.

## Cuándo NO usarla

- Un **video** (promo, tutorial animado): `eecheverria-launch-video` o los flujos de HyperFrames.
- Un **tutorial guiado dentro de la app** (driver.js, recorridos): eso es código del producto.
- El **changelog** de un despliegue: `changelog-deploy`.

## Reglas que no se negocian

- **Capturas reales, nunca maquetas.** Si una pantalla no se puede capturar, se dice; no se dibuja.
- **Solo mirar.** Al capturar en un ambiente con datos (DEV, PROD) no se guarda, aprueba, genera,
  anula ni elimina nada; los diálogos se abren y se cierran con Escape. Tampoco se toca lo que
  cambia la sesión de todas las pestañas (cambiar de empresa, "ver como otro rol", colapsar el menú,
  tamaño de pantalla) salvo en una captura dedicada al final y revirtiéndolo.
- **Nada de datos que no deban salir.** Prefiere un ambiente de pruebas o el modo tutorial (datos de
  ejemplo) de la app; pregunta antes de capturar PROD.
- **El texto describe la pantalla real**, no el tutorial ni el código: si un tutorial dice otra cosa,
  manda la pantalla y se reporta la diferencia.

## Prerrequisitos

- Node 22+, Google Chrome (o Edge) y `npx hyperframes` (el `snapshot` no necesita FFmpeg).
- Un Chrome de depuración con su propio perfil (desde Chrome 136 el puerto se ignora con el perfil
  por defecto):
  `Start-Process chrome.exe -ArgumentList '--remote-debugging-port=9222',"--user-data-dir=$env:LOCALAPPDATA\chrome-claude-debug",'<url de la app>'`
  El usuario inicia sesión **una vez** en esa ventana; la sesión queda en ese perfil.
- Para revisar el PDF no hace falta poppler: valida páginas y tamaño contando `/Type /Page` y el
  `MediaBox` (carta = `612 x 792`).

## Flujo

### 0. Confirmar el alcance (una sola ronda de preguntas)

Pregunta, con una recomendación en cada una: **qué módulos** (lo básico, un flujo, o toda la app),
**de dónde salen las capturas** (pruebas con datos de ejemplo / tutorial, pruebas con datos reales,
producción) y **formato** (carta vertical por defecto; horizontal 16:9 si se va a proyectar).

### 1. Mapear las pantallas desde el código

Con subagentes en paralelo (uno por grupo de módulos), de solo lectura: por pantalla, la ruta, para
qué sirve, quién la ve (permiso), las **etiquetas exactas** de botones, filtros, columnas y menús, los
mejores selectores para marcar cada control (prefiere anclas `data-tour`), los recorridos del
tutorial si existen (rutas, pasos, textos) y qué impide capturarla (estado del documento, otro
usuario, SAP). Guarda cada mapa en `work/map-<grupo>.md` del proyecto del manual.

### 2. Preparar el proyecto

Carpeta propia **fuera de los repos** (no se commitea), p. ej. `manual-usuario-<app>/`:

```
tools/        scripts de esta skill (capture, merge, build, render, to-pdf) + GUIDE.md
assets/shots  capturas PNG    assets/brand  logo y marca    assets/fonts  fuente local (woff2)
book.json     metadatos y orden de capítulos (ver references/formato.md)
work/         mapas, capítulos, coordenadas (intermedios)
out/          el PDF
```

Copia los scripts de `scripts/` y la guía de `references/guia-capitulo.md` a `tools/GUIDE.md`,
ajustando el ambiente, la seguridad y la terminología de la app. Usa la fuente y los colores de la
propia app (descarga la fuente una vez y sírvela local; la composición no debe depender de red).

Prueba la cadena con UNA página antes de repartir trabajo: captura → `node tools/merge.mjs` →
`node tools/render.mjs out/prueba.pdf` → mira la página con Read.

### 3. Verificar la sesión y los permisos

Abre una pantalla con el capturador y mírala. Si la app protege rutas por permiso (redirige al
inicio sin avisar), revisa que el rol de la sesión tenga lo que el manual necesita, incluido el
permiso de cada tutorial: puede no existir en ese ambiente (migración sin aplicar). Si falta, decide
con el usuario entre asignarlo o usar datos reales del ambiente.

### 4. Capturar y redactar por capítulo (subagentes en paralelo)

Un subagente por capítulo o grupo, **cada uno en su propia pestaña** (`OWN_TAB=1`), con la guía
`tools/GUIDE.md` y su mapa. Cada uno entrega `work/chapters/<id>.screens.json`, `<id>.coords.json`,
`<id>.json` y sus PNG con un prefijo propio, y revisa cada captura con Read antes de darla por buena.
La pantalla de inicio de sesión se captura con `FRESH_CONTEXT=1` (contexto sin sesión).

### 5. Unir, validar y revisar

`node tools/merge.mjs book.json` valida que cada página tenga su captura, un paso por marcador, sin
guion largo ni términos prohibidos. Luego revisa en serio, como lo haría un usuario: ¿se entiende
cada página sin conocer el sistema?, ¿cada número cae en su control y no lo tapa?, ¿están todos los
botones de cada pantalla? Califica de 1 a 10 y no entregues un 7: corrige y vuelve a renderizar.

### 6. Renderizar

`node tools/render.mjs out/<Nombre>.pdf` hace todo: arma la composición HyperFrames (una página
carta de 1700×2200 por segundo), saca cada página con `npx hyperframes snapshot --at 0.5,1.5,…` y
Chrome headless imprime el PDF tamaño carta sin márgenes.

### 7. Entregar

Da la ruta del PDF, cuántas páginas tiene, qué pantallas quedaron fuera y por qué, y las diferencias
que encontraste entre los tutoriales y las pantallas reales. El PDF es de imágenes (el texto no se
puede seleccionar); si el usuario necesita texto buscable, ofrécele exportar `index.html` como
página web.

## Lecciones aprendidas

- **Ventana de 1440×900.** Muchas apps esconden el texto de los botones por debajo de 1280 px.
- **El modo tutorial bloquea el mouse pero no el JavaScript**: el `click` del capturador (por JS)
  abre menús y diálogos sobre los datos de ejemplo; los pasos se avanzan con la tecla flecha.
- **El overlay del tutorial se oculta con CSS** (`hideCss` en `screens.json`) para que la captura
  quede limpia.
- **`hyperframes snapshot` agrega un cuadro extra al final**: `to-pdf.mjs` toma solo los tiempos de
  `work/pages.json`.
- **Círculos en la esquina, no en el centro**: el capturador ancla cada número a la esquina superior
  izquierda del control, empujado hacia afuera, para no tapar el texto del botón.
- **Lo que cambia la sesión afecta a todas las pestañas**: con varios subagentes capturando a la vez,
  ninguno cambia de empresa, de rol, de tamaño ni colapsa el menú.
- **Un tutorial desactualizado engaña**: compara siempre su texto con la pantalla real.

## Archivos de esta skill

- `scripts/capture.mjs`: captura por CDP (puerto 9222) y mide la esquina de cada marcador.
- `scripts/merge.mjs`: une los capítulos en `manual.json` + `coords.json` y valida.
- `scripts/build.mjs`: genera la composición HyperFrames (`index.html`) carta, una página por segundo.
- `scripts/render.mjs`: build → `hyperframes snapshot` → PDF.
- `scripts/to-pdf.mjs`: junta los PNG en un PDF carta con Chrome headless.
- `references/formato.md`: formatos de `book.json`, `screens.json` y del capítulo.
- `references/guia-capitulo.md`: la guía que reciben los subagentes (seguridad, capturas, texto).
