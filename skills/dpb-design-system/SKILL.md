---
name: dpb-design-system
description: >-
  Design system de Desarrollos Palo Blanco (DPB) para apps web internas: consume el paquete
  @desarrollospaloblanco/ui (el catálogo de Untitled UI React con el tema DPB, que publica el equipo
  del design system en GitHub Packages) y le pone encima la cara de app-presupuestos como plantillas
  listas para copiar — isotipo, shell (lienzo con tarjetas flotantes y sidebar colapsable), acceso, 404
  y piezas comunes (diálogo, confirmación, error, vacío, paginación, avisos, KPI, tabla, montos). Lee el
  catálogo de la versión instalada antes de escribir UI y avisa si hay una versión nueva. Tesis — usa el
  paquete y copia la plantilla, no los reescribas: que todas las apps se sientan del mismo lugar es el
  valor. Actívate SIEMPRE que se cree o trabaje el frontend de una app de DPB / Palo Blanco, que el
  proyecto tenga @desarrollospaloblanco/ui en su package.json, src/features/shell/ o
  src/styles/brand-dpb.css (modelo anterior), o el usuario diga "design system de DPB", "el paquete de
  UI de DPB", "@desarrollospaloblanco/ui", "que se vea como presupuestos", "aplica la marca DPB a la
  app", "app nueva para Palo Blanco", "el sidebar de DPB" o "pon el logo de DPB". Se carga junto con
  eecheverria-untitled-ui (reglas de uso de los componentes); estado, formularios y datos son de
  eecheverria-frontend-react. Para documentos o presentaciones con la marca, usa dpbranding.
---

# dpb-design-system

## Resumen

**Un design system no son los colores: es que dos apps distintas se sientan del mismo lugar.**
app-presupuestos (el Portal de Finanzas) ya resolvió cómo se ve y se comporta una app interna de DPB, y
el equipo pidió que las demás se vean igual. La solución tiene dos dueños:

| Capa | Qué trae | De dónde sale |
| --- | --- | --- |
| **Catálogo y tema** | Los componentes de Untitled UI (gratuitos) compilados, y el tema DPB: rampas `brand` (#2C589A) y `accent` (#CC1F37), Inter, `bg-canvas`, colores de gráficas, modo oscuro | El paquete **`@desarrollospaloblanco/ui`**, del equipo del design system (`desarrollospaloblanco/dpb-ui`) |
| **Marca y shell** | Isotipo DPB, lockup, `AppLayout` (lienzo + dos tarjetas flotantes), sidebar colapsable, pantalla de acceso, 404, providers | Esta skill: `assets/plantilla/` |
| **Piezas comunes** | Superficie de diálogo, confirmación, error con remedio, vacío, paginación en español, notificaciones, sección, KPI, utilidades de tabla, montos y fechas | Esta skill: `assets/plantilla/` |

`assets/plantilla/` refleja la raíz de un proyecto. Esta skill **no** repite lo que ya cubre
`eecheverria-untitled-ui` (reglas de React Aria, `cx`, componentes compuestos, tokens semánticos). Se
cargan juntas: aquella dice cómo se usan los componentes, el paquete dice cuáles hay y esta, cómo se ve
DPB.

Las dos reglas duras, y su porqué:

- **Usa el paquete y copia la plantilla; no los reescribas.** Escrita desde una descripción, cada app
  sale un poco distinta, y la consistencia es justo lo que se pidió. Además, las plantillas ya esquivan
  trampas reales del catálogo (el `Dialog` que desplaza también la cabecera y el pie, el encabezado de la
  tabla que se va con las filas, el `Toggle` que abre un scroll horizontal): al reinventarlas, las vuelves
  a pisar.
- **El paquete no se toca desde la app.** Ni componentes del catálogo copiados a `src/components/`, ni
  un `@theme` que redefina sus tokens (`brand-*`, `accent-*`, la fuente, los semánticos). Esa app se
  separaría de las demás y la corrección no llegaría a ninguna otra. Lo que falte o esté mal se pide
  en `desarrollospaloblanco/dpb-ui`.

Al construir cualquier pieza de UI, busca en este orden: **pieza DPB** (`src/features/comunes/`,
shell) → **catálogo del paquete** (`scripts/catalogo.mjs`, paso 6) → **a mano con tokens**
(`eecheverria-frontend-react`), y lo que hiciste a mano se propone al paquete o a esta skill.

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo
`eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes
de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

Lo mismo vale para las plantillas: si en un proyecto descubres una mejora a una pieza DPB, **no la
dejes solo en ese proyecto** — propón llevarla a la skill, que es la fuente de verdad (ver "Fuente de
verdad y versiones"). Y si la mejora es de un componente del catálogo o de un token, va al paquete.

## Cuándo usarla

- Vas a crear el frontend de una app interna de DPB.
- Un proyecto de DPB en React + Vite necesita la cara DPB (paquete, shell, piezas).
- Construyes una pantalla en un proyecto que ya usa `@desarrollospaloblanco/ui` o la capa DPB.
- Revisas una UI de DPB y ves colores fuera de marca, un shell distinto o piezas reinventadas.

**Cuándo NO usarla:**

- **Proyectos que no son de DPB**: la marca no se aplica por defecto.
- **Documentos, presentaciones, correos o PDFs con la marca**: eso es de `dpbranding` (y
  `dpb-presentaciones`, skills de la organización que no vienen en este plugin). Esta skill es para la
  UI de aplicaciones.
- **Proyecto React sin el paquete**: no lo migres de oficio. Adoptar `@desarrollospaloblanco/ui` es
  decisión del usuario: pregunta primero.

## Paso 0 — Detecta el terreno

Lee primero el `CLAUDE.md` del proyecto: **manda sobre esta skill** (regla de
`eecheverria-senior-dev`). En un arranque o una adopción, propón agregarle al inicio la sección de
`assets/fragmentos/claude-md-capa-dpb.md` (tal cual, reemplazando `<Nombre de la app>`; si no hay
`CLAUDE.md`, créalo con ella) y agrégala cuando el usuario confirme, después del commit base. Así la
regla sobrevive aunque esta skill no se cargue, y cada máquina escribe la misma sección.

| Señal en el proyecto | Escenario | Qué haces |
| --- | --- | --- |
| Directorio vacío o "haz la app nueva de …" | Arranque | Confirma y, desde la carpeta padre, `npx create-vite@latest <carpeta> --template react-ts --no-interactive --no-immediate`. `git init` y un **commit base** con el proyecto de Vite tal cual, antes de tocar nada, con la identidad que corresponda al proyecto (en DPB, la cuenta de trabajo): sin base, `git diff` no muestra qué cambió la capa. Luego la capa completa (pasos 2 a 7), que empieza borrando la demo de Vite: `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/`, `public/favicon.svg` y `public/icons.svg`. La capa va en su propio commit, y las pantallas aparte |
| React + Vite con `src/`, sin `src/features/shell/` ni catálogo copiado | Adopción | Pregunta. Con el sí: paso 2 (si el paquete no está) y la capa con el script |
| `@desarrollospaloblanco/ui` en `package.json` y `src/features/shell/` | Ya es DPB | Revisa la versión (paso 1). Usa las piezas que ya están; si difieren de la plantilla, muestra el diff y pregunta antes de actualizar |
| `src/components/base/`, `src/styles/theme.css` o `src/styles/brand-dpb.css` | Catálogo copiado (modelo anterior, como app-presupuestos) | **No copies plantillas nuevas**: importan del paquete. Trabaja con las piezas que la app ya tiene y, si hay que actualizarlas, propón migrar primero con `references/migracion.md`. Nunca migres de oficio |
| Next.js, otro bundler o un proyecto sin `src/` | No soportado | Las plantillas son para Vite + react-router con `src/`: dilo y pregunta; no las copies. El paquete sí funciona en Next (su manual lo explica), pero sin la capa DPB |

## Acceso al paquete

`@desarrollospaloblanco/ui` es privado y vive en GitHub Packages, que **siempre** pide autenticación
para instalar. Se configura una vez por computadora y una vez por proyecto:

- **En la computadora (lo hace el usuario).** Un token *classic* con **solo** `read:packages` y fecha
  de vencimiento (GitHub no acepta *fine-grained* en GitHub Packages), autorizado para el SSO de
  `desarrollospaloblanco` si lo pide, y guardado en el `~/.npmrc` del usuario como
  `//npm.pkg.github.com/:_authToken=…`. **Tú no lo creas, no lo pides en el chat, no lo escribes y no
  lees ni muestras `~/.npmrc`**: guía al usuario para que lo haga él (o con `! <comando>`). Nunca el
  token de `gh`: sirve para casi todo su GitHub y no vence.
- **En el proyecto.** Un `.npmrc` en la raíz con una sola línea, sin token, que sí se commitea:

  ```ini
  @desarrollospaloblanco:registry=https://npm.pkg.github.com
  ```

  Sin ella npm buscaría el nombre en npmjs.com, donde cualquiera podría publicar uno igual.
- **Comprobar el acceso**, desde la raíz del proyecto y sin mostrar el token:
  `npm view @desarrollospaloblanco/ui version`. Un número es acceso; `E401`/`E403` es el token (falta,
  venció, sin `read:packages` o sin SSO); `E404` desde `npm.pkg.github.com` es que el token no ve el
  paquete (lo da un administrador de la organización); `E404` desde `registry.npmjs.org` es que falta
  la línea del scope.
- **En el CI de la app**, la sección 2.3 del manual del paquete: el repo de la app con rol *Read* en
  *Manage Actions access*, y `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` con `packages: read`.

**Sin acceso, para y dilo**: qué falta y cómo se arregla. No sigas con componentes escritos a mano ni
traídos con `npx untitledui add` "mientras tanto": esa app nacería paralela al paquete.

## Proceso

```
1. DETECTA   → escenario (Paso 0) y versión del paquete
2. INSTALA   → acceso, .npmrc del proyecto y el paquete con sus dependencias
3. COPIA     → scripts/copiar-plantilla.mjs: crea lo que falta, nunca pisa
4. FUSIONA   → assets/fragmentos/ en vite.config.ts, tsconfig.app.json, index.html, main.tsx y globals.css
5. CONFIGURA → las costuras: nombre de la app, navegación, cuenta
6. COMPÓN    → pantallas con el catálogo del paquete y las recetas de references/patrones.md
7. VERIFICA  → typecheck + build, claro y oscuro, teclado, español
```

Los dos scripts viven en el directorio base de esta skill. Pásales la raíz del proyecto como **ruta
absoluta y entre comillas**: así no dependen de desde dónde los corras, y es habitual que las rutas
tengan espacios.

### 1 · Detecta

Carga también `eecheverria-untitled-ui` (reglas de uso de los componentes) y
`eecheverria-frontend-react` (estado, formularios y cómo se piden los datos), si no lo están: esta
skill les delega eso y solo fija cómo se ve cada estado. De `eecheverria-untitled-ui` **no aplican el
CLI ni su catálogo**: en DPB el catálogo es el paquete, sin componentes PRO, y su API se lee de la
versión instalada (paso 6).

**Si el proyecto ya usa el paquete, revisa su versión al empezar:**

```bash
node "<base-de-la-skill>/scripts/catalogo.mjs" "<raíz-del-proyecto>" version
```

Dice la versión instalada, la última publicada, si el `.npmrc` tiene la línea del scope y si el
`package-lock.json` la resuelve desde `npm.pkg.github.com`. Si hay una versión nueva, **avísalo en una
línea y no actualices**: es decisión del usuario, con el `CHANGELOG.md` delante. Mientras el paquete
esté en `0.x`, npm trata cada *minor* como posible cambio incompatible (`npm update` no la toma); se
instala a propósito (`npm install @desarrollospaloblanco/ui@^0.3.0`) y después typecheck, build y
revisión visual. Si no puede consultar la última, el script dice por qué; no es bloqueante.

El paquete pide React 19, Tailwind 4.3 o superior y `react-aria-components` 1.21 o superior, como
dependencias de la app. Las plantillas usan además `react-router` (`NavLink`, `useLocation`), `sonner`
y `@untitledui/icons`. Si el proyecto está por debajo, **para y dilo** antes de copiar.

### 2 · Instala

Con el acceso listo (ver "Acceso al paquete"), agrega la línea del scope al `.npmrc` del proyecto
(créalo si no existe) e instala:

```bash
npm install @desarrollospaloblanco/ui react-aria-components react-router sonner @untitledui/icons
npm install -D tailwindcss @tailwindcss/vite
```

`react` y `react-dom` ya vienen de Vite. `@untitledui/icons` es dependencia del paquete, pero las
plantillas la importan directo: declárala. Lo mismo con cualquier otra librería del paquete que la app
importe por su cuenta (`recharts`, `@internationalized/date`): hoy resolvería sin declararla, y puede
dejar de hacerlo al actualizar. Después, `catalogo.mjs version` no debe dar avisos, y
`npm ls react-aria-components` debe mostrar una sola versión: con dos copias, popovers y enlaces fallan
sin explicación.

### 3 · Copia la plantilla

```bash
node "<base-de-la-skill>/scripts/copiar-plantilla.mjs" "<raíz-del-proyecto>" --dry-run   # primero: qué crearía y qué choca
node "<base-de-la-skill>/scripts/copiar-plantilla.mjs" "<raíz-del-proyecto>"
```

El script copia `assets/plantilla/` completo: **crea** lo que falta, **salta** lo idéntico y
**lista los conflictos** (archivos que ya existen y difieren) sin tocarlos; termina con código 2 si
hubo alguno. La copia real se niega si el proyecto no declara el paquete (las plantillas importan de
él) y avisa si ve el catálogo copiado. Cada conflicto es una decisión del usuario: muéstrale el diff y
pregunta, y **resuélvelos antes de la copia real**. La copia crea igual todo lo demás, y una plantilla
nueva junto a una vieja que chocó puede no compilar. Es la disciplina de alcance de
`eecheverria-senior-dev` aplicada a una copia masiva: el código del proyecto puede tener cambios locales
que importan.

Resolver un conflicto es una de dos: aplicar la plantilla (copia a mano ese archivo desde
`assets/plantilla/`, encima del del proyecto) o quedarse con la versión del proyecto. En el segundo
caso, el script lo seguirá listando y terminando con código 2 en cada corrida: es lo esperado, no un
error nuevo. En un proyecto que salió del starter de Untitled UI, el `RouteProvider` sale idéntico y
el `ThemeProvider` sale en conflicto, porque la plantilla trae dos arreglos: aplica la plantilla salvo
que el proyecto lo haya cambiado.

Las costuras (paso 5) no cuentan como conflicto: si ya existen, son del proyecto y el script no las
toca. Por eso no guardan tipos ni lógica compartida: la forma de la configuración vive en
`configuracion.ts`, el tipo y el filtro de la navegación en `navegacion.ts` y la forma de la cuenta en
`cuenta.ts`, que sí se actualizan. Si una versión nueva le agregó un campo a la configuración, el
typecheck lo marca en `shell.config.ts` y se suma a mano.

Copia la capa completa aunque la primera pantalla no use todas las piezas: son pocas, chicas y
dependen entre sí, y tenerlas desde el día uno es lo que evita que la segunda pantalla se escriba a
mano.

### 4 · Fusiona los fragmentos

`assets/fragmentos/` trae lo que va **dentro** de archivos que el proyecto ya tiene. En un arranque,
`vite.config.ts`, `main.tsx` y `globals.css` reemplazan a los de Vite; en una adopción, se fusionan y
no se reemplaza el archivo entero. El comentario de cabecera de cada fragmento dice dónde va: no lo
copies al proyecto; los comentarios de dentro, sí.

- **`vite.config.ts`**: el plugin de Tailwind (lo pide el CSS del paquete) y el alias `@/` → `src/`
  que usan las plantillas.
- **`tsconfig.app.json`**: el mismo alias para TypeScript (`paths`). Se suma a `compilerOptions`.
- **`index-head.html`**: `lang="es"`, Inter, `theme-color`, favicon con el isotipo y el script
  anti-parpadeo (lee la clave `ui-theme`, la misma que el `ThemeProvider`).
- **`main.tsx`**: orden de providers, el montaje único de `<Notificaciones />` y la ruta 404.
- **`globals.css`**: va en `src/styles/globals.css`. `@import "@desarrollospaloblanco/ui/styles.css"`,
  que **reemplaza** a `@import "tailwindcss"` (trae Tailwind, sus plugins, el tema y el `@source` de los
  componentes del paquete), y después `scrollbars.css`. Lo propio de la app va debajo.
- **`claude-md-capa-dpb.md`**: la sección «Capa DPB» para el `CLAUDE.md` del proyecto (paso 0).

### 5 · Configura las costuras

Lo único que cambia de una app a otra está concentrado en pocos archivos. Edita **solo** estos; el
resto de la plantilla se queda como viene:

| Archivo | Qué cambias |
| --- | --- |
| `src/features/shell/shell.config.ts` | Solo `SHELL`: `nombreApp`, `claveSidebarColapsada` (con el prefijo de la app), `correoSoporte` (en DPB, el de IT) y, si la app tiene marca propia, `marca` |
| `src/features/shell/nav-items.ts` | Solo `NAV_ITEMS`: los módulos reales, agrupados y en el orden del proceso. «Inicio» viene de ejemplo: si la app no tiene una pantalla de inicio, quítalo y que `/` redirija al primer módulo (`<Navigate to="/…" replace />` en `main.tsx`). `roles` solo oculta entradas; la autorización es del backend |
| `src/features/shell/use-cuenta.ts` | `Rol` y `useCuenta`: conéctalo a la auth del proyecto (en DPB suele ser MSAL) y ajusta `Rol`. **Sin login todavía, déjalo como viene**: `cuenta: null`, y la sidebar no muestra el menú de cuenta ni las entradas que piden `roles`. Nunca pongas una cuenta de mentira: llega a producción. Tiene que seguir exportando `Rol` (aunque lo reexporte desde la auth): los archivos compartidos lo importan de aquí |
| `index.html` | `<title>` y descripción, con el mismo nombre que `SHELL.nombreApp` |

Una marca propia es un componente SVG inline que acepta `size`, `className` y `aria-hidden` (el tipo
`Marca` de `app-logo.tsx`); el lockup, la sidebar y el 404 la toman de `SHELL` sin pasar props. El
panel de la pantalla de acceso conserva el isotipo DPB a propósito: es la superficie corporativa.

### 6 · Compón las pantallas

Antes de armar una pantalla, lee en **`references/patrones.md`** la receta que corresponde
(listado, detalle, inicio con KPIs, acceso, pestañas) y las secciones de las piezas que vas a usar:
tablas, formularios en diálogo, estados, badges, botones, gráficas. Abre con un índice; en una
pantalla suelta lees unas pocas secciones, y en una app nueva, casi todas.

**Antes de usar un componente del catálogo, léelo en la versión instalada:**

```bash
node "<base-de-la-skill>/scripts/catalogo.mjs" "<raíz-del-proyecto>" indice select    # qué hay: ruta y exports, filtrado
node "<base-de-la-skill>/scripts/catalogo.mjs" "<raíz-del-proyecto>" ver Select        # el detalle de uno: import y tipos con su JSDoc
```

Sin texto, `indice` da el catálogo entero en ~135 líneas, con cuántos ejemplos trae cada componente;
con texto, solo lo que coincide. `ver` acepta la ruta (`base/select/select`) o el nombre exportado. Lee
de `node_modules` (la versión exacta del lockfile); si el proyecto aún no declara el paquete, baja
`@latest` a una carpeta temporal y avisa; si tampoco puede, se detiene y dice qué falta.

Desde la 0.3.0, el paquete trae `ai/components.json`, el catálogo para agentes que sale de Storybook, y
`ver` lo prefiere: da el import, cada prop en una línea (tipo, si es obligatoria, valor por defecto y
para qué sirve, incluidas las heredadas de React Aria) y los ejemplos de uso de las stories. Con
`ver <ruta> --dts`, o con un paquete anterior, muestra los tipos `.d.ts` y qué otros archivos aportan
tipos (`ver base/select/select-shared`). Las reglas:

- **Importa exactamente como dice `ver`** (`@desarrollospaloblanco/ui/components/<ruta>`). El paquete
  no tiene un import desde la raíz.
- **Usa solo props que existen en esa versión.** Con `ai/` salen todas. Con los `.d.ts` salen las
  propias, y las heredadas (`extends Aria…Props`: `value`, `onChange`, `onBlur`…) son las de la versión
  instalada de `react-aria-components`. El typecheck confirma unas y otras.
- **Copia la forma de los ejemplos,** no solo las props: muestran cómo se arma el componente (el `Select`
  con su `Select.Item`). Hoy los traen `Button`, `Input`, `Select`, `Badge` y `Toggle`.
- **La JSDoc es la de Untitled UI.** Si contradice a `references/trampas.md`, manda trampas.md.
- **Si falta un componente, propónlo al equipo del design system** (issue en
  `desarrollospaloblanco/dpb-ui`). No crees uno paralelo ni lo traigas del CLI. Si la pantalla no
  puede esperar, se compone a mano con tokens en `src/features/` y se propone al paquete.
- **No cargues los `.d.ts` enteros al contexto** sin necesidad: `indice` para elegir, `ver` solo de los
  que vas a usar.

Cuando algo del catálogo se comporte raro (un scroll que no aparece, un `size` ignorado, un ring
inexistente), mira **`references/trampas.md`** antes de depurar: probablemente ya mordió.

### 7 · Verifica

Ver la checklist de "Verificación" al final.

## Reglas DPB

Lo que esta skill suma a las reglas de `eecheverria-untitled-ui`:

1. **El botón primario es `bg-brand-solid`.** En la escala del paquete resuelve a `brand-600`, que es
   exactamente el #2C589A oficial (su hover es `brand-700` en claro y `brand-500` en oscuro). No lo
   "corrijas" con `bg-[#2C589A]` ni con
   un paso de rampa: el hex fijo se sale del sistema y no sigue al paquete si la marca se ajusta. El
   resto del azul llega por los tokens (anillo de foco, `fg-brand-*`, `chart-1`…).
2. **Los pasos crudos de rampa, solo en superficies de marca.** `bg-brand-600` y el texto blanco sobre
   él (`text-white`, `text-white/75`) aparecen solo en el panel azul de la pantalla de acceso y en
   piezas de marca; en la UI de trabajo mandan los tokens semánticos. Es la única excepción a la regla
   de solo tokens de `eecheverria-untitled-ui`: esa superficie es azul en claro y en oscuro, y no debe
   invertirse. El oficial es el **600**, no el 500: con `brand-500` el panel sale más claro y el blanco
   al 75 % baja de 4.5:1.
3. **El rojo DPB no es el rojo de error.** La rampa `accent` y sus tokens (`text-accent`,
   `bg-accent-solid`, `border-accent`…) son para acentos puntuales de marca, como la línea de contexto
   sobre un título. Los errores, las acciones destructivas y las alertas usan `error-*` y `warning-*`:
   mezclarlos hace que un acento se lea como un fallo.
4. **Lienzo y superficies.** Fondo `bg-canvas`; tarjetas `rounded-xl bg-primary ring-1
   ring-secondary`; bloques internos `bg-secondary`. Sombras: `shadow-md` en las tarjetas del shell,
   `shadow-xl` en diálogos, `shadow-lg` en toasts y ninguna en bloques internos.
5. **Todo en español.** Desde la 0.3.0 el catálogo trae sus textos en español; con la 0.2.0, o si algo
   quedó en inglés, apágalo por props o recompónlo (ver «Idioma» en `references/patrones.md`). Fechas,
   montos y mensajes, en español de Guatemala.
   React Aria formatea con el idioma del navegador, no con el `lang` del html: por eso `main.tsx`
   envuelve la app en `<I18nProvider locale="es-GT">`, y sin él `InputDate` sale en inglés.
6. **La marca.** Isotipo DPB por defecto; una app puede tener marca propia (como el Portal de
   Finanzas), y se configura en una costura, no editando el lockup. No deformes, rotes ni recolorees el
   isotipo; usa la variante por fondo: `color` sobre claro y también sobre el fondo oscuro de la app
   (lo pide el manual de marca), `white` sobre brand o accent, y `mono` con `currentColor`. Su contorno
   es fino: en la UI va a **32 px como mínimo**; por debajo, la casa se pierde y solo quedan los
   cuadros. El favicon es la excepción: ahí el tamaño lo pone el navegador.
7. **La fuente es Inter, la del paquete.** El tema la pide y no la carga: va en `index.html`
   (400/500/600/700). No la cambies desde la app. Open Sans es la de los documentos (`dpbranding`), no
   la de las apps.
8. **Formularios: la skill no decide el estado.** `TarjetaDialogo` recibe un `onSubmit` y funciona
   igual con `handleSubmit` de React Hook Form que con estado propio. La elección es de
   `eecheverria-frontend-react` y `eecheverria-untitled-ui`, o del `CLAUDE.md` del proyecto.
9. **Modo oscuro listo, sin selector.** Los tokens del paquete se invierten con `.dark-mode`, y su
   anillo de foco ya pasa 3:1 sobre el fondo oscuro. La app arranca en claro y no trae control para
   cambiarlo. Si una app lo quiere, usa `useTheme` del `ThemeProvider` de la plantilla (guarda claro,
   oscuro y «Sistema») y no escribas `dark:`.

## Las plantillas

Todas bajo `assets/plantilla/`, en la misma ruta que tendrán en el proyecto. Cada archivo propio abre
con un comentario de qué es y qué trampa esquiva; la anatomía y el cuándo usar cada una están en
`references/patrones.md`. Las piezas del catálogo las importan del paquete.

| Ruta | Qué es |
| --- | --- |
| `src/styles/scrollbars.css` | Barras de desplazamiento sutiles con tokens (el paquete no las estiliza) |
| `public/marca/dpb-isotipo.svg` | Isotipo para el favicon |
| `src/brand/dpb-isotipo.tsx` | `DpbIsotipo` — variantes `color`, `white`, `mono`; no se deforma desde props |
| `src/brand/app-logo.tsx` | `AppLogo` — lockup marca + nombre + «Desarrollos Palo Blanco», modo `colapsado` |
| `src/brand/iso-pattern.tsx` · `microsoft-logo.tsx` | Retícula del panel de acceso · ícono del botón de Microsoft 365 |
| `src/providers/router-provider.tsx` · `theme-provider.tsx` | `RouteProvider` (los `href` de React Aria navegan con react-router), el del starter de Untitled UI tal cual · `ThemeProvider` (clave `ui-theme`), el del starter con `localStorage` en `try/catch` y «Sistema» que sobrevive a una recarga |
| `src/layouts/app-layout.tsx` | `AppLayout` — `title`, `subtitle`, `action`, `filtros`, `volverA` y `aviso` (franja fija de contexto); el h1 de la página, que recibe el foco al navegar |
| `src/layouts/pantalla-acceso.tsx` | `PantallaAcceso` — `lineaSuperior`, `titulo`, `descripcion` y la acción como `children`; sin auth |
| `src/pages/no-encontrada.tsx` | `NoEncontradaPage` — 404 en español, no depende de la sesión |
| `src/features/shell/sidebar.tsx` | Sidebar de tres pisos, colapsable, con menú de cuenta |
| `src/features/shell/use-sidebar-collapsed.ts` | Estado colapsado, guardado solo cuando el usuario lo cambia; sin preferencia, colapsada por debajo de `lg` |
| `src/features/shell/configuracion.ts` · `navegacion.ts` · `cuenta.ts` | La forma de `SHELL` · el tipo `NavItem` y `visibleNavItems` · la forma de la cuenta. No son costuras: se actualizan con la plantilla |
| `src/features/shell/` (costuras) | `shell.config.ts`, `nav-items.ts`, `use-cuenta.ts` — ver paso 5 |
| `src/features/comunes/tarjeta-dialogo.tsx` | `TarjetaDialogo` — hijo directo de `Dialog`: cabecera y pie fijos, cuerpo con scroll, `onSubmit` a un `<form noValidate>` |
| `src/features/comunes/confirmar-dialog.tsx` | `ConfirmarDialog` — confirmación de lo irreversible, tono `primary-destructive` |
| `src/features/comunes/mensaje-error.tsx` | `MensajeError` (título, detalles, **remedio**, `onReintentar`) y `NotaInformativa` (`tono` neutro o `advertencia`, la del `aviso`) |
| `src/features/comunes/estado-vacio.tsx` | `EstadoVacio` — `relleno` o `punteado`; dos textos: «está vacío» vs. «nada coincide» |
| `src/features/comunes/esqueleto.tsx` | `Esqueleto` — la primera carga, con `role="status"` que expone su etiqueta y `motion-reduce` |
| `src/features/comunes/paginacion.tsx` | `Paginacion` — en español; props `page`, `totalPages`, `total` (mapea desde el contrato del backend). En los límites pasa el foco al otro botón; no uses `isDisabled` durante una recarga |
| `src/features/comunes/notificaciones.tsx` | `Notificaciones` (se monta una vez) y `notificar.exito/error` |
| `src/features/comunes/seccion.tsx` · `cifra-kpi.tsx` · `explicacion.tsx` | Bloque de detalle con `Datos`/`Dato` (la rejilla de datos) · KPI dentro de un `<dl>` · ayuda «?» que abre un popover (funciona con toque) |
| `src/features/comunes/tabla.ts` · `estado-fila.ts` · `toggle.ts` | Área de tabla con encabezado fijo y `FILA` (44 px reales) · filas inactivas · `Toggle` con hint a todo el ancho |
| `src/utils/formato.ts` | `formatearMonto` («Q 4,500.00») y su inverso `leerMonto`, `formatearCompacto` («1.9k», «1.4M»), `formatearFecha` («22/10/2026», sin pasar por `Date`) y `MESES` |

## Fuente de verdad y versiones

- **Cada cosa tiene un solo dueño.** El catálogo y el tema son del paquete (`desarrollospaloblanco/dpb-ui`,
  del equipo del design system, que publica a mano con changesets). La cara DPB —shell, piezas,
  recetas— es de esta skill. app-presupuestos es su origen, pero no se sincroniza sola. Una mejora va a
  su dueño (PR al paquete o a esta skill) y de ahí a las apps; si se queda en una sola app, la
  siguiente nace sin ella.
- **Probado con** `@desarrollospaloblanco/ui` 0.2.0, compilado de `dpb-ui` en `f531cd9` e instalado
  desde su `.tgz` (la máquina de prueba no tenía token del registry), sobre create-vite 9.3.1: React
  19.3.1, `react-aria-components` 1.22.1, Tailwind 4.3.3, Vite 8.3.5, TypeScript 6.0.3 (estricto por
  defecto), `react-router` 8.5.0 y `sonner` 2.0.8. Typecheck, build y revisión en el navegador en claro,
  oscuro, a 320 y a 440 px, y `npm run lint` sin advertencias en la plantilla. `catalogo.mjs` con
  `ai/`, contra la 0.3.0 compilada de `main` de `dpb-ui` (`7616909`), que debería ser el código publicado
  (no se pudo comparar con el registry: la máquina de prueba no tenía token).
  **Sin probar todavía:** la instalación real desde `npm.pkg.github.com`, el
  respaldo de `catalogo.mjs` que baja `@latest` (sí su error sin token) y la receta de
  `references/migracion.md` sobre app-presupuestos.
- **El catálogo para agentes (`ai/components.json`) es un piloto.** Desde la 0.3.0 trae 26 componentes
  con su import por subruta y sus props, pero solo 5 con ejemplos (`Button`, `Input`, `Select`, `Badge`,
  `Toggle`): los demás llegan a medida que el paquete pase sus stories de demos a `args`. Sale del
  manifiesto de Storybook, que sigue en preview, y el paquete lo limpia en `scripts/manifests.mjs`. Si
  un componente no está en `ai/` (`Dropdown`, `Carousel`, `RadioGroup`), `ver` cae a los `.d.ts`.
- **Cuando cambie el paquete**, vuelve a probar las plantillas y revisa `references/trampas.md`: varias
  trampas dependen del código del catálogo y de su versión.
- **Actualizar las piezas de un proyecto que ya las tiene** es una decisión del usuario: corre el
  script con `--dry-run`, muestra el diff de cada conflicto y pregunta. Nunca pises en silencio. Las
  costuras no se reemplazan nunca; si la plantilla nueva les agregó un campo, el typecheck lo dice.

## Sugerencias para la siguiente versión

- **Las piezas DPB dentro del paquete.** Hoy el catálogo llega por npm y la cara DPB por copia. Si el
  shell, `TarjetaDialogo`, `Paginacion`, `Notificaciones` y `formato` vivieran en
  `@desarrollospaloblanco/ui`, las apps se actualizarían con `npm install` y esta skill dejaría de copiar
  plantillas (quedarían las costuras y las recetas). Es decisión del equipo del design system.
- **Más ejemplos en `ai/`.** Que el paquete pase más stories a `args` (empezando por `Table`, `Tabs`,
  `DatePicker` y `Checkbox`), y que `Dropdown` y `Carousel` entren al catálogo. Ver "Fuente de verdad y
  versiones".
- **Login con MSAL como pieza opcional.** Hoy la plantilla trae solo la pantalla (`PantallaAcceso`)
  y la costura (`use-cuenta.ts`, más el comentario de dónde montar la auth en `main.tsx`); el botón
  «Iniciar sesión con Microsoft» no hace nada. Todas las apps de DPB repiten lo mismo: el
  `MsalProvider` con `initialize()` y `handleRedirectPromise()` antes del render, el `use-cuenta`
  real, el cierre de sesión (local o federado: cada uno tiene su riesgo, ver `use-cuenta.ts`), la ruta
  protegida y el token solo en memoria. Se dejó fuera porque amplía la skill de "cómo se ve" a "cómo se
  entra"; si se agrega, que pase antes por `eecheverria-security`. **Mientras tanto**, si piden el
  login, conéctalo en el proyecto siguiendo los comentarios de esas costuras y revísalo con
  `eecheverria-security` (o el agente `pb-skills:revisor-seguridad`).

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Le pongo `bg-[#2C589A]` al botón para que sea el azul oficial" | `bg-brand-solid` ya es el #2C589A en el paquete. El hex fijo se sale del sistema y no lo sigue si la marca se ajusta. |
| "Redefino `--color-brand-600` en un `@theme` de la app para ajustar el azul" | Esa app se separa de las demás y el paquete deja de mandar. El token se corrige en el paquete. |
| "El componente no está en el paquete; lo traigo con `npx untitledui add`" | Es un componente paralelo que no recibe las actualizaciones del paquete. Se propone al equipo del design system. |
| "Copio un componente del paquete a la app para ajustarle un detalle" | Deja de actualizarse con el paquete. Solo con el sí del usuario, y el ajuste se propone al paquete. |
| "Todavía no hay token; mientras tanto escribo los componentes a mano" | Para y di qué falta. Sin el catálogo del paquete, lo escrito a mano nace distinto. |
| "Ya salió una versión nueva del paquete; la instalo de paso" | En `0.x` cada minor puede romper. Avisa; actualiza el usuario, con el changelog delante. |
| "Uso Open Sans, que es la fuente de la marca" | En las apps manda el paquete: Inter. Open Sans es para documentos (`dpbranding`). |
| "Es un modal sencillo, lo escribo desde cero" | El `Dialog` del catálogo desplaza todo su contenido, cabecera y botones incluidos. `TarjetaDialogo`, como hijo directo del `Dialog`, deja fijos la cabecera y el pie y solo desplaza el cuerpo. |
| "Uso la paginación del catálogo" | La de DPB es `Paginacion`: sin números de página, con el foco cuidado en los límites y compacta en el celular (y en la 0.2.0, la del catálogo sale en inglés). |
| "El error lo pinto con el rojo de la marca" | El rojo DPB es acento, no semántica. Errores con `error-*`. |
| "Engroso el contorno del isotipo para que se vea a 24 px" | Es la marca: no se deforma. Llévalo a 32 px o más. |
| "Uso el toast de Untitled UI" | Es PRO y no está en el paquete. `notificar.exito/error` con sonner hace lo mismo con el estilo DPB. |
| "En este proyecto ajusto la plantilla a mi gusto" | Esa app deja de verse como las demás. Si es una mejora, va a la skill. |
| "El script marcó conflictos; los sobrescribo y ya" | Pueden ser cambios del usuario. Diff y pregunta, uno por uno. |
| "Pongo una cuenta de ejemplo para que el shell se vea completo" | Llega a producción el día que nadie la conecta. Sin login, `cuenta: null`. |

## Red flags

- Componentes del catálogo en `src/components/`, o `theme.css` / `brand-dpb.css`, en una app DPB que
  no está a media migración.
- Un `@theme` de la app que redefine tokens del paquete (`brand-*`, `accent-*`, la fuente, los
  semánticos), o `!important` encima de sus clases.
- `@import "tailwindcss"` además del CSS del paquete.
- Hex de marca escritos a mano (`#2C589A`, `#CC1F37`) o clases `bg-[#…]` en vistas; `bg-brand-500`
  usado como el azul oficial.
- `accent-*` usado para errores o acciones; `error-*` usado como acento de marca.
- El token del registry en el `.npmrc` del proyecto, en un commit o en el chat; un `package-lock.json`
  que resuelve `@desarrollospaloblanco/ui` fuera de `npm.pkg.github.com`.
- El paquete actualizado sin leer el changelog, o sin typecheck y build después.
- Un shell distinto al `AppLayout` (sidebar del catálogo, header propio) sin una razón del usuario.
- Diálogos, vacíos, errores o paginación escritos a mano existiendo la pieza común.
- Texto visible en inglés que venía de un componente del catálogo.
- El isotipo estirado, recoloreado o por debajo de 32 px en el lockup.
- Plantillas copiadas pisando archivos existentes sin mostrar el diff.
- Una mejora a una pieza DPB o al catálogo que se quedó solo en un proyecto.

## Verificación

Antes de decir "listo" en una app con la capa DPB:

- [ ] Contra el commit base, `git diff` no agrega componentes del catálogo a `src/components/`, ni
      `theme.css` o `brand-dpb.css`, y ningún `@theme` de la app redefine tokens del paquete.
- [ ] `src/styles/globals.css` importa `@desarrollospaloblanco/ui/styles.css` y no `tailwindcss` además.
- [ ] `catalogo.mjs version` sin avisos: el `.npmrc` del proyecto con solo la línea del scope y el
      lockfile resolviendo el paquete desde `npm.pkg.github.com`. Una sola copia de
      `react-aria-components` (`npm ls react-aria-components`).
- [ ] Inter carga, también el 500 (pestaña Network o fuente computada), y el favicon es el isotipo.
- [ ] Las costuras están configuradas: nombre de la app, navegación real, y la cuenta conectada a la
      auth o en `null` si aún no hay login. Nunca una de ejemplo.
- [ ] Cero hex de marca en el código de las vistas (clases `bg-[#…]`, estilos, props) y cero `dark:`.
      Quedan fuera `src/brand/`, `public/marca/` e `index.html`, que llevan el isotipo y el
      `theme-color` a propósito, y los comentarios que nombran el color.
- [ ] Toda pantalla con sesión usa `AppLayout` (el acceso y el 404 tienen los suyos) y las piezas
      comunes donde aplican.
- [ ] Todo el texto visible está en español, incluido el 404.
- [ ] La vista se revisó en el navegador (`npm run dev`) **en claro y en oscuro** (clase `dark-mode`),
      a 320 y a 440 px de ancho, y **solo con teclado** (al navegar, el foco cae en el `h1`). Si la
      ventana no cambia de tamaño, revisa el ancho con un `<iframe>` de 320 y 440 px sobre la misma URL.
      Al terminar, el servidor quedó apagado: en Windows, detener la tarea de fondo puede dejar vivo el
      proceso de Node en el puerto; comprueba el puerto y mátalo por PID.
- [ ] Typecheck y build pasan (`npm run build`); resultado real reportado.
- [ ] `npm run lint` (el oxlint que trae Vite) sin advertencias en las piezas de la plantilla: las que
      queden son del código de la app.
- [ ] Conflictos del script resueltos con el usuario, ninguno pisado en silencio.

## Cómo encaja con las demás skills

| Tema | Manda |
| --- | --- |
| Qué componentes hay, sus props, el tema y los tokens | El paquete `@desarrollospaloblanco/ui`: su versión instalada (`catalogo.mjs`) y su manual (`docs/manual-de-uso.md` en `dpb-ui`) |
| Cómo se ve DPB: marca, shell, piezas comunes, recetas de pantalla | **esta skill** |
| Cómo se usan los componentes: imports `Aria*`, `cx`/`sortCx`, compuestos, tokens semánticos, React Hook Form | `eecheverria-untitled-ui` (su CLI y su catálogo no aplican en DPB) |
| Arquitectura de componentes, estado, formularios, data fetching | `eecheverria-frontend-react` |
| Qué va en pantalla, cuántas opciones, jerarquía, esperas | `eecheverria-ux-laws` |
| Colores de series y paleta de gráficas | `dataviz`, si está (no viene en el plugin). Si no, al agregar una serie: al menos 3:1 contra el fondo, en claro y en oscuro, y series que no se distingan solo por color |
| Marca DPB en documentos, presentaciones y correos | `dpbranding`, `dpb-presentaciones` (skills de la organización, fuera del plugin) |

- **`eecheverria-senior-dev`**: capa base. El `CLAUDE.md` del proyecto manda; confirma antes de
  crear el proyecto o de cualquier copia que cree estructura; nunca manipules el token del usuario.
- **`eecheverria-git-workflow`**: commitea aparte el arranque (commit base), la capa DPB copiada
  (código de plantilla) y las pantallas: mezclarlos hace el diff irrevisable.
- **`dpbranding`**: usa los mismos colores (#2C589A y #CC1F37, los de su `SKILL.md`). Su
  `references/color-specifications.md` trae otra paleta (#2EA3F2, #C0392B) que no coincide: si
  dudas, mandan los del paquete. La fuente difiere a propósito: Open Sans en documentos, Inter en las
  apps. Para la UI de una app manda esta skill aunque `dpbranding` sugiera fondo blanco y sidebar azul:
  eso es para artefactos y documentos; la app usa el lienzo `bg-canvas` y la sidebar clara (el fondo
  azul sólido en la navegación se probó y se descartó).

## Referencias

- **`references/patrones.md`**: cómo se arma una pantalla DPB: anatomía del shell, recetas de página,
  cuándo usar cada pieza común, tablas, formularios en diálogo, estados, badges, botones, gráficas,
  marca, responsive y accesibilidad. Léelo en el paso 6.
- **`references/trampas.md`**: lo que ya mordió, con síntoma, causa, arreglo y versión en que se
  observó. Léelo cuando el catálogo se porte raro.
- **`references/migracion.md`**: cómo pasar una app con el catálogo copiado (el modelo anterior) al
  paquete. Solo con el sí del usuario.
- **`scripts/catalogo.mjs`**: el catálogo de la versión instalada del paquete y su versión (pasos 1 y 6).
- **`scripts/copiar-plantilla.mjs`**: copia la plantilla sin pisar nada (paso 3).
- **`assets/plantilla/`** y **`assets/fragmentos/`**: el código (pasos 3 y 4).
