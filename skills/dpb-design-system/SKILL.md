---
name: dpb-design-system
description: >-
  Design system de Desarrollos Palo Blanco (DPB) para apps web internas, ENCIMA de Untitled UI React:
  la cara de app-presupuestos como plantillas listas para copiar — tema de marca (azul #2C589A, rojo
  #CC1F37, Open Sans), isotipo, shell (lienzo con tarjetas flotantes y sidebar colapsable), acceso, 404
  y piezas comunes (diálogo, confirmación, error, vacío, paginación, avisos, KPI, tabla, montos).
  Tesis — copia la plantilla, no la reescribas: que todas las apps se sientan del mismo lugar es el
  valor. Actívate SIEMPRE que se cree o trabaje el frontend de una app de DPB / Palo Blanco, que el
  proyecto tenga src/styles/brand-dpb.css, o el usuario diga "design system de DPB", "que se vea como
  presupuestos", "aplica la marca DPB a la app", "app nueva para Palo Blanco", "el sidebar de DPB" o
  "pon el logo de DPB". Se carga junto con eecheverria-untitled-ui (catálogo y tokens); estado,
  formularios y datos son de eecheverria-frontend-react. Para documentos o presentaciones con la
  marca, usa dpbranding.
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
  `dpb-presentaciones`, skills de la organización que no vienen en este plugin); esta skill es para la
  UI de aplicaciones.
- **Proyecto React sin Untitled UI** — no lo migres de oficio. Adoptar Untitled UI es decisión del
  usuario: pregunta primero (mismo criterio que `eecheverria-untitled-ui`).

## Paso 0 — Detecta el terreno

Lee primero el `CLAUDE.md` del proyecto: **manda sobre esta skill** (regla de
`eecheverria-senior-dev`). Hay una excepción: el `CLAUDE.md` que deja `npx untitledui init` es el
`AGENT.md` del proveedor, no una decisión del proyecto, y su sección de color de marca manda editar
`theme.css`. En un arranque, agrégale al inicio una sección «Capa DPB» que diga que la marca vive en
`brand-dpb.css` y que en el diseño manda `dpb-design-system`; así la regla sobrevive aunque esta skill
no se cargue.

| Señal en el proyecto | Escenario | Qué haces |
| --- | --- | --- |
| Directorio vacío o "haz la app nueva de …" | Arranque | Confirma y corre `npx untitledui@latest init <carpeta> --vite -y` desde la carpeta padre (crea `<carpeta>` o usa la vacía). Haz un **commit base** del starter antes de copiar: `init` deja un `.git` sin commits, y sin base `git diff` no puede mostrar qué cambió la capa DPB. Luego la capa completa |
| `src/components/base/` + `src/styles/theme.css` sin `src/styles/brand-dpb.css` | Adopción | Comprueba las piezas del catálogo que piden las plantillas (paso 2) y aplica la capa con el script |
| Ya existe `src/styles/brand-dpb.css` | Ya es DPB | Usa las piezas que ya están; si difieren de la plantilla, muestra el diff y pregunta antes de actualizar |
| Next.js, o un proyecto sin `src/` | No soportado | Las plantillas son para Vite + react-router con `src/`: dilo y pregunta; no las copies |
| React sin Untitled UI | Otro sistema | Pregunta; no instales nada de oficio |

**Catálogo anterior.** `TarjetaDialogo` supone el `Modal` del catálogo actual. Si el `Dialog` de
`src/components/application/modals/modal.tsx` no lleva `max-h-[inherit]`, el proyecto tiene el
catálogo anterior, cuyo `Modal` no trae fondo ni alto tope: pásale a cada `TarjetaDialogo`
`className="bg-primary shadow-xl max-h-[85dvh]"`, o actualiza el catálogo con `npx untitledui upgrade`
si el usuario lo decide.

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

Carga también `eecheverria-untitled-ui` si no lo está: esta skill le delega el catálogo, el CLI y los
tokens. Untitled UI pide su piso de versiones (React 19.2, Tailwind 4.3, `react-aria-components` 1.20;
ver esa skill). Además, las plantillas usan `react-router` (`NavLink`, `useLocation`) y `sonner`. Si el
proyecto está por debajo del piso, **para y dilo** antes de copiar.

El starter se mueve rápido: dos `init` del mismo día trajeron `react-aria-components` 1.21.1 y 1.22.1.
Anota las versiones que salieron; si algo del catálogo no cuadra con `references/`, la versión es lo
primero que se revisa.

### 2 · Copia la plantilla

El script vive en el directorio base de esta skill; pásale la raíz del proyecto como **ruta
absoluta**, así no depende de desde dónde lo corras:

```bash
node "<base-de-la-skill>/scripts/copiar-plantilla.mjs" "<raíz-del-proyecto>" --dry-run   # primero: qué crearía y qué choca
node "<base-de-la-skill>/scripts/copiar-plantilla.mjs" "<raíz-del-proyecto>"
```

Las comillas importan: es habitual que las rutas tengan espacios.

El script copia `assets/plantilla/` completo: **crea** lo que falta, **salta** lo idéntico y
**lista los conflictos** (archivos que ya existen y difieren) sin tocarlos; termina con código 2 si
hubo alguno. Cada conflicto es una decisión del usuario: muéstrale el diff y pregunta, y **resuélvelos
antes de la copia real**. La copia crea igual todo lo demás, y una plantilla nueva junto a una vieja que
chocó puede no compilar. Es la disciplina de alcance de `eecheverria-senior-dev` aplicada a una copia
masiva: el código del proyecto puede tener cambios locales que importan.

Las costuras (paso 4) no cuentan como conflicto: si ya existen, son del proyecto y el script no las
toca. Si una versión nueva de la plantilla les agregó un campo, el typecheck lo marca (`TS2339`) y se
suma a mano, mirando la plantilla.

Las plantillas usan estas piezas del catálogo, bajo `src/components/`: `base/buttons/button`,
`base/buttons/button-utility`, `base/tooltip`, `base/dropdown`, `base/avatar`,
`foundations/featured-icon` y `application/modals/modal`. Usan también `src/utils/cx.ts` y los providers
del starter (`src/providers/theme-provider.tsx`, `router-provider.tsx`). El starter completo las trae.
Un proyecto armado con `add` sueltos puede no tenerlas: tráelas con `npx untitledui@latest add <slug> -y`
(los slugs están en `eecheverria-untitled-ui`). Si faltan los providers, el proyecto no salió del
starter: pregunta.

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

En un arranque, borra `src/pages/home-screen.tsx` y `src/pages/not-found.tsx` del starter (el 404
viene en inglés) y quita sus imports de `main.tsx`: los reemplazan las páginas de la app y
`NoEncontradaPage`.

### 4 · Configura las costuras

Lo único que cambia de una app a otra está concentrado en pocos archivos. Edita **solo** estos; el
resto de la plantilla se queda como viene:

| Archivo | Qué cambias |
| --- | --- |
| `src/features/shell/shell.config.ts` | `nombreApp`, `claveSidebarColapsada` (con el prefijo de la app), `correoSoporte` (en DPB, el de IT) y, si la app tiene marca propia, `marca` |
| `src/features/shell/nav-items.ts` | `NAV_ITEMS`: los módulos reales, agrupados y en el orden del proceso. `roles` solo oculta entradas; la autorización es del backend |
| `src/features/shell/use-cuenta.ts` | Conéctalo a la auth del proyecto (en DPB suele ser MSAL) y ajusta `Rol`. **Sin login todavía, déjalo como viene**: `cuenta: null`, y la sidebar no muestra el menú de cuenta ni las entradas que piden `roles`. Nunca pongas una cuenta de mentira: llega a producción |
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
   `border-brand`, la serie 1 de las gráficas (`chart-1`) y las superficies de marca.
2. **Los pasos crudos de rampa, solo en superficies de marca.** `bg-brand-500`, `text-accent-600` y el
   texto blanco sobre ellos (`text-white`, `text-white/75`) aparecen en el panel de la pantalla de
   acceso y en piezas de marca, no en la UI de trabajo; ahí mandan los tokens semánticos. Es la única
   excepción a la regla de solo tokens de `eecheverria-untitled-ui`: esa superficie es azul en claro y
   en oscuro, y no debe invertirse.
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
   isotipo; usa la variante por fondo: `color` sobre claro y también sobre el fondo oscuro de la app
   (lo pide el manual de marca), `white` sobre brand o accent, y `mono` con `currentColor`. Su contorno
   es fino: va a **32 px como mínimo**; por debajo, la casa se pierde y solo quedan los cuadros.
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
| `src/layouts/app-layout.tsx` | `AppLayout` — `title`, `subtitle`, `action`, `filtros`, `volverA` y `aviso` (franja fija de contexto); el h1 de la página |
| `src/layouts/pantalla-acceso.tsx` | `PantallaAcceso` — `lineaSuperior`, `titulo`, `descripcion` y la acción como `children`; sin auth |
| `src/pages/no-encontrada.tsx` | `NoEncontradaPage` — 404 en español, no depende de la sesión |
| `src/features/shell/sidebar.tsx` | Sidebar de tres pisos, colapsable, con menú de cuenta |
| `src/features/shell/use-sidebar-collapsed.ts` | Estado colapsado, guardado solo cuando el usuario lo cambia; sin preferencia, colapsada por debajo de `lg` |
| `src/features/shell/` (costuras) | `shell.config.ts`, `nav-items.ts`, `use-cuenta.ts` — ver paso 4 |
| `src/features/comunes/tarjeta-dialogo.tsx` | `TarjetaDialogo` — hijo directo de `Dialog`: cabecera y pie fijos, cuerpo con scroll, `onSubmit` a un `<form noValidate>`; `className` solo para el catálogo anterior (paso 0) |
| `src/features/comunes/confirmar-dialog.tsx` | `ConfirmarDialog` — confirmación de lo irreversible, tono `primary-destructive` |
| `src/features/comunes/mensaje-error.tsx` | `MensajeError` (título, detalles, **remedio**, `onReintentar`) y `NotaInformativa` |
| `src/features/comunes/estado-vacio.tsx` | `EstadoVacio` — `relleno` o `punteado`; dos textos: «está vacío» vs. «nada coincide» |
| `src/features/comunes/esqueleto.tsx` | `Esqueleto` — la primera carga, con `role="status"` que anuncia su etiqueta y `motion-reduce` |
| `src/features/comunes/paginacion.tsx` | `Paginacion` — en español; props `page`, `totalPages`, `total` (mapea desde el contrato del backend) e `isDisabled` mientras recarga |
| `src/features/comunes/notificaciones.tsx` | `Notificaciones` (se monta una vez) y `notificar.exito/error` |
| `src/features/comunes/seccion.tsx` · `cifra-kpi.tsx` · `explicacion.tsx` | Bloque de detalle · KPI dentro de un `<dl>` · ayuda «?» con tooltip |
| `src/features/comunes/tabla.ts` · `estado-fila.ts` · `toggle.ts` | Área de tabla con encabezado fijo y `FILA` (44 px reales) · filas inactivas · `Toggle` con hint a todo el ancho |
| `src/utils/formato.ts` | `formatearMonto` («Q 4,500.00») y `formatearCompacto` («1.9k», «1.4M»): los montos de toda la app |

## Fuente de verdad y versiones

- **Esta skill es la fuente de verdad de la cara DPB.** app-presupuestos es su origen, pero no se
  sincroniza sola. Una mejora a una pieza DPB va primero aquí (PR al repo de skills) y de ahí a las
  apps; si se queda en una sola app, la siguiente nace sin ella.
- **Probado con** el starter de Untitled UI del 2026-10-22 (`npx untitledui@latest init --vite`):
  React 19.3, `react-aria-components` 1.21.1 y 1.22.1, Tailwind 4.3.3, TypeScript 6.0.3, Vite 8.3,
  `react-router` 8.5.0 y `sonner` 2.0.8: typecheck, build, revisión visual en claro, oscuro y a 440 px,
  y una app de prueba armada de cero siguiendo solo esta skill. El origen corre con `react-router` 7.18
  y TypeScript 5.9. Las plantillas solo usan `NavLink` y `useLocation`, que no cambian entre esas
  versiones; el fragmento de `main.tsx` usa además `Navigate`.
- **El catálogo ya cambió una vez.** En app-presupuestos el `Modal` venía sin superficie; en el starter
  actual trae fondo, sombra y esquinas, pero su `Dialog` desplaza todo. `TarjetaDialogo` ya está
  ajustada al catálogo actual, y por eso el `CLAUDE.md` del origen ya no es guía para esa pieza.
- **Cuando cambie el catálogo** (`npx untitledui upgrade`, una versión mayor), vuelve a probar las
  plantillas y revisa `references/trampas.md`: varias trampas dependen de la versión.
- **Actualizar las piezas de un proyecto que ya las tiene** es una decisión del usuario: corre el
  script con `--dry-run`, muestra el diff de cada conflicto y pregunta. Nunca pises en silencio. Las
  costuras no se reemplazan nunca; si la plantilla nueva les agregó un campo, el typecheck lo dice.

## Sugerencias para la siguiente versión

- **Login con MSAL como pieza opcional.** Hoy la plantilla trae solo la pantalla (`PantallaAcceso`)
  y la costura (`use-cuenta.ts`, más el comentario de dónde montar la auth en `main.tsx`); el botón
  «Iniciar sesión con Microsoft» no hace nada. Todas las apps de DPB repiten lo mismo: el
  `MsalProvider` con `initialize()` y `handleRedirectPromise()` antes del render, el `use-cuenta`
  real, el cierre de sesión (local o federado: cada uno tiene su riesgo, ver `use-cuenta.ts`), la ruta
  protegida y el token solo en memoria. Se dejó fuera porque amplía la skill de "cómo se ve" a "cómo se entra";
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
| "El `CLAUDE.md` que generó `init` dice que edite `theme.css`" | Es el `AGENT.md` del proveedor, no una decisión del proyecto. En DPB, la marca va en `brand-dpb.css`. |
| "Pongo una cuenta de ejemplo para que el shell se vea completo" | Llega a producción el día que nadie la conecta. Sin login, `cuenta: null`. |

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

- [ ] Contra el commit base, `git diff` no toca `src/styles/theme.css` ni `src/components/`, salvo el
      parche de `calendar.tsx` que `references/trampas.md` documenta solo para catálogos anteriores.
- [ ] `brand-dpb.css` se carga después de `theme.css` en `globals.css`.
- [ ] Open Sans carga, también el 500 (pestaña Network o fuente computada), y el favicon es el isotipo.
- [ ] Las costuras están configuradas: nombre de la app, navegación real, y la cuenta conectada a la
      auth o en `null` si aún no hay login. Nunca una de ejemplo.
- [ ] Cero hex de marca y cero `dark:` en las vistas. Quedan fuera `src/brand/`, `public/marca/` e
      `index.html`, que llevan el isotipo y el `theme-color` a propósito.
- [ ] Toda pantalla con sesión usa `AppLayout` (el acceso y el 404 tienen los suyos) y las piezas
      comunes donde aplican.
- [ ] Todo el texto visible está en español, incluido el 404.
- [ ] La vista se revisó en el navegador (`npm run dev`) **en claro y en oscuro** (clase `dark-mode`) y
      **solo con teclado**. Al terminar, el servidor quedó apagado: en Windows, detener la tarea de
      fondo puede dejar vivo el proceso de Node en el puerto; comprueba el puerto y mátalo por PID.
- [ ] Typecheck y build pasan (`npm run build`); resultado real reportado.
- [ ] Conflictos del script resueltos con el usuario, ninguno pisado en silencio.

## Cómo encaja con las demás skills

| Tema | Manda |
| --- | --- |
| Cómo se ve DPB: tema, marca, shell, piezas comunes, recetas de pantalla | **esta skill** |
| Catálogo, CLI, tokens semánticos, React Aria, free vs PRO | `eecheverria-untitled-ui` |
| Arquitectura de componentes, estado, formularios, data fetching | `eecheverria-frontend-react` |
| Qué va en pantalla, cuántas opciones, jerarquía, esperas | `eecheverria-ux-laws` |
| Colores de series y paleta de gráficas | `dataviz`, si está (no viene en el plugin). Si no, al agregar una serie: al menos 3:1 contra el fondo, en claro y en oscuro, y series que no se distingan solo por color |
| Marca DPB en documentos, presentaciones y correos | `dpbranding`, `dpb-presentaciones` (skills de la organización, fuera del plugin) |

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
