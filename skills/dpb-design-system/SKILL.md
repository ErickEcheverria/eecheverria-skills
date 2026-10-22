---
name: dpb-design-system
description: >-
  Design system de Desarrollos Palo Blanco (DPB) para apps web internas, construido ENCIMA de Untitled
  UI React: la "cara" de app-presupuestos (Portal de Finanzas) empaquetada como plantillas listas para
  copiar — tema de marca (azul #2C589A, rojo #CC1F37, Open Sans), isotipo DPB, shell (lienzo con
  tarjetas flotantes y sidebar colapsable), pantalla de acceso, 404 en español y piezas comunes
  (diálogo, confirmación, error con remedio, vacío, paginación, notificaciones, KPI, área de tabla).
  Tesis — copia la plantilla, no la reescribas: que todas las apps se sientan del mismo lugar es el
  valor. Actívate SIEMPRE que se cree o se trabaje el frontend de una app de DPB / Palo Blanco /
  paloblanco, o el usuario diga frases como "design system de DPB", "que se vea como presupuestos",
  "aplica la marca DPB a la app", "app nueva para Palo Blanco", "el sidebar/shell de DPB", "el login
  de DPB", "pon el logo de DPB en la app" o "adapta untitledui a DPB". Complementa a
  eecheverria-untitled-ui (catálogo, CLI y tokens: se cargan juntas) y a eecheverria-frontend-react
  (arquitectura, estado, formularios). Para documentos, presentaciones o correos con la marca DPB usa
  dpbranding, no esta. Si es frontend de DPB con Untitled UI, actívala.
---

# dpb-design-system

## Resumen

**Un design system no son los colores: es que dos apps distintas se sientan del mismo lugar.**
app-presupuestos (el Portal de Finanzas) ya resolvió cómo se ve y se comporta una app interna de DPB
sobre Untitled UI, y el equipo pidió que las demás se vean igual. Esta skill empaqueta esa solución en
tres capas, como archivos listos para copiar en `assets/plantilla/` (refleja la raíz de un proyecto):

| Capa | Qué trae |
| --- | --- |
| **Tema** | `brand-dpb.css` encima del `theme.css` del catálogo: rampas `brand` (#2C589A) y `accent` (#CC1F37), Open Sans, lienzo `bg-canvas`, colores de gráficas, scrollbars |
| **Marca y shell** | isotipo DPB, lockup, `AppLayout` (lienzo + dos tarjetas flotantes), sidebar colapsable, pantalla de acceso, 404 |
| **Piezas comunes** | superficie de diálogo, confirmación, error con remedio, vacío, paginación en español, notificaciones, sección, KPI, utilidades de tabla |

Esta skill **no** repite lo que ya cubre `eecheverria-untitled-ui` (catálogo, CLI, tabla de tokens
semánticos, reglas de React Aria, frontera free/PRO). Se cargan juntas: aquella dice cómo usar el
catálogo; esta, cómo se ve DPB.

Las dos reglas duras, y su porqué:

- **Copia la plantilla, no la reescribas.** Escrita desde una descripción, cada app sale un poco
  distinta, y la consistencia es justo lo que se pidió. Además, las plantillas ya esquivan trampas
  reales del catálogo (el `Dialog` que desplaza también la cabecera y el pie, el `size` que `Table`
  ignora, textos fijos en inglés): al reinventarlas, las vuelves a pisar.
- **La marca vive en `brand-dpb.css`, nunca en `theme.css`.** `theme.css` es del catálogo y lo
  reescribe `npx untitledui upgrade`; si metes ahí la marca, cada actualización la borra o choca.
  `brand-dpb.css` se carga después y solo sobrescribe lo necesario.

Al construir cualquier pieza de UI, busca en este orden: **pieza DPB** (`src/features/comunes/`,
shell) → **catálogo de Untitled UI** (`eecheverria-untitled-ui`) → **a mano con tokens**
(`eecheverria-frontend-react`).

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo
`eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes
de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

Lo mismo vale para las plantillas: si en un proyecto descubres una mejora a una pieza DPB, **no la
dejes solo en ese proyecto** — propón llevarla a la skill, que es la fuente de verdad (ver "Fuente de
verdad y versiones").

## Cuándo usarla

- Vas a crear el frontend de una app interna de DPB.
- Un proyecto de DPB ya usa Untitled UI y hay que darle la cara DPB (tema, shell, piezas).
- Construyes una pantalla en un proyecto que ya tiene la capa DPB (`src/styles/brand-dpb.css`).
- Revisas una UI de DPB y ves colores fuera de marca, un shell distinto o piezas reinventadas.

**Cuándo NO usarla:**

- **Proyectos que no son de DPB** — la marca no se aplica por defecto.
- **Documentos, presentaciones, correos o PDFs con la marca** — eso es de `dpbranding` (y
  `dpb-presentaciones`); esta skill es para la UI de aplicaciones.
- **Proyecto React sin Untitled UI** — no lo migres de oficio. Adoptar Untitled UI es decisión del
  usuario: pregunta primero (mismo criterio que `eecheverria-untitled-ui`).

## Paso 0 — Detecta el terreno

Lee primero el `CLAUDE.md` del proyecto: **manda sobre esta skill** (regla de
`eecheverria-senior-dev`). Luego ubica el escenario:

| Señal en el proyecto | Escenario | Qué haces |
| --- | --- | --- |
| Directorio vacío o "haz la app nueva de …" | Arranque | Confirma, corre `npx untitledui@latest init <dir> --vite -y` y aplica la capa DPB completa |
| `components/base/` + `styles/theme.css` sin `styles/brand-dpb.css` | Adopción | Capa DPB completa con el script; revisa conflictos uno por uno |
| Ya existe `src/styles/brand-dpb.css` | Ya es DPB | Usa las piezas que ya están; si difieren de la plantilla, muestra el diff y pregunta antes de actualizar |
| React sin Untitled UI | Otro sistema | Pregunta; no instales nada de oficio |

## Proceso

```
1. DETECTA   → versiones del stack y escenario (Paso 0)
2. COPIA     → scripts/copiar-plantilla.mjs: crea lo que falta, nunca pisa
3. FUSIONA   → assets/fragmentos/ en globals.css, index.html y main.tsx
4. CONFIGURA → las costuras: nombre de la app, navegación, cuenta
5. COMPÓN    → pantallas con las recetas de references/patrones.md
6. VERIFICA  → typecheck + build, claro y oscuro, teclado, español
```

### 1 · Detecta

Untitled UI pide su piso de versiones (React 19.2, Tailwind 4.3, `react-aria-components` 1.20; ver
`eecheverria-untitled-ui`). Además, las plantillas usan `react-router` (`NavLink`, `useLocation`) y
`sonner`. Si el proyecto está por debajo del piso, **para y dilo** antes de copiar.

### 2 · Copia la plantilla

El script vive en el directorio base de esta skill; pásale la raíz del proyecto como **ruta
absoluta**, así no depende de desde dónde lo corras:

```bash
node <base-de-la-skill>/scripts/copiar-plantilla.mjs <raíz-del-proyecto> --dry-run   # primero: qué crearía y qué choca
node <base-de-la-skill>/scripts/copiar-plantilla.mjs <raíz-del-proyecto>
```

El script copia `assets/plantilla/` completo: **crea** lo que falta, **salta** lo idéntico y
**lista los conflictos** (archivos que ya existen y difieren) sin tocarlos; termina con código 2 si
hubo alguno. Cada conflicto es una decisión del usuario: muéstrale el diff y pregunta. Es la
disciplina de alcance de `eecheverria-senior-dev` aplicada a una copia masiva — el código del
proyecto puede tener cambios locales que importan.

Copia la capa completa aunque la primera pantalla no use todas las piezas: son pocas, chicas y
dependen entre sí, y tenerlas desde el día uno es lo que evita que la segunda pantalla se escriba a
mano.

Dependencias que el starter no trae (el starter actual ya incluye `react-router`; un proyecto
existente puede no tenerlo):

```bash
npm install sonner            # + react-router si falta
```

### 3 · Fusiona los fragmentos

`assets/fragmentos/` trae lo que va **dentro** de archivos que el proyecto ya tiene. Fusiónalos; no
reemplaces el archivo entero:

- **`globals.css`** — orden de imports (`theme.css` → `brand-dpb.css` → `typography.css` →
  `scrollbars.css`), plugins y la fuente en `html, body`. El orden importa: `brand-dpb.css` debe ir
  después de `theme.css` para sobrescribirlo.
- **`index-head.html`** — Open Sans, `theme-color`, favicon con el isotipo y el script anti-FOUC
  (lee la clave `ui-theme`, la misma que el `ThemeProvider` del starter).
- **`main.tsx`** — orden de providers, el montaje único de `<Notificaciones />` y la ruta 404.

En un arranque, el starter trae `src/pages/home-screen.tsx` y `src/pages/not-found.tsx` (en
inglés): se reemplazan por las páginas de la app y `NoEncontradaPage`, y se quitan sus imports de
`main.tsx`.

### 4 · Configura las costuras

Lo único que cambia de una app a otra está concentrado en pocos archivos. Edita **solo** estos; el
resto de la plantilla se queda como viene:

| Archivo | Qué cambias |
| --- | --- |
| `src/features/shell/shell.config.ts` | `nombreApp`, `claveSidebarColapsada` (con el prefijo de la app) y, si la app tiene marca propia, `marca` |
| `src/features/shell/nav-items.ts` | `NAV_ITEMS`: los módulos reales, agrupados y en el orden del proceso. `roles` solo oculta entradas; la autorización es del backend |
| `src/features/shell/use-cuenta.ts` | Conéctalo a la auth del proyecto (en DPB suele ser MSAL) y ajusta `Rol`. Trae una cuenta de ejemplo para que el shell se vea completo: **sin conectarlo, en producción sale «Usuario de Ejemplo»** |
| `index.html` | `<title>` y descripción, con el mismo nombre que `SHELL.nombreApp` |

Una marca propia es un componente SVG inline que acepta `size`, `className` y `aria-hidden` (el tipo
`Marca` de `app-logo.tsx`); el lockup, la sidebar y el 404 la toman de `SHELL` sin pasar props. El
panel de la pantalla de acceso conserva el isotipo DPB a propósito: es la superficie corporativa.

### 5 · Compón las pantallas

Antes de armar una pantalla, lee en **`references/patrones.md`** la receta que corresponde
(listado, detalle, inicio con KPIs, acceso, pestañas) y las secciones de lo que vas a usar: tablas,
formularios en diálogo, estados, badges, botones, gráficas. Es largo a propósito y abre con un
índice: no lo leas entero para una pantalla.

Cuando algo del catálogo se comporte raro (un scroll que no aparece, un `size` ignorado, un ring
inexistente), mira **`references/trampas.md`** antes de depurar: probablemente ya mordió.

### 6 · Verifica

Ver la checklist de "Verificación" al final.

## Reglas DPB

Lo que esta skill suma a las reglas de `eecheverria-untitled-ui`:

1. **El botón primario es `brand-600`, no #2C589A.** `bg-brand-solid` apunta a `brand-600`
   (#234B85) y su hover a `brand-700`: es la convención de Untitled UI y se ve bien. No lo "corrijas"
   con `bg-[#2C589A]` ni con `bg-brand-500`. El #2C589A oficial aparece solo en `focus-ring`,
   `border-brand` y las superficies de marca.
2. **Los pasos crudos de rampa, solo en superficies de marca.** `bg-brand-500` y `text-accent-600`
   aparecen en el panel de la pantalla de acceso y en piezas de marca, no en la UI de trabajo; ahí
   mandan los tokens semánticos.
3. **El rojo DPB no es el rojo de error.** La rampa `accent` es para acentos puntuales de marca. Los
   errores, las acciones destructivas y las alertas usan `error-*`: mezclarlos hace que un acento se
   lea como un fallo.
4. **Lienzo y superficies.** Fondo `bg-canvas`; tarjetas `rounded-xl bg-primary ring-1
   ring-secondary`; bloques internos `bg-secondary`. Sombras: `shadow-md` en las tarjetas del shell,
   `shadow-xl` en diálogos, `shadow-lg` en toasts y ninguna en bloques internos.
5. **Todo en español.** Si un componente del catálogo trae texto fijo en inglés, apágalo por props o
   recompónlo (la `Paginacion` existe por eso). Fechas, montos y mensajes, en español de Guatemala.
6. **La marca.** Isotipo DPB por defecto; una app puede tener marca propia (como el Portal de
   Finanzas), y se configura en una costura, no editando el lockup. No deformes, rotes ni recolorees el
   isotipo; usa la variante por fondo (`color` sobre claro, `white` sobre brand o accent, `mono` con
   `currentColor`). Su contorno es fino: en el lockup va a **32 px o más**; por debajo pierde la casa.
7. **Formularios: la skill no decide el estado.** `TarjetaDialogo` recibe un `onSubmit` y funciona
   igual con `handleSubmit` de React Hook Form que con estado propio. La elección es de
   `eecheverria-frontend-react` y `eecheverria-untitled-ui`, o del `CLAUDE.md` del proyecto.
8. **Modo oscuro listo, sin selector.** Los tokens ya se invierten con `.dark-mode`; la app arranca
   en claro y no trae control para cambiarlo. Si una app lo quiere, usa el `ThemeProvider` del starter
   y no escribas `dark:`.

## Las plantillas

Todas bajo `assets/plantilla/`, en la misma ruta que tendrán en el proyecto. Cada archivo abre con
un comentario de qué es y qué trampa esquiva; la anatomía y el cuándo usar cada una están en
`references/patrones.md`.

| Ruta | Qué es |
| --- | --- |
| `src/styles/brand-dpb.css` | Rampas `brand` y `accent`, Open Sans, `bg-canvas`, `warning_subtle`, `--color-chart-1/2` |
| `src/styles/scrollbars.css` | Barras de desplazamiento sutiles con tokens |
| `public/marca/dpb-isotipo.svg` | Isotipo para el favicon |
| `src/brand/dpb-isotipo.tsx` | `DpbIsotipo` — variantes `color`, `white`, `mono`; no se deforma desde props |
| `src/brand/app-logo.tsx` | `AppLogo` — lockup marca + nombre + «Desarrollos Palo Blanco», modo `colapsado` |
| `src/brand/iso-pattern.tsx` · `microsoft-logo.tsx` | Retícula del panel de acceso · ícono del botón de Microsoft 365 |
| `src/layouts/app-layout.tsx` | `AppLayout` — `title`, `subtitle`, `action`, `filtros`, `volverA`; el h1 de la página |
| `src/layouts/pantalla-acceso.tsx` | `PantallaAcceso` — `lineaSuperior`, `titulo`, `descripcion` y la acción como `children`; sin auth |
| `src/pages/no-encontrada.tsx` | `NoEncontradaPage` — 404 en español, no depende de la sesión |
| `src/features/shell/sidebar.tsx` | Sidebar de tres pisos, colapsable, con menú de cuenta |
| `src/features/shell/use-sidebar-collapsed.ts` | Estado colapsado recordado; sin preferencia, colapsada por debajo de `lg` |
| `src/features/shell/` (costuras) | `shell.config.ts`, `nav-items.ts`, `use-cuenta.ts` — ver paso 4 |
| `src/features/comunes/tarjeta-dialogo.tsx` | `TarjetaDialogo` — hijo directo de `Dialog`: cabecera y pie fijos, cuerpo con scroll, `onSubmit` a un `<form noValidate>` |
| `src/features/comunes/confirmar-dialog.tsx` | `ConfirmarDialog` — confirmación de lo irreversible, tono `primary-destructive` |
| `src/features/comunes/mensaje-error.tsx` | `MensajeError` (título, detalles, **remedio**, `onReintentar`) y `NotaInformativa` |
| `src/features/comunes/estado-vacio.tsx` | `EstadoVacio` — `relleno` o `punteado`; dos textos: «está vacío» vs. «nada coincide» |
| `src/features/comunes/esqueleto.tsx` | `Esqueleto` — carga con `role="status"` y `motion-reduce` |
| `src/features/comunes/paginacion.tsx` | `Paginacion` — en español; acepta el `meta` del backend tal cual |
| `src/features/comunes/notificaciones.tsx` | `Notificaciones` (se monta una vez) y `notificar.exito/error` |
| `src/features/comunes/seccion.tsx` · `cifra-kpi.tsx` · `explicacion.tsx` | Bloque de detalle · KPI dentro de un `<dl>` · ayuda «?» con tooltip |
| `src/features/comunes/tabla.ts` · `estado-fila.ts` · `toggle.ts` | Área de tabla con encabezado fijo y `FILA` · filas inactivas · `Toggle` con hint a todo el ancho |

## Fuente de verdad y versiones

- **Esta skill es la fuente de verdad de la cara DPB.** app-presupuestos es su origen, pero no se
  sincroniza sola. Una mejora a una pieza DPB va primero aquí (PR al repo de skills) y de ahí a las
  apps; si se queda en una sola app, la siguiente nace sin ella.
- **Probado con** el starter de Untitled UI del 2026-10-22 (`npx untitledui@latest init --vite`):
  React 19.3, `react-aria-components` 1.21.1, Tailwind 4.3.3, TypeScript 6.0.3, Vite 8.3,
  `react-router` 8.5.0 y `sonner` 2.0.8 — typecheck, build y revisión visual en claro, oscuro y a
  440 px. El origen corre con `react-router` 7.18 y TypeScript 5.9; las plantillas compilan con ambos
  porque solo usan `NavLink`, `useLocation` y `Navigate`.
- **El catálogo ya cambió una vez.** En app-presupuestos el `Modal` venía sin superficie; en el starter
  actual trae fondo, sombra y esquinas, pero su `Dialog` desplaza todo. `TarjetaDialogo` ya está
  ajustada al catálogo actual, y por eso el `CLAUDE.md` del origen ya no es guía para esa pieza.
- **Cuando cambie el catálogo** (`npx untitledui upgrade`, una versión mayor), vuelve a probar las
  plantillas y revisa `references/trampas.md`: varias trampas dependen de la versión.
- **Actualizar las piezas de un proyecto que ya las tiene** es una decisión del usuario: corre el
  script con `--dry-run`, muestra el diff de cada conflicto y pregunta. Nunca pises en silencio.

## Sugerencias para la siguiente versión

- **Login con MSAL como pieza opcional.** Hoy la plantilla trae solo la pantalla (`PantallaAcceso`)
  y la costura (`use-cuenta.ts`, más el comentario de dónde montar la auth en `main.tsx`); el botón
  «Iniciar sesión con Microsoft» no hace nada. Todas las apps de DPB repiten lo mismo: el
  `MsalProvider` con `initialize()` y `handleRedirectPromise()` antes del render, el `use-cuenta`
  real, el cierre de sesión local (`clearCache` + `prompt: "select_account"`), la ruta protegida y
  el token solo en memoria. Se dejó fuera porque amplía la skill de "cómo se ve" a "cómo se entra";
  si se agrega, que pase antes por `eecheverria-security`. **Mientras tanto**, si piden el login,
  conéctalo en el proyecto siguiendo los comentarios de esas costuras y revísalo con
  `eecheverria-security` (o el agente `pb-skills:revisor-seguridad`).

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Le pongo `bg-[#2C589A]` al botón para que sea el azul oficial" | El primario es `bg-brand-solid` (brand-600), a propósito. El hex fijo se sale del sistema y no se invierte en oscuro. |
| "Meto los colores de DPB directo en `theme.css`, es más rápido" | El siguiente `npx untitledui upgrade` lo pisa. La marca vive en `brand-dpb.css`. |
| "Es un modal sencillo, lo escribo desde cero" | El `Dialog` del catálogo desplaza todo su contenido, cabecera y botones incluidos. `TarjetaDialogo`, como hijo directo del `Dialog`, deja fijos la cabecera y el pie y solo desplaza el cuerpo. |
| "Uso la paginación del catálogo" | Trae texto fijo en inglés. Para eso existe `Paginacion`. |
| "El error lo pinto con el rojo de la marca" | El rojo DPB es acento, no semántica. Errores con `error-*`. |
| "Engroso el contorno del isotipo para que se vea a 24 px" | Es la marca: no se deforma. Llévalo a 32 px o más. |
| "Uso el toast de Untitled UI" | Es PRO. `notificar.exito/error` con sonner hace lo mismo con el estilo DPB. |
| "En este proyecto ajusto la plantilla a mi gusto" | Esa app deja de verse como las demás. Si es una mejora, va a la skill. |
| "El script marcó conflictos; los sobrescribo y ya" | Pueden ser cambios del usuario. Diff y pregunta, uno por uno. |

## Red flags

- `theme.css` o cualquier archivo de `src/components/` modificado para meter la marca.
- Hex de marca escritos a mano (`#2C589A`, `#CC1F37`) o clases `bg-[#…]` en vistas.
- `accent-*` usado para errores o acciones; `error-*` usado como acento de marca.
- Un shell distinto al `AppLayout` (sidebar del catálogo, header propio) sin una razón del usuario.
- Diálogos, vacíos, errores o paginación escritos a mano existiendo la pieza común.
- Texto visible en inglés que venía de un componente del catálogo.
- El isotipo estirado, recoloreado o por debajo de 32 px en el lockup.
- Plantillas copiadas pisando archivos existentes sin mostrar el diff.
- Una mejora a una pieza DPB que se quedó solo en un proyecto.

## Verificación

Antes de decir "listo" en una app con la capa DPB:

- [ ] `git diff` no toca `src/styles/theme.css` ni `src/components/`.
- [ ] `brand-dpb.css` se carga después de `theme.css` en `globals.css`.
- [ ] Open Sans carga (pestaña Network o fuente computada) y el favicon es el isotipo.
- [ ] Las costuras están configuradas: nombre de la app, navegación real, cuenta conectada a la auth.
- [ ] Cero hex de marca y cero `dark:` fuera de `src/components/`.
- [ ] Toda pantalla nueva usa `AppLayout` y las piezas comunes donde aplican.
- [ ] Todo el texto visible está en español, incluido el 404.
- [ ] La vista se revisó **en claro y en oscuro** (clase `dark-mode`) y **solo con teclado**.
- [ ] Typecheck y build pasan (`npm run build`); resultado real reportado.
- [ ] Conflictos del script resueltos con el usuario, ninguno pisado en silencio.

## Cómo encaja con las demás skills

| Tema | Manda |
| --- | --- |
| Cómo se ve DPB: tema, marca, shell, piezas comunes, recetas de pantalla | **esta skill** |
| Catálogo, CLI, tokens semánticos, React Aria, free vs PRO | `eecheverria-untitled-ui` |
| Arquitectura de componentes, estado, formularios, data fetching | `eecheverria-frontend-react` |
| Qué va en pantalla, cuántas opciones, jerarquía, esperas | `eecheverria-ux-laws` |
| Colores de series y paleta de gráficas | `dataviz` (revalida si agregas series) |
| Marca DPB en documentos, presentaciones y correos | `dpbranding`, `dpb-presentaciones` |

- **`eecheverria-senior-dev`** — capa base: el `CLAUDE.md` del proyecto manda; confirma antes de
  `init` o de cualquier copia que cree estructura.
- **`eecheverria-git-workflow`** — commitea aparte la capa DPB copiada (código de plantilla) y aparte
  las pantallas: mezclarlos hace el diff irrevisable.
- **`dpbranding`** — usa los mismos colores (#2C589A y #CC1F37, los de su `SKILL.md`). Su
  `references/color-specifications.md` trae otra paleta (#2EA3F2, #C0392B) que no coincide: si
  dudas, mandan los de `brand-dpb.css`. Para la UI de una app manda esta skill aunque `dpbranding`
  sugiera fondo blanco y sidebar azul: eso es para artefactos y documentos; la app usa el lienzo
  `bg-canvas` y la sidebar clara (el fondo azul sólido en la navegación se probó y se descartó).

## Referencias

- **`references/patrones.md`** — cómo se arma una pantalla DPB: anatomía del shell, recetas de página,
  cuándo usar cada pieza común, tablas, formularios en diálogo, estados, badges, botones, gráficas,
  marca, responsive y accesibilidad. Léelo en el paso 5.
- **`references/trampas.md`** — lo que ya mordió en app-presupuestos, con síntoma, causa, arreglo y
  versión en que se observó. Léelo cuando el catálogo se porte raro.
- **`scripts/copiar-plantilla.mjs`** — copia la plantilla sin pisar nada (paso 2).
- **`assets/plantilla/`** y **`assets/fragmentos/`** — el código (pasos 2 y 3).
