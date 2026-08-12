---
name: eecheverria-untitled-ui
description: Construye UI con Untitled UI React — el design system de untitledui.com (React 19 + Tailwind v4 + React Aria) del que COPIAS el código a tu proyecto en vez de importar una librería. Tesis — el catálogo ya tiene el componente: búscalo antes de escribirlo, y estílalo SOLO con tokens semánticos (bg-brand-solid, text-primary, fg-error-primary), nunca con clases genéricas de Tailwind. Cubre el CLI (init/add/search/example), el catálogo completo con slug y URL de cada componente, las reglas de uso (imports Aria*, cx/sortCx, componentes compuestos, iconos @untitledui/icons, dark mode con .dark-mode), la integración con React Hook Form y la frontera free (MIT) vs PRO. Actívate SIEMPRE que el proyecto use Untitled UI o el usuario diga frases como "usa Untitled UI", "agrega un componente de untitledui", "npx untitledui", "necesito una tabla con filtros y paginación", "un modal de confirmación", "un formulario con selects", "esto no respeta los tokens", "ponle el color de marca", "inicializa el proyecto con untitledui" o "descarga el AGENT.md". Complementa a eecheverria-frontend-react (que conserva arquitectura de componentes, estado, formularios y responsive) y a eecheverria-source-driven (verificación por versión). Si el proyecto tiene un components.json de Untitled UI o una carpeta components/base, actívala.
---

# eecheverria-untitled-ui

## Resumen

**Untitled UI no es una librería que importas: es código que copias y pasa a ser tuyo.** No hay
`node_modules/@untitledui/react`, no hay vendor lock-in — el CLI escribe los archivos dentro de tu
repo y desde ese momento los mantienes tú. Eso desplaza el modo de fallo: el error caro no es "usar
mal una API", es **reescribir a mano un componente que el catálogo ya resolvió** y **estilarlo fuera
del sistema de tokens**.

El porqué de las dos reglas duras de esta skill:

- **Busca antes de escribir.** Un `<table>` hecho a mano parece más rápido que buscar en el catálogo,
  pero llega sin ordenamiento, sin selección, sin estados de foco, sin accesibilidad de React Aria y
  sin los tokens. Lo que ahorraste en cinco minutos lo pagas cada vez que el sistema cambie.
- **Solo tokens semánticos.** `bg-blue-600` funciona hoy y queda roto en dark mode, ignora el color
  de marca del proyecto y no se mueve cuando el sistema se re-tematiza. `bg-brand-solid` hace las
  tres cosas gratis, porque detrás hay variables CSS.

Esta skill **no duplica** la documentación oficial: Untitled UI publica su propio `AGENT.md` para
agentes. Lo que aporta aquí es el criterio — qué componente elegir, cómo orquestar el CLI, dónde
está la frontera free/PRO, y cómo convive todo esto con el resto de tus skills.

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo
`eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes
de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- El proyecto ya usa Untitled UI (hay `components.json`, `components/base/`, `styles/theme.css` o
  `@untitledui/icons` en el `package.json`).
- Vas a construir cualquier pieza de UI en ese proyecto: una vista, un formulario, una tabla, un
  modal, un panel de settings.
- Vas a inicializar un proyecto nuevo y el usuario quiere Untitled UI como design system.
- Revisas código y ves clases de color genéricas, componentes reinventados o imports mal hechos.
- Necesitas saber si algo existe en el catálogo, cómo se llama, o si es free o PRO.

**Cuándo NO usarla:**

- **Proyecto React sin Untitled UI** — no lo impongas. Adoptar un design system es una decisión del
  usuario, no un detalle de implementación. Ahí manda `eecheverria-frontend-react`; menciónale que
  Untitled UI existe si viene al caso y sigue con lo que el proyecto ya hace.
- **UI que no es del catálogo** (una visualización a medida, un canvas, un widget muy específico) —
  usa los tokens de esta skill para el estilo, pero la arquitectura y la accesibilidad son de
  `eecheverria-frontend-react`.
- **Backend, contratos de API, datos** — nada que ver; ver `eecheverria-backend-hono-drizzle` y
  `eecheverria-api-design`.

## Paso 0 — Detecta el terreno antes de asumir

Antes de proponer nada, mira qué hay. Tres escenarios, tres comportamientos distintos:

| Señal en el proyecto | Escenario | Qué haces |
| --- | --- | --- |
| `components.json` + `components/base/` + `styles/theme.css` | Ya usa Untitled UI | Sigue el proceso completo de abajo |
| Proyecto React/Next/Vite sin esas señales | No lo usa | **Pregunta** antes de introducirlo; no lo instales de oficio |
| Directorio vacío o proyecto nuevo pedido por el usuario | Arranque limpio | Ve a "Setup de un proyecto nuevo" |

Y en cualquier caso, respeta la jerarquía del repo: **el `CLAUDE.md` del proyecto manda sobre esta
skill**. Si el proyecto ya resolvió algo de otra forma de manera consistente, sigue al proyecto y
coméntalo (regla de `eecheverria-senior-dev`).

## Proceso

```
1. DETECTA  → versión de la librería y del stack (¿v7 o v8? ¿React 19? ¿Tailwind 4?)
2. BUSCA    → el catálogo antes que el teclado: CLI search → references/catalog.md → docs
3. TRAE     → npx untitledui add <componente>  (no lo copies a mano de la web)
4. COMPÓN   → ensambla con tokens semánticos y props de React Aria; no reescribas el componente
5. VERIFICA → tokens, dark mode, teclado, tipos, build
```

### Paso 1 · Detecta versión y stack

Untitled UI v8 exige un piso de versiones. Si el proyecto no lo cumple, **para y dilo** — instalar
componentes de v8 sobre React 18 o Tailwind 3 produce fallos raros y difíciles de leer.

| Pieza | Mínimo para v8 |
| --- | --- |
| React | 19.2 |
| Tailwind CSS | 4.3 |
| TypeScript | 5.9 |
| `react-aria-components` | 1.20 |

La versión de la librería sale de `components.json` (el CLI la autodetecta). Si trabajas un proyecto
en v7, pásalo explícito: `--lib-version 7`. Mezclar v7 y v8 en el mismo repo rompe los tokens.

Para cualquier patrón específico de versión —de React 19, de Tailwind 4 o de la propia librería— no
tires de memoria: apóyate en **`eecheverria-source-driven`** y trae la doc de esa versión
(`https://www.untitledui.com/react/docs/...`).

### Paso 2 · Busca antes de escribir

Este es el paso que la skill existe para imponer. **Nunca escribas desde cero un componente que el
catálogo ya tiene.** El orden de búsqueda, del más barato al más caro:

```bash
# 1. Búsqueda semántica del CLI — describe la intención, no el nombre
npx untitledui@latest search "tabla de usuarios con filtros y paginación"
npx untitledui@latest search "modal de confirmación destructiva" --type components
npx untitledui@latest search "flecha" --type icons --limit 10
```

2. **`references/catalog.md`** — el índice completo de esta skill: categoría → slug del CLI → URL de
   docs → para qué sirve → tier. Léelo cuando necesites mapear una intención a un componente o
   confirmar cómo se llama algo.

3. **La doc oficial** de ese componente (`https://www.untitledui.com/react/components/<slug>`) cuando
   necesites ver variantes y props reales.

Un pedido compuesto casi siempre se arma con **varias piezas del catálogo**, no con un componente
gigante. "Listado de usuarios con búsqueda, filtros y paginación" = `tables` + `filter-bars` +
`pagination` + `empty-states` + `avatar`. Descomponer así es la mitad del trabajo.

### Paso 3 · Trae el componente con el CLI

```bash
npx untitledui@latest add button                      # uno
npx untitledui@latest add table pagination filter-bar # varios de una
npx untitledui@latest add button -p src/components -y # ruta explícita, sin prompts
npx untitledui@latest add                             # sin argumentos: lista interactiva
```

Criterio:

- **El slug del CLI suele ser singular aunque la URL de docs sea plural** (`/components/buttons` →
  `add button`, `/components/filter-bars` → `add filter-bar`). Si un `add` no encuentra el slug,
  prueba el singular o usa la lista interactiva — no inventes nombres.
- **Usa `-y`** en sesiones agénticas: el CLI es interactivo y sin ese flag te quedas colgado en un
  prompt que el usuario no ve.
- **`--overwrite` nunca a ciegas.** El código es del usuario y puede tener modificaciones locales;
  sobrescribir las borra en silencio. Si necesitas actualizar un componente, **avísale primero y
  muestra qué cambia** (`git diff` después de correrlo en un árbol limpio). Esto es la disciplina de
  alcance de `eecheverria-senior-dev` aplicada al CLI.
- **Deja que el CLI resuelva los imports y las dependencias.** Copiar el código de la web a mano se
  salta la resolución de rutas (`@/components/...`) y las utilidades (`cx`, `is-react-component`).
- Si el CLI no está disponible (sin red, entorno restringido), dilo y ofrece la alternativa manual —
  no simules que lo corriste.

### Paso 4 · Compón, no reescribas

Ya tienes el componente en el repo. A partir de aquí, tu trabajo es **ensamblar**, y estas son las
reglas que más se violan. El detalle completo y los ejemplos por componente están en
**`references/usage-rules.md`** — léelo cuando vayas a escribir código real.

**1. Solo clases de color semánticas.** Nunca `bg-blue-600`, `text-gray-500`, `border-slate-200`.

| En vez de… | Usa… | Porque… |
| --- | --- | --- |
| `bg-blue-600` (acción principal) | `bg-brand-solid` | toma el color de marca del proyecto |
| `text-gray-900` | `text-primary` | se invierte solo en dark mode |
| `text-gray-500` | `text-tertiary` | jerarquía real, no un tono arbitrario |
| `border-gray-200` | `border-secondary` | el default del sistema |
| `text-red-600` (error) | `text-error-primary` | semántica, no color |
| `bg-white` | `bg-primary` | en dark mode deja de ser blanco |
| iconos `text-gray-400` | `fg-quaternary` | los no-texto tienen su propia escala (`fg-*`) |

La escala `fg-*` es para elementos **no textuales** (iconos, indicadores); `text-*` es para texto.
Confundirlas es el error más común. Tabla completa de los ~80 tokens en `references/usage-rules.md`.

**2. Dark mode se hereda, no se escribe.** No uses el prefijo `dark:` de Tailwind. El sistema define
`@custom-variant dark (&:where(.dark-mode, .dark-mode *))`: basta con la clase `dark-mode` en un
contenedor y **los tokens se invierten solos**. Si te sorprendes escribiendo `dark:`, es señal de que
usaste un color genérico dos pasos antes.

**3. React Aria se importa con prefijo `Aria*`.** Los componentes del catálogo envuelven primitivas
de React Aria y reexportan el mismo nombre; sin el alias, el import se vuelve ambiguo.

```typescript
// ✅
import { Button as AriaButton } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
// ❌ colisiona con el componente del design system
import { Button } from "react-aria-components";
```

**4. Props de React Aria, no de HTML.** `isDisabled` (no `disabled`), `isInvalid`, `isRequired`,
`isSelected`, `isLoading`, `onChange` recibiendo el valor. Escribir `disabled` no falla ruidosamente:
simplemente **no hace nada**, y eso se descubre tarde.

**5. Archivos en kebab-case.** `date-picker.tsx`, nunca `DatePicker.tsx`. Todo: `.tsx`, `.ts`, `.css`.

**6. Clases con `cx`, variantes con `sortCx`.** Usa `cx()` de `@/utils/cx` (envuelve `tailwind-merge`,
así la clase que pasas por props gana sobre la del componente) en vez de template strings o `clsx`.
Cuando definas variantes, agrúpalas con `sortCx({ common, sizes, colors })`.

**7. Componentes compuestos (dot notation).** `Select.Item`, `Select.ComboBox`, `Table.Row`,
`Tabs.Panel`, `Modal.Dialog`. No inventes wrappers propios alrededor de ellos.

**8. Iconos de `@untitledui/icons`, pasados como referencia.**

```typescript
import { Check, Trash02 } from "@untitledui/icons";

<Button iconLeading={Check}>Guardar</Button>                        // ✅ referencia
<Button iconLeading={<Check data-icon className="size-4" />}>…</Button> // ✅ JSX: marca con data-icon
<Button iconLeading={<Check className="size-4" />}>…</Button>        // ❌ pierde los estilos del slot
```

**9. Enlaces con `Button href`, no `<a>`.** `<Button href="/x" color="link-color">` da el estilo, el
foco y el estado correctos; un `<a>` suelto queda fuera del sistema.

**10. Estado deshabilitado con `opacity-50`**, que es lo que el sistema usa — no inventes un gris.

### Paso 5 · Verifica

Ver la checklist de "Verificación" al final. Lo mínimo antes de decir "listo": build/typecheck del
proyecto, la vista revisada **en dark mode**, y el flujo recorrido **solo con teclado**.

## Formularios: Untitled UI + React Hook Form + Zod

Aquí chocan dos cosas que ambas son correctas: tu skill de React manda React Hook Form + Zod, y los
inputs de Untitled UI son **componentes controlados de React Aria** — no exponen un `ref` compatible
con `register()`. La reconciliación es `Controller`:

```tsx
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";

const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
});

<Controller
    name="email"
    control={control}
    render={({ field, fieldState }) => (
        <Input
            {...field}
            label="Correo"
            isRequired
            isInvalid={fieldState.invalid}
            hint={fieldState.error?.message}
        />
    )}
/>
```

Puntos que se olvidan:

- El error de Zod va en **`hint` + `isInvalid`**, no en un `<span>` rojo aparte — así el componente
  lo asocia al input para lectores de pantalla.
- El botón de submit usa `isLoading={isSubmitting}` (con `showTextWhileLoading` si el texto importa),
  no un spinner a mano.
- `Select` y `DatePicker` van igual, con `Controller`: `field.onChange` recibe el valor, no el evento.

## Free (MIT) vs PRO

**Trabajamos solo con lo free.** Los componentes open-source son MIT y sirven para proyectos
comerciales sin límite. Lo PRO son componentes avanzados y las 250+ páginas de ejemplo (dashboards,
settings, informational, páginas de marketing completas).

Reglas:

- **No propongas PRO como si fuera gratis.** Si algo solo existe en PRO, dilo claro y **arma la
  alternativa con componentes free** — casi siempre se puede: un "dashboard de ejemplo" PRO se
  reconstruye con `metrics` + `charts` + `table` + `sidebar-navigations`.
- **La comprobación fiable es en runtime, no en el catálogo:** si `npx untitledui@latest add <x>` te
  pide `login`, ese componente es PRO. El catálogo de esta skill marca el tier de forma *indicativa*.
- **No leas el botón "Get PRO" de la web como veredicto.** Aparece también en páginas de componentes
  que sí están en el repo open-source: es un upsell del set completo de variantes, no prueba de que
  el componente base sea de pago.
- **Nunca corras `login`, ni autentiques, ni compres nada sin autorización explícita del usuario en
  ese momento.** No heredes permisos de turnos anteriores.

## Setup de un proyecto nuevo

Solo cuando el usuario lo pida. Es una acción que crea estructura, así que confirma antes de correrla.

```bash
# Proyecto nuevo (elige framework y color de marca)
npx untitledui@latest init --nextjs -c indigo -y
npx untitledui@latest init --vite -c indigo -y
npx untitledui@latest --colors-list          # ver colores de marca disponibles
```

Si en cambio hay que integrarlo en un proyecto existente:

```bash
npm install @untitledui/icons react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate
npx untitledui@latest tailwind   # trae los tokens del tema
```

Y en `globals.css`:

```css
@import "tailwindcss";
@import "./theme.css";
@plugin "tailwindcss-animate";
@plugin "tailwindcss-react-aria-components";
@custom-variant dark (&:where(.dark-mode, .dark-mode *));
```

**Deja el contexto oficial en el repo.** Untitled UI publica un `AGENT.md` con sus convenciones;
descargarlo como `CLAUDE.md` del proyecto hace que esas reglas vivan en el repo y apliquen aunque
esta skill no se cargue:

```bash
curl -o CLAUDE.md https://www.untitledui.com/react/AGENT.md
```

Si el proyecto **ya tiene** un `CLAUDE.md`, no lo pises: propón fusionar las secciones relevantes y
pregunta antes de editarlo (regla de `eecheverria-senior-dev`).

> Existe además un MCP server oficial (`https://www.untitledui.com/react/api/mcp`) con búsqueda y
> obtención de componentes. Está **fuera del alcance** de esta skill por decisión del usuario: el CLI
> cubre lo mismo sin depender de configuración por máquina. Menciónalo solo si el usuario pregunta.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Es una tabla simple, la escribo a mano" | Las tablas nunca se quedan simples. Cuando pidan ordenar, seleccionar y paginar, vas a reimplementar lo que `table` ya traía — sin su accesibilidad. |
| "`bg-blue-600` es el azul de la marca" | Hoy. Y queda roto en dark mode, y no se mueve si cambian el tema. `bg-brand-solid` sigue al sistema gratis. |
| "Le agrego `dark:` para que se vea bien de noche" | Si necesitas `dark:` es que usaste un color genérico. Los tokens ya se invierten solos. |
| "Copio el código desde la web, es más rápido" | Te saltas la resolución de imports, las utilidades y las dependencias. El `add` del CLI existe justo para eso. |
| "Corro `--overwrite` para actualizar todo" | Borra en silencio las modificaciones locales del usuario. El código es suyo: muestra el diff y pregunta. |
| "React Aria ya es accesible, no reviso nada" | React Aria te da roles y foco correctos, no un flujo usable. Recorre la vista con teclado igual. |
| "Envuelvo el `Input` en mi propio componente para que funcione con `register()`" | El wrapper esconde props del sistema y se desactualiza. `Controller` es la vía prevista, y es una línea. |
| "Ese dashboard de ejemplo lo agrego y ya" | Los ejemplos de páginas son PRO. Dilo y arma la alternativa free en vez de dejar al usuario contra un login. |
| "Le pongo `disabled` al botón" | No hace nada: la prop es `isDisabled`. Falla en silencio, que es peor que fallar. |

## Red flags

- Un componente nuevo escrito a mano cuyo nombre existe en `references/catalog.md`.
- Cualquier clase de color de la paleta cruda de Tailwind (`blue-`, `gray-`, `slate-`, `red-`) en una
  vista del proyecto.
- Prefijos `dark:` en componentes del design system.
- `import { Button } from "react-aria-components"` sin alias `Aria*`.
- Props HTML (`disabled`, `required`, `readonly`) sobre componentes de React Aria.
- Archivos en PascalCase dentro de `components/`.
- Clases concatenadas con template strings en vez de `cx()`.
- Iconos como JSX sin `data-icon`, o iconos de otra librería conviviendo con `@untitledui/icons`.
- `--overwrite` corrido sin mostrar el diff.
- Un `<a>` estilado a mano donde correspondía `<Button href … color="link-*">`.
- Componentes PRO propuestos sin advertir que requieren licencia.

## Verificación

Antes de decir "listo" en una UI con Untitled UI:

- [ ] Cada pieza salió del catálogo (o está justificado por qué no existía ahí).
- [ ] Los componentes se trajeron con `npx untitledui add`, no copiados a mano.
- [ ] Cero clases de color genéricas de Tailwind; todo con tokens semánticos.
- [ ] `text-*` para texto y `fg-*` para iconos/elementos no textuales, sin mezclarlos.
- [ ] La vista se revisó **en dark mode** (clase `dark-mode`) y ningún color quedó fijo.
- [ ] Imports de React Aria con prefijo `Aria*`; imports del design system por su ruta `@/components/…`.
- [ ] Props de React Aria (`isDisabled`, `isInvalid`, `isRequired`, `isLoading`), no las de HTML.
- [ ] Archivos nuevos en kebab-case.
- [ ] Clases compuestas con `cx()`; variantes agrupadas con `sortCx()`.
- [ ] Formularios con `Controller`; errores en `hint` + `isInvalid`, no en un texto suelto.
- [ ] El flujo completo se recorre **solo con teclado**, y el foco es visible en cada parada.
- [ ] Estados de carga, vacío y error resueltos con componentes del catálogo
      (`loading-indicator`, `empty-state`, `alerts`), no improvisados.
- [ ] Nada del cambio depende de un componente PRO sin que el usuario lo sepa.
- [ ] Typecheck y build del proyecto pasan; resultado real reportado.

## Cómo encaja con las demás skills

El reparto con `eecheverria-frontend-react` es el punto delicado — las dos hablan de UI en React.
La frontera:

| Tema | Manda |
| --- | --- |
| Color, tipografía, espaciado, radios, dark mode | **esta skill** (los tokens son el design system) |
| Roles ARIA, foco y teclado dentro de componentes del catálogo | **esta skill** (React Aria ya lo resuelve; se verifica igual) |
| Accesibilidad de UI propia, fuera del catálogo | `eecheverria-frontend-react` |
| Arquitectura de componentes, colocation, composición, props tipadas | `eecheverria-frontend-react` |
| Gestión de estado, React Hook Form + Zod, responsive, estados vacío/carga/error | `eecheverria-frontend-react` |
| Patrones específicos de React 19 / Tailwind 4 / v7 vs v8 | `eecheverria-source-driven` |

Y el resto del ecosistema:

- **`eecheverria-senior-dev`** — capa base: leer el `CLAUDE.md` del proyecto primero, disciplina de
  alcance (que aquí se traduce en no sobrescribir componentes del usuario) y pedir autorización antes
  de acciones que crean estructura o autentican.
- **`eecheverria-clean-code`** — cuando el ensamblado crezca: extraer, nombrar, quitar duplicación.
  Ojo con una excepción: **no "limpies" los componentes que trajo el CLI**; son código generado que se
  actualiza con el CLI. Refactoriza tu composición, no el catálogo.
- **`eecheverria-performance`** — tablas grandes, listas largas y gráficas son los sospechosos
  habituales; mide antes de optimizar.
- **`eecheverria-git-workflow`** — commitea aparte el `add` del CLI (código generado) y aparte tu
  composición: mezclarlos hace el diff irrevisable.
- **`eecheverria-security`** — nada de renderizar HTML sin sanear dentro de estos componentes; la
  validación sigue viviendo en las fronteras.

## Referencias

- **`references/catalog.md`** — catálogo completo: categoría → slug del CLI → URL de docs → para qué
  sirve → tier. Consúltalo en el Paso 2, cuando mapees una intención a componentes.
- **`references/usage-rules.md`** — los tokens semánticos completos y los patrones de uso por familia
  de componente, con su antipatrón al lado. Consúltalo en el Paso 4, antes de escribir código.
