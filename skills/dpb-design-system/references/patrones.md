# Patrones de pantalla DPB

Cómo se arma una pantalla de una app interna de DPB para que todas se vean y se comporten igual. El
origen es **app-presupuestos**: lo que se cita «del origen» es un ejemplo de su negocio, no algo que
abrir. Las rutas en `código` son las del proyecto después de copiar la plantilla.

Los componentes del catálogo vienen de `@desarrollospaloblanco/ui` y se importan desde
`@desarrollospaloblanco/ui/components/<ruta>`; qué hay y qué props acepta la versión instalada lo dice
`scripts/catalogo.mjs` (`indice`, `ver <ruta-o-nombre>`). Las reglas generales de uso de Untitled UI
—tabla de tokens semánticos, imports `Aria*`, props `is*` de React Aria, `cx`/`sortCx`, iconos con
`data-icon`, `Button href`, dark mode con `.dark-mode`, free vs. PRO— están en `eecheverria-untitled-ui`,
y aquí no se repiten; su CLI no se usa en una app DPB. Lo que ya mordió, con síntoma, causa y arreglo,
está en [`trampas.md`](trampas.md). Lee las secciones de las piezas que vas a usar; en una app nueva
serán casi todas.

## Contenido

1. [Reglas de la casa](#reglas-de-la-casa)
2. [Anatomía del shell](#anatomía-del-shell)
3. [Recetas de página](#recetas-de-página): listado, detalle, inicio, acceso, pestañas
4. [Piezas comunes](#piezas-comunes)
5. [Tablas](#tablas)
6. [Formularios en diálogo](#formularios-en-diálogo)
7. [Estados: carga, vacío, error y avisos](#estados-carga-vacío-error-y-avisos)
8. [Badges de estado](#badges-de-estado)
9. [Botones](#botones)
10. [Gráficas](#gráficas)
11. [Marca](#marca)
12. [Responsive](#responsive)
13. [Accesibilidad](#accesibilidad)
14. [Idioma](#idioma)

---

## Reglas de la casa

- **El paquete no se toca desde la app.** Ni se copian sus componentes a `src/` (tampoco con
  `npx untitledui add`) ni se redefinen sus tokens en un `@theme` (`brand-*`, `accent-*`, la fuente):
  esa app dejaría de verse como las demás. Lo que haya que corregir de un componente se corrige desde
  fuera: props, una `className` (gana por `cx`) o una constante en `features/comunes/`. Si el arreglo
  es del componente o del tema, va al paquete (issue o PR en `desarrollospaloblanco/dpb-ui`).
- **Todo control sale del catálogo.** `Select` y no `<select>`, `InputDate` y no
  `<input type="date">`. Los nativos pintan el chrome del navegador (el azul del sistema en el
  desplegable, el `dd/mm/aaaa`) y rompen la identidad. `NativeSelect` es justo el `<select>` del
  sistema: tampoco.
- **Tema claro por defecto** (`ThemeProvider defaultTheme="light"`), sin seguir al sistema: son apps
  que se usan junto a Excel e impresos. El oscuro queda disponible por los tokens.
- **Página delgada.** Componentes de presentación en `features/x/` y una página en `src/pages/` que
  solo compone. Cómo se piden y se guardan los datos lo decide `eecheverria-frontend-react`.
- **Ocultar no autoriza.** Un botón o una entrada del menú se ocultan por rol para no ofrecer algo
  que va a responder 403; la autorización la hace el backend. Por lo mismo, no ofrezcas una acción
  que siempre fallaría (un «Importar» de una integración que nadie configuró).
- **Ramifica por `error.code`, nunca por el texto.** El código es el contrato; el mensaje cambia.

---

## Anatomía del shell

Plantillas: `src/layouts/app-layout.tsx` y `src/features/shell/`. Las costuras, lo propio de cada app,
son `shell.config.ts`, `nav-items.ts` (solo `NAV_ITEMS`) y `use-cuenta.ts` (`Rol` y `useCuenta`). Los
tipos y la lógica (`navegacion.ts` con `NavItem` y `visibleNavItems`, `cuenta.ts` con `Cuenta` y
`UseCuenta`) no son costura: llegan con cada versión de la plantilla, como la sidebar.

```
bg-canvas  (h-dvh · p-3 · gap-3 · overflow-hidden)
├── Sidebar    tarjeta: bg-primary · rounded-xl · shadow-md · ring-1 ring-secondary
│   ├── piso 1  lockup                         fijo
│   ├── piso 2  navegación                     lo único que se desplaza
│   └── piso 3  cuenta + «Colapsar»            fijo, con border-t
└── Contenido  la misma tarjeta
    ├── aviso     franja de aviso (opcional)                       fija
    ├── <header>  volverA · h1 · subtítulo · action · filtros      fijo
    └── <main>    relative · flex-col · min-h-0 · flex-1 · overflow-y-auto · pt-px
```

**Lienzo y tarjetas.** Sobre `bg-canvas` (gris azulado, token DPB del tema del paquete) flotan dos tarjetas. No
uses `bg-secondary` como lienzo: en claro es casi blanco y el efecto se pierde.

**El scroll vive dentro de la tarjeta de contenido**, en `main`: la cabecera no se va con el scroll y
las tarjetas nunca se salen del viewport. `main` es columna flex, así que una pantalla pide todo el
alto con `flex-1`. Entre `main` y el área con scroll de una tabla, cada nivel flex lleva `min-h-0`.

**Sidebar de tres pisos.** Solo se desplaza la navegación: así el perfil no se va de la vista.

- **Ya viene en `sidebar.tsx`:** 72 px colapsada y, expandida, el ancho del contenido; el ítem activo
  con el ícono en `text-fg-brand-primary` sobre `bg-secondary` (el fondo azul sólido se descartó);
  `end` solo en `/`, para que un detalle (`/proveedores/7`) marque su módulo; tooltip por enlace al
  colapsar.
- **Grupos:** `NAV_ITEMS` sigue el orden del proceso, no el alfabeto, y no lista pantallas que todavía
  no existen: un enlace a una pantalla vacía es peor que no tenerlo. El `<nav>` se llama «Navegación
  principal»: otro `<nav>` en la pantalla lleva su propio `aria-label` (el de `Paginacion`, «Paginación»).
- **Cuenta:** el usuario (avatar, nombres y apellidos, y su rol o área) **es** el menú, con «Cerrar
  sesión» dentro y no suelto en la navegación, a un clic accidental. Sin sesión (`cuenta: null`, lo que
  trae `use-cuenta.ts`), el menú no aparece: una app sin login todavía es un caso válido.
- **Se remonta al cambiar de página:** cada ruta monta una página distinta y React desmonta todo,
  sidebar incluida. Lo que deba pasar una vez por sesión (la entrada del logo) va en estado de módulo,
  no en `useState`; los datos que arman el menú, en la caché de la capa de datos.

**Header de página** (props de `AppLayout`):

- `title` es el único `<h1>` de la pantalla. En móvil parte en dos renglones y desde `sm` se trunca en
  uno. Tras cada navegación (no en la primera carga) recibe el foco (`tabIndex={-1}`, sin anillo):
  como cada ruta remonta todo, el foco caía en `<body>`.
- `subtitle`, una línea de apoyo, se oculta bajo `sm`: en móvil, cada renglón de la cabecera fija es
  uno menos de contenido.
- `action` lleva los botones de la pantalla, arriba a la derecha.
- `filtros` es el contexto que se está viendo (periodo, área…) en un renglón propio dentro del header:
  no se va con el scroll ni empuja los botones fuera de la esquina. Los filtros de búsqueda de un
  listado no van aquí, sino en el cuerpo, encima de la tabla.
- `volverA` es `{ href, label }`: un enlace `link-gray` con `ArrowLeft`, encima del título.

**`volverA` en vez de breadcrumbs**, en el detalle de un listado («Volver a proveedores») y también en
sus estados de carga y error: un enlace mal escrito no debe dejar a nadie atrapado. Con dos niveles
(`/proveedores/:id/contratos/:id`), lleva al padre inmediato y lo nombra («Volver a Acme»). Desde
tres, evalúa breadcrumbs.

**Transición entre pantallas.** Header y `main` entran con un fundido de 200 ms y 4 px (`TRANSICION`
de `app-layout.tsx`, con `motion-reduce`); más de ~300 ms se lee como lentitud, y la tarjeta no se
anima. Por qué lleva una `key` con el `pathname`, en [Animación](trampas.md#animación-svg-y-remontajes).

**Franja de aviso.** Lo que cambia el contexto (modo de pruebas, mantenimiento) va en la prop `aviso` de
`AppLayout`, fijo sobre el header y sin animación: una `NotaInformativa tono="advertencia"`, con texto
corto en móvil. `aviso` es por página. Si vale para toda la app, el proyecto define su propio layout que
envuelve a `AppLayout` y le pasa ese `aviso`, y toda página usa ese envoltorio: así no se olvida en las
ramas de carga y de error. La 404 no lleva franja: no tiene shell. Si aparece a media sesión, el anuncio
pide una región viva que ya exista (ver [Accesibilidad](#accesibilidad)).

---

## Recetas de página

### Listado

Orden de bloques:

1. **`AppLayout`** con `title`, `subtitle` y `action`. La acción es un
   `flex flex-wrap items-center justify-end gap-3` con «Recargar» (`secondary`, `RefreshCw01`), las
   secundarias que apliquen (importar, exportar) y al final la primaria («Nueva cuenta», `Plus`).
   Todas con `isDisabled` mientras se guarda.
2. **Cuerpo:** `flex min-h-0 flex-1 flex-col gap-5`.
3. **`MensajeError` de página**, para escrituras sin diálogo propio y solo si no hay un diálogo
   abierto (ver [Estados](#estados-carga-vacío-error-y-avisos)).
4. **Filtros:** `flex flex-wrap items-end gap-3`. La búsqueda, con `Input` + `SearchLg`
   (`min-w-56 flex-1`) y un retardo de ~300 ms. Los `Select`, en `w-full sm:w-44` (todo el ancho en
   móvil), con `label` visible («Estado»), `placeholder` en español (el del catálogo es «Select») y una
   opción centinela corta, «Todos»: en `w-44`, «Todos los estados» se corta (ver
   [Selects](trampas.md#selects-campos-y-controles)). Desde react-aria-components 1.22, `value`/`onChange`:
   `selectedKey`/`onSelectionChange` quedaron deprecados. Un selector con una sola opción no se muestra.
5. **Contenido según el estado** (ver [Estados](#estados-carga-vacío-error-y-avisos)): `Esqueleto` con
   las `filas` y el `altoFila` de la tabla real en la primera carga; en cada recarga, la tabla anterior
   a la vista y `Paginacion` habilitada; el error centrado (`flex-1 items-center justify-center`) con
   `onReintentar`; `EstadoVacio` con dos textos; y con datos, `<div className={AREA_TABLA}>` con la
   tabla y, fuera del área, `Paginacion`.
6. **Diálogos al final**, como hermanos: alta y edición (uno solo para las dos), importaciones y
   `ConfirmarDialog` para eliminar.

La búsqueda va contra el servidor: con un listado paginado, filtrar en el cliente solo buscaría dentro
de la página visible.

Si el registro tiene detalle, la fila entera es el enlace (ver [Tablas](#tablas)). Si no lo tiene, la
fila no navega, porque prometería algo que no existe.

### Detalle

- **`AppLayout`:** `title` = nombre del registro, `subtitle` = su contexto, `volverA` al listado,
  `action` = las acciones de estado, con «Recargar» como secundaria.
- **Mientras carga:** un título genérico, `volverA` y un esqueleto compuesto (ver `Esqueleto` en
  [Piezas comunes](#piezas-comunes)) de tres bloques `h-40`. **Con error:** título genérico,
  `volverA`, `MensajeError` y un botón «Volver al listado».
- **Cuerpo** `flex flex-col gap-5`, en este orden:
  1. `MensajeError` de escritura, en un solo sitio para toda la página: cuatro `role="alert"` a la
     vez se pisan al anunciarse y ninguno se entiende.
  2. Si el registro no admite cambios, una `NotaInformativa` con su badge y cómo retomarlo.
  3. Bloques `Seccion` apilados, cada uno con su `accion` arriba a la derecha.
- **Secciones y no pestañas**, a propósito: la configuración completa se ve de un vistazo y no queda
  escondido tras una pestaña el dato que bloquea el siguiente paso.
- **Dos caras por sección.** En solo lectura, `<Datos>` con un `<Dato etiqueta>` por campo
  (`seccion.tsx`: el `<dl>` en rejilla de 1, 2 y 3 columnas), con fechas en `formatearFecha` y montos
  en `formatearMonto`; no escribas la rejilla a mano. Editable, los campos en las mismas columnas y
  «Guardar cambios» como `accion`, deshabilitado sin cambios. Un campo que no se puede guardar no se
  muestra: se explica en la `descripcion` de la sección.
- **Listas dentro de una sección:** en una tarjeta `overflow-hidden rounded-lg bg-primary ring-1
  ring-secondary` (blanca sobre el gris de la sección). Vacía, una línea de texto con `role="status"`:
  la sección ya tiene título y más contenido, y un `EstadoVacio` pesaría más que la lista. Con error,
  `MensajeError` dentro de la misma sección.
- **Estado local que nace de props:** dale a la sección una `key` hecha con los valores del servidor.
  Así se reinicia cuando el servidor responde algo distinto y no mientras se escribe.

### Inicio con KPIs y gráficas

- **`AppLayout`:** título personal («Hola, <nombre>») solo con sesión; sin login, el nombre de la
  pantalla. Subtítulo con el propósito, el selector de contexto (el periodo) en `filtros` y «Recargar»
  en `action` (solo ícono bajo `sm`). La franja de contexto, el periodo y la próxima fecha que importa,
  es una línea `text-sm text-tertiary` en `filtros`, junto al selector, o como `subtitle`.
- **Una sola petición** trae el inicio y la página pinta los bloques que lleguen: no decide quién ve qué.
- **Cuerpo** `flex flex-col gap-4`:
  1. Fila de `CifraKpi` en un `<dl className="grid grid-cols-1 gap-4 …">` con tantas columnas como
     cifras: tres, `md:grid-cols-3`; cuatro, `sm:grid-cols-2 xl:grid-cols-4`.
  2. Tarjetas en rejilla `grid-cols-1 lg:grid-cols-2`, o `lg:grid-cols-3` con la gráfica en
     `lg:col-span-2`.
- **Tarjetas: `<Seccion className="bg-primary p-5">`**, no en su gris: con muchas apiladas, el gris
  las vuelve una mancha. Su acción típica es
  `Button color="link-color" size="sm" iconTrailing={ArrowRight}` hacia la pantalla completa.
- **Tarjeta sin datos:** `EstadoVacio variante="punteado"` en lugar del cuerpo, que dice por qué: aquí
  la tarjeta entera es ese dato. Si falta el contexto entero (no hay periodo abierto), un solo vacío en
  lugar de todos los bloques.
- **Esqueleto compuesto** con la forma real: las cifras y las tarjetas.
- **Cuida los huecos:** las tarjetas de una fila se estiran a la más alta, y una lista larga deja espacio
  muerto al lado. Si el dato cabe en una tarjeta existente, no agregues otra.

### Acceso

Plantilla: `src/layouts/pantalla-acceso.tsx`.

- **Ya viene en `PantallaAcceso`:** las dos columnas (el acceso con el lockup, y el panel de marca
  `bg-brand-600`, que se oculta bajo `lg` porque es apoyo), su `<main>` y los enlaces de soporte
  (`SHELL.correoSoporte`). No los agregues.
- **Bloque de acceso:** un antetítulo corto (`lineaSuperior`, en `text-accent`, uno de los pocos usos
  legítimos del acento), el `<h1>` «Inicia sesión», una línea sobre qué cuenta usar, el error si lo
  hay y un solo botón `size="lg" color="secondary" className="w-full"` con `MicrosoftLogo` como
  `iconLeading`.
- **Un solo método y ningún campo de correo o contraseña:** quien autentica es Microsoft 365, y un campo
  que no sirve para nada confunde.
- **El error** dice qué pasó y qué hacer según su código (no registrado, inactivo, conflicto de cuenta,
  Microsoft caído, servidor inalcanzable), con la anatomía de `MensajeError`.
- **Mientras se restaura la sesión**, a pantalla completa y no el formulario (si no, quien ya tiene sesión
  ve el login un instante): `LoadingIndicator type="dot-circle" label="Restaurando sesión…"` dentro de
  un `<div role="status" className="motion-reduce:[&_svg]:animate-none">`. El indicador no tiene `role`,
  no acepta `className` y su giro no mira `motion-reduce`.
- El logo de Microsoft lleva sus colores oficiales, fuera de los tokens: es la marca de un tercero y
  no cambia con el tema.

### Pestañas con la vista en la URL

- **La pestaña vive en `?vista=`** y no en estado local: recargar o compartir el enlace deja a la
  persona donde estaba. La vista por defecto no lleva parámetro.
- **Léela con lista cerrada:** `parametros.get("vista") === "roles" ? "roles" : "usuarios"`. Un valor
  desconocido cae en la vista por defecto.
- **Al cambiar, conserva los demás parámetros** (`new URLSearchParams(parametros)` y `set`/`delete` de
  `vista`) con `{ replace: true }`, para no llenar el historial.
- **Markup:** `Tabs selectedKey onSelectionChange className="min-h-0 flex-1 gap-5"` ›
  `Tabs.List type="underline" aria-label` › `Tabs.Item id label`; y cada `Tabs.Panel id` con
  `flex min-h-0 flex-1 flex-col`, para que la tabla de dentro conserve su scroll.
- **Datos perezosos:** una pestaña solo pide sus datos con ella abierta.
- **Las acciones del header son de la pestaña:** en una de solo lectura, «Recargar» y «Agregar» no se
  muestran.
- **Si renombras una vista, deja el valor viejo como alias:** hay enlaces y correos ya enviados con él.
- Una sub-vista dentro de una pestaña lleva su propio parámetro (`?vista=solicitudes&tipo=pendientes`).

---

## Piezas comunes

Cuándo sí y cuándo no. El código está en la plantilla; no lo repitas a mano.

- **`AppLayout`** (`src/layouts/app-layout.tsx`). Toda pantalla autenticada. Ver
  [Anatomía del shell](#anatomía-del-shell).
- **`TarjetaDialogo`** (`src/features/comunes/tarjeta-dialogo.tsx`). El contenido de todo diálogo, como
  **hijo directo de `Dialog`**: cabecera y pie fijos, scroll solo en el cuerpo. El `Dialog` del
  catálogo (`max-h-[inherit] overflow-y-auto`) desplazaría todo, cabecera y pie incluidos, y
  `TarjetaDialogo` hereda su tope (ver [Diálogos](trampas.md#diálogos)). Con
  `onSubmit` es un `<form noValidate>`: Enter envía y ella misma llama a `preventDefault()`. El ancho va
  en el `Modal` de cada diálogo (`max-w-md` las confirmaciones, `max-w-lg` los formularios). No metas
  otra área con `overflow-y-auto` alrededor.
- **`ConfirmarDialog`** (`confirmar-dialog.tsx`). Para lo irreversible y para lo que tiene efectos que
  no se deshacen (un correo enviado a todos). `tono="primary-destructive"` si destruye; `primary` si
  solo es definitivo. El texto va en el cuerpo, nunca en la cabecera, y anticipa lo que el backend
  rechazaría («si tiene pagos asociados, no dejará eliminarla»). Sin ×: se sale con Cancelar, Escape o
  clic fuera, y mientras `trabajando` ninguno de los tres la cierra. Lo reversible no se confirma.
- **`MensajeError`** (`mensaje-error.tsx`). Error en línea: `titulo` (qué pasó, el mensaje del
  backend), `detalles` por campo y `remedio`, obligatorio, porque un error correcto sin qué hacer deja
  a la persona sin salida. El remedio sale de una tabla por motivo de cada app, no del texto. Con
  `onReintentar` trae el «Reintentar» (`secondary`). Arriba del cuerpo de un diálogo, en la página o
  dentro de una sección; no para avisos que se van solos.
- **`NotaInformativa`** (en `mensaje-error.tsx`). La anatomía de `MensajeError` para explicar sin
  alarmar: cómo funciona el acceso, por qué un registro ya no se edita. Sin `role`: es contenido
  estático. No compite con un error cuando los dos están en pantalla. `tono="advertencia"`
  (`bg-warning-primary ring-warning_subtle` y `AlertTriangle`) es para la franja de `aviso`.
- **`EstadoVacio`** (`estado-vacio.tsx`). `titulo` (un `<p>`, para no saltar niveles de encabezado),
  `descripcion` y `accion` opcional, con `role="status"`. `variante="relleno"` para un listado sin filas
  (con dos textos según haya filtros o no); `"punteado"` para una tarjeta del inicio sin datos. Una
  lista vacía dentro de una `Seccion` con más contenido no lo usa: basta una línea de texto. No uses
  `application/empty-state` del catálogo: no sigue los tokens.
- **`Esqueleto`** (`esqueleto.tsx`). Toda primera carga con forma conocida pasa por él:
  `role="status"` con la `etiqueta` como texto `sr-only` dentro (sin `aria-busy`), `filas` y `altoFila`
  (por defecto `h-11`, el de `FILA`). Para otras formas (un detalle, el inicio), compón: un contenedor
  `relative` con `role="status"` y un texto `sr-only` («Cargando el inicio»), y dentro bloques de
  `BLOQUE_ESQUELETO` en `aria-hidden`.
- **`Paginacion`** (`paginacion.tsx`). «Anterior · Página N de M · T registros · Siguiente», con
  `aria-live`. Props `page`, `totalPages`, `total`, `onCambiarPagina` e `isDisabled`, mapeadas desde el
  contrato de `eecheverria-api-design`: `total={pagination.totalItems}`. **Sin `isDisabled` en una
  recarga**: deshabilitar el botón con foco lo manda a `<body>`; ignora el clic si ya hay una carga en
  curso. En la primera o la última página, el foco pasa solo al botón contrario. Sin números de página:
  en un listado que se filtra, nadie salta a la página once. Con una sola página, solo el total.
- **`notificar`** (`notificaciones.tsx`). `notificar.exito(titulo, descripcion?)` después de que el
  backend confirmó; `<Notificaciones />` se monta una vez en la raíz. Sobre `sonner` (el toast del
  catálogo es PRO), con los tokens.
- **`Seccion`** (`seccion.tsx`). Un bloque del detalle: `<section aria-labelledby>` con `<h2>` real,
  `rounded-xl bg-secondary p-6 ring-1 ring-secondary` y `accion` arriba a la derecha. Es lo que deja al
  lector de pantalla saltar entre bloques. No la anides. Sobre `bg-primary`, es la tarjeta del inicio.
  El mismo archivo trae `Datos` y `Dato` (`etiqueta`, `children`), la rejilla de solo lectura del detalle.
- **`CifraKpi`** (`cifra-kpi.tsx`). Una cifra destacada dentro de un `<dl>`: el `div` de la tarjeta es el
  grupo del `dl`, con `dt` y `dd` como únicos hijos (el ícono va dentro del `dt`). Manda el número. Si
  va compacto (`formatearCompacto`), el exacto (`formatearMonto`) va en `exacto`: sale en el `title` y
  como texto `sr-only`. El `title` no se alcanza con toque ni con teclado: si el exacto importa en
  móvil, no compactes bajo `sm` o ponlo en `detalle`. `tono="alerta"` pinta en rojo, y entonces el
  detalle dice por qué con palabras.
- **`Explicacion`** (`explicacion.tsx`, props `titulo` y `texto`). Un «?» de `size-6` que al pulsarlo
  abre la explicación en un popover (con toque, ratón o teclado), para franjas compactas donde el texto
  no cabe. Es para la explicación, no para el dato.
- **`tabla.ts`**. `AREA_TABLA` + `ENCABEZADO_FIJO`, siempre juntos, para el `Table` del catálogo;
  `AREA_TABLA_PROPIA` para una `<table>` propia, y `FILA` para el alto de las filas. Ver [Tablas](#tablas).
- **`estado-fila.ts`**. `claseFila(base, activo)`, `TACHADO_INACTIVO` y `SIN_TACHAR`, para las filas
  inactivas.
- **`toggle.ts`**. `TOGGLE_ANCHO_COMPLETO`, en todo `Toggle` que lleve `hint`.
- **`formato.ts`** (`src/utils/`). `formatearMonto(n)` → «Q 4,500.00», «-Q 250.50» (es-GT, GTQ, dos
  decimales; el espacio lo pone `Intl`, no lo quites), su inverso `leerMonto(texto)` → `4500` o `null`,
  y `formatearCompacto(n)` → «1.9k», «184.5k»,
  «1.4M», «-1.9k», sin «Q». Es propio (`Intl` compacto en es-GT da «1.7 K» y «184.5 k») y redondea
  antes de elegir la escala: 999 950 → «1M», 999.6 → «1k», -0.4 → «0». Donde va el compacto, el exacto
  sigue alcanzable. `formatearFecha("AAAA-MM-DD")` → «dd/mm/aaaa», sin pasar por `Date`, y `MESES`
  («Ene» … «Dic») para ejes y encabezados.

---

## Tablas

- **Área con encabezado fijo.** Envuelve el `Table` del catálogo en `<div className={AREA_TABLA}>` y
  pasa `ENCABEZADO_FIJO` al `Table.Header`. El área es la única que se desplaza (también en
  horizontal), lleva el contorno y es `relative`. La paginación va fuera de ella.
- **`FILA` en el header y en cada fila, sin `size` en `<Table>`:** `{...FILA}` (`size: "sm"`,
  `h-11 *:py-2`) en cada `Table.Row` y `size={FILA.size}` en `Table.Header`, 44 px reales y casi el doble
  de filas a la vista. El `sm` de `<Table>` mide 56 px y pasa las celdas a `px-5` (hasta la 0.2.0 ni se
  aplicaba). El `*:py-2` es por `Table.Cell`, que toma su relleno del contexto
  (ver [Tablas y filas](trampas.md#tablas-y-filas)). Todas las filas van con `FILA`, también las que
  navegan, para que el `Esqueleto` (`altoFila="h-11"`) coincida: la que navega se distingue por su
  cursor y su enlace, no por su alto.
- **`dependencies` en `Table.Body`.** Todo lo que una celda lea de fuera de su item (`trabajando`,
  `puedeEditar`, un mapa que llega después) va en `dependencies={[…]}`; si no, la fila no se repinta.
- **Acciones de fila.** `ButtonUtility size="xs" color="tertiary"` con su ícono y `tooltip`, en un
  `<div className="flex justify-end gap-1">`, todas en un renglón. El tooltip es el nombre accesible y
  lleva el identificador del registro («Editar 61103025»): veinticinco botones que dicen «Editar» son
  indistinguibles con lector de pantalla. La columna lleva un nombre que no se ve:
  `<Table.Head id="acciones"><span className="sr-only">Acciones</span></Table.Head>`, no `label=""`.
  Deshabilítalas mientras se guarda.
- **Códigos y números.** Códigos en `font-mono text-sm font-medium text-primary tabular-nums`. Montos
  con `formatearMonto` y `text-right tabular-nums` en la celda, y `className="*:justify-end"` en el
  `Table.Head`, porque `text-right` no mueve su etiqueta. Un valor ausente es «—».
- **Una columna que no decide nada no se muestra.** La de área, solo si hay más de una.
- **Filas inactivas.** `className={claseFila(FILA.className, activo)}`: fondo gris y todo el texto
  tachado y apagado (entre decenas de filas, un badge gris solo se pierde). El badge de estado va en
  `<span className={SIN_TACHAR}>`, nunca hijo directo de un flex; el texto de una caja `inline-flex` o
  con color propio (el código) lleva `TACHADO_INACTIVO` (ver [Tablas y filas](trampas.md#tablas-y-filas)).
  Lo pendiente (un borrador) va **atenuado, no tachado**: no está inactivo, le falta un paso.
- **Fila que navega.** `Table.Row href` (el `RouteProvider` de React Aria ya está conectado a
  react-router), `cursor-pointer` a mano y una señal estática en la última celda («Configurar ›», en
  `text-brand-secondary` y `aria-hidden`), porque el hover solo aparece cuando el cursor ya está
  encima. No es un botón: serían dos paradas de foco para el mismo destino. Si esa columna fuerza
  scroll horizontal en una tabla densa, quítala.
- **Tablas densas.** Como mucho dos renglones por fila (el dato secundario debajo, la hora como chip
  bajo la fecha) y `whitespace-nowrap`. Montos compactos solo si el exacto sigue alcanzable, no solo en
  un `title` (ver `CifraKpi`).
- **Cuándo pasar a una `<table>` propia:** cuando la rejilla de React Aria pelea con lo que la tabla
  tiene que hacer.
  - Una rejilla editable con campos (captura por filas): el `Table` del catálogo trae su propio
    teclado de rejilla y pelearía con los inputs.
  - Filas que se despliegan (un resumen con su desglose).
  - Matrices de celdas clicables (un valor por mes).

  Reglas para la propia: estilo solo con tokens y `AREA_TABLA_PROPIA` (también `relative`). En una
  rejilla editable, solo la fila en edición lleva campos y el resto es texto, porque mil campos vivos
  vuelven lenta la captura. Para fijar la primera columna, fija la celda (`sticky left-0` en la `td`);
  solo en filas con `colSpan`, ancla el contenido. Un estado por celda va con símbolo y texto
  (✓ autorizado, ○ propuesto), no solo con color. Y cuidado con el `blur` de los diálogos abiertos
  desde una fila (ver [Tablas y filas](trampas.md#tablas-y-filas)).

---

## Formularios en diálogo

- **Estructura:**
  `ModalOverlay isOpen onOpenChange isDismissable={!trabajando} isKeyboardDismissDisabled={trabajando}` ›
  `Modal className="max-w-lg"` › `Dialog aria-label={titulo}` › `TarjetaDialogo` como hijo directo, con
  `titulo`, `descripcion`, `onCerrar`, `cerrarDeshabilitado={trabajando}`, `onSubmit` y `pie`. Mientras
  guarda, ni Escape ni el clic fuera lo cierran. Si alta y edición tienen los mismos campos, van en un
  solo diálogo: cambian el título, el texto del botón y a qué función se llama.
- **El manejo del estado no lo fija esta skill:** `TarjetaDialogo` sirve igual con el `handleSubmit` de
  React Hook Form que con estado plano. Lo deciden `eecheverria-frontend-react` y
  `eecheverria-untitled-ui`; lo que sigue aplica con cualquiera.
- **Reinicio al abrir.** El diálogo no se desmonta al cerrarse, así que un `useState(registro)` leería
  el registro una sola vez. El estado del formulario vive en un componente hijo con una `key` que
  cambia en cada apertura: un contador que sube en el handler que abre (`setApertura((n) => n + 1)`) y
  `<FormularioOrden key={apertura} registro={registro} />`. Al remontar, `useState(() =>
  valoresDe(registro))` lee el registro de esa apertura y reabrir descarta lo escrito; al cerrar, la
  `key` no cambia y el contenido sigue ahí durante la animación de salida. Sin un efecto que copie el
  registro al estado: el lint de React lo marca, y con un `registro` que el padre arma en cada render
  vaciaba el formulario con cada tecla.
- **Todas las salidas por un solo handler.** Cancelar, la ×, Escape y el clic fuera; los dos últimos los
  dispara el overlay por `onOpenChange`. Limpia el error ahí, no solo en el botón.
- **Se cierra solo si salió bien.** Si falló, el usuario necesita ver el error junto a lo que escribió.
- **«Guardar» solo si hay cambios** respecto de lo guardado, y apagado también por lo que el backend
  exige de forma obvia (los obligatorios vacíos): enviarlo así solo produce un 422 y un viaje perdido.
  El botón es `type="submit"` con `isLoading` y `showTextWhileLoading`, y la × se deshabilita mientras
  se guarda, porque cerrar a media escritura ocultaría el resultado.
- **Errores.** El del backend, en `MensajeError` como primer hijo del cuerpo. Los de campo, en `hint` +
  `isInvalid` del propio control, que los ata con `aria-describedby`. El mismo `hint` sirve de ayuda o
  de contador («132/2000») y pasa a mostrar el error cuando hace falta. Para reglas que piden
  explicación, el origen muestra el error después del primer intento de enviar, no mientras se escribe.
- **Anticipa los bloqueos.** Si una regla conocida impide la acción (cambiarte tu propio rol, abrir sin
  lo mínimo configurado), deshabilita el control y di el motivo junto a él, en vez de esperar el 409.
- **No muestres campos que no se pueden guardar** (los que identifican al registro, en edición). Dilo en
  la `descripcion`: un campo que no se guarda miente.
- **Fechas:** `InputDate` del catálogo, nunca `<input type="date">`. Acota con `minValue`/`maxValue` en
  lugar de validar después. Un rango son dos `InputDate` encadenados por esos límites. Lo que una fecha
  significa («Fecha límite») va como chip (`BadgeWithIcon`) en el `hint`, no como párrafo.
- **`Toggle` a ancho completo:** siempre `className={TOGGLE_ANCHO_COMPLETO}` si lleva `hint`; en una
  rejilla, que ocupe todas las columnas, o el hint parte en cinco renglones. En DPB los sí/no de un
  formulario que se guarda con «Guardar» (una cuenta activa) también son `Toggle`, todos, sin mezclar
  con `Checkbox`: la excepción consistente que `eecheverria-untitled-ui` admite a su regla general.
- **Números:** `Input` con `inputMode="numeric"` para enteros y `inputMode="decimal"` para montos (en
  iOS, `numeric` no trae punto decimal), nunca `type="number"`. El monto se formatea con
  `formatearMonto` al salir del campo y se lee con `leerMonto`, que acepta lo formateado y lo escrito a
  mano y da `null` si no es un número.
- **Selects:** con una sola opción posible, elígela sola y no muestres el control. Mientras carga su
  lista, un `LoadingIndicator` chico con texto («Cargando proveedores…»); si falla, `MensajeError` en
  lugar del campo.
- **Listas dentro del cuerpo**, sin `max-h-*` propio salvo que haga falta: el cuerpo ya se desplaza, y
  dos áreas de scroll anidadas confunden.
- **Nada de modales anidados.** Una confirmación dentro de un diálogo va en la misma fila («Revertir a
  Q 100.00» / «No») o en un panel bajo la lista, no en otro diálogo encima.

---

## Estados: carga, vacío, error y avisos

- **Cómo se piden los datos no lo fija esta skill.** Carga `eecheverria-frontend-react` para pedirlos
  (TanStack Query o similar) y para que una respuesta vieja no pise a una nueva. Sin backend todavía,
  un módulo con datos en memoria y una latencia artificial, detrás del mismo contrato: así se ven los
  estados y cambiar al backend real no toca las pantallas. Lo que sí se fija aquí es qué se ve en cada
  estado:
  - **primera carga:** `Esqueleto`;
  - **recarga** (cambio de página, búsqueda, filtro): los datos anteriores siguen a la vista y
    `Paginacion` sigue habilitada, ignorando el clic mientras carga (ver [Piezas comunes](#piezas-comunes)).
    Nunca vuelvas al esqueleto: desmontaría el paginador, perdería el foco y mataría el `aria-live`;
  - **búsqueda:** con un retardo de ~300 ms tras la última tecla;
  - **error:** `MensajeError`;
  - **vacío:** `EstadoVacio`.
- **`Esqueleto` o `LoadingIndicator`.** `Esqueleto` cuando el contenido tiene forma conocida (una tabla,
  las secciones de un detalle, el inicio). `LoadingIndicator type="dot-circle"` cuando no hay forma que
  copiar: al restaurar la sesión (pantalla completa, con `label`) o en una carga chica dentro de algo
  que ya está (la lista de un `Select` en un diálogo), con el texto al lado. Siempre en un envoltorio
  con `role="status"` y el freno de movimiento (ver [Acceso](#acceso)). En un botón, `isLoading`.
- **Vacío con dos textos:** «no hay nada» y «nada coincide con la búsqueda». Con uno solo, quien filtró
  creería vacío el catálogo y volvería a importar. La acción primaria
  («Importar») solo en el vacío real; en el filtrado, el texto dice qué filtro quitar. Si el listado no
  puede estar vacío sin filtros (los usuarios, que ve un usuario), no hay rama «no hay nada».
- **Error en línea, con remedio.** `MensajeError` con `onReintentar`, o con un botón «Volver al listado»
  si el registro no existe.
- **Un error, un sitio.** Si un diálogo está abierto, el error va en él y la página no lo pinta: el mismo
  `role="alert"` se anunciaría dos veces y quedaría un error visible detrás del diálogo. Las escrituras
  sin diálogo propio, arriba del contenido de la página. El de una confirmación, dentro de ella (un 409
  que lista lo pendiente).
- **429:** el remedio dice que no se perdió nada y que hay que esperar y pulsar «Recargar».
- **Toasts solo para confirmar lo que el backend ya confirmó:** un «se guardó» falso es peor que ningún
  aviso. Van arriba al centro, el único sitio sin acciones, y duran 5 s. Ni errores que hay que
  corregir (se irían antes de leerlos) ni escrituras muy frecuentes (un autoguardado por fila): ahí el
  acuse va en la propia fila. `notificar.error`, para un aviso sin dónde vivir en la pantalla.
- **Avisos en cabeceras densas:** antes que una caja entera que empuje la tabla hacia abajo, una píldora
  del tamaño de un botón, del color del aviso y con su conteo, que abre el detalle en un popover. No
  viene en la plantilla.

---

## Badges de estado

Una tabla `ESTILO` por dominio, de estado a color y etiqueta: el `Record` sobre la unión obliga a
cubrir un estado nuevo, y la etiqueta exportada sirve donde el estado va en texto (un selector). La
tabla y la etiqueta van en un `.ts` y el badge en su `.tsx`: un archivo de componentes que también
exporta funciones rompe Fast Refresh, y el lint de Vite lo marca.

```tsx
// estado-solicitud.ts
export type EstadoSolicitud = "BORRADOR" | "ENVIADA" | "EN_REVISION" | "APROBADA" | "DEVUELTA" | "ARCHIVADA";

export const ESTILO: Record<EstadoSolicitud, { color: "gray" | "brand" | "warning" | "success" | "error"; etiqueta: string }> = {
    BORRADOR: { color: "gray", etiqueta: "Borrador" },
    ENVIADA: { color: "brand", etiqueta: "Enviada" },
    EN_REVISION: { color: "warning", etiqueta: "En revisión" },
    APROBADA: { color: "success", etiqueta: "Aprobada" },
    DEVUELTA: { color: "error", etiqueta: "Devuelta" },
    ARCHIVADA: { color: "gray", etiqueta: "Archivada" },
};

export const etiquetaEstadoSolicitud = (estado: EstadoSolicitud): string => ESTILO[estado].etiqueta;

// estado-solicitud-badge.tsx
import { Badge } from "@desarrollospaloblanco/ui/components/base/badges/badges";
import { ESTILO, type EstadoSolicitud } from "./estado-solicitud";

export const EstadoSolicitudBadge = ({ estado }: { estado: EstadoSolicitud }) => {
    const { color, etiqueta } = ESTILO[estado];
    return (
        <Badge type="pill-color" color={color} size="sm">
            {etiqueta}
        </Badge>
    );
};
```

- **Siempre `type="pill-color" size="sm"`**, en tablas, detalles y franjas.
- **El color nunca va solo:** el badge siempre lleva su texto. Quien no distingue verde de ámbar tiene
  que poder leer el estado igual.
- **Colores:** `success` para lo vigente o aprobado, `warning` para lo detenido o lo que espera revisión,
  `error` para lo devuelto o rechazado, `brand` para lo enviado o en curso y `gray` para borrador,
  inactivo o cerrado (los distingue el texto). `slate` no: es decorativo, no de estado.
- **Etiquetas en español natural y en el género del sustantivo** («Aprobada por Finanzas», no `APROBADO`).
- **Si el backend calcula un estado efectivo** (uno que cambia por fecha sin que nadie escriba), pinta ese
  y no el de la columna.

---

## Botones

- **`secondary` domina:** recargar, importar, exportar, ver, reintentar, el Cancelar del pie y toda
  acción que no cierra el trabajo.
- **Primario por defecto** (sin `color`) para la acción que cierra el trabajo de su zona: «Nueva cuenta»,
  «Guardar cambios», «Aprobar». Normalmente uno por zona (cabecera, pie del diálogo, acción de sección) y
  al final del grupo, a la derecha.
- **`tertiary`:** los `ButtonUtility` de las filas y la × de diálogos y avisos.
- **`link-color`:** el enlace a la pantalla completa desde una tarjeta («Ver todo →»).
- **`link-gray`:** volver (`volverA`).
- **Destructivos:** `secondary-destructive` para el botón que abre un flujo destructivo (con borde, como
  los demás, y a la izquierda del grupo); `primary-destructive` solo para el botón que confirma dentro de
  `ConfirmarDialog`.
- **Pie del diálogo:** Cancelar (`secondary`) y después la confirmación, alineados a la derecha.
- **En móvil (bajo `sm`)**, los secundarios de la cabecera van solo con ícono: el texto en
  `<span className="hidden sm:inline">` y el nombre completo en `aria-label`. El primario conserva su
  texto. Con todos los textos, el primario se salía de la pantalla.
- **`onPress`, no `onClick`,** en `Button` y `ButtonUtility`: son de React Aria, y `onPress` unifica
  ratón, teclado y toque.
- **Botones propios** (`AriaButton`, `<button>`) con `cursor-pointer` explícito. Los del catálogo ya lo
  traen.

---

## Gráficas

- **recharts**, compuesto en la propia feature, con `ChartTooltipContent` y `ChartLegendContent` de
  `@desarrollospaloblanco/ui/components/application/charts/charts-base`. El catálogo free no trae
  gráficas armadas, solo esa base. `recharts` va en las dependencias de la app si la feature lo importa.
- **Color por `currentColor`:** `fill="currentColor"` con `className="text-chart-1"` en el `Bar` o el
  `Cell`, y `bg-chart-1` en el punto de una leyenda propia. El token cambia solo en oscuro (`chart-1` a
  brand-500 #537CB9, `chart-2` a #D95926) para seguir en 3:1 o más contra el fondo.
- **Rejilla y ejes con tokens:** `CartesianGrid vertical={false} stroke="currentColor"
  className="text-utility-neutral-100"`; ejes con `axisLine={false} tickLine={false}` y
  `tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}` (con recharts 3.10, `className="text-xs"`
  en el eje no llega a las etiquetas: salían a 16 px); `Tooltip cursor={{ className: "fill-bg-secondary" }}`.
  Los segmentos apilados y las partes de una dona se separan con un trazo del color de la superficie
  (`stroke="var(--color-bg-primary)"`).
- **Leyenda siempre**, y el color nunca identifica solo: la dona del origen repite monto y porcentaje en
  su leyenda, y el total va en el centro.
- **Eje de meses:** las etiquetas de `MESES` (`formato.ts`). En móvil, `interval="preserveStartEnd"` con
  `minTickGap`; con `interval={0}` las doce se enciman.
- **Bundle:** el aviso de Vite de un chunk de más de 500 kB sale ya con el shell solo (≈515 kB con el
  paquete 0.2.0), y recharts lo agranda; partir por ruta es de `eecheverria-performance`.
- **Accesibilidad:** la gráfica va en un elemento con `role="img"` y un `aria-label` que la resume y
  remite a la tabla. La tabla va **fuera**, como hermana (`role="img"` vuelve presentacional lo de
  dentro): `<div className="sr-only"><table><caption>…</caption>…</table></div>`, con el `sr-only` en el
  `div` y no en la tabla, y los dos dentro de un contenedor `relative`.
- **Paleta:** `--color-chart-1` (el azul de marca) y `--color-chart-2` (el naranja `#EB6834`), validadas
  con `dataviz` en claro y oscuro. **Al agregar una serie, revalida con `dataviz`**; sin ella (no viene
  en este plugin), 3:1 o más contra el fondo en los dos temas, series que no dependan solo del color y
  nada que se confunda con `error`, `warning`, `success` ni `accent`. La serie nueva es un token NUEVO
  (`--color-chart-3`) en un CSS del proyecto (`src/styles/graficas.css`, importado en `globals.css`
  después de `@import "@desarrollospaloblanco/ui/styles.css"`), nunca una redefinición de
  `chart-1`/`chart-2`. Si sirve a varias apps, proponla al paquete.

---

## Marca

**Isotipo DPB o marca propia.** Por defecto, toda app interna lleva el isotipo DPB
(`src/brand/dpb-isotipo.tsx`) en el lockup (`src/brand/app-logo.tsx`). Una marca propia solo con un kit
aprobado, y aun así con la tipografía y los colores del tema del paquete.

**Variantes por fondo:**

- `color` sobre superficies claras (la sidebar, la columna de acceso) y también sobre el fondo oscuro de
  la app: es lo que pide el manual de marca.
- `white` sobre el azul o el rojo de marca: el panel de acceso (`bg-brand-600`).
- `mono`, una sola tinta, para cuando no hay color.
- No rotes, no recolorees y no deformes.

> **Tamaño en la UI: 32 px como mínimo.** El contorno de la casa es fino (≈2 % del ancho del isotipo: a
> 30 px queda en ~0,6 px) y por debajo se pierde. No lo engroses: es una regla de marca, el dibujo no se
> cambia. Con la barra colapsada (72 px de ancho) cabe.

La app usa el componente inline, no el archivo: el SVG de `public/marca/` queda para el favicon, que va
al tamaño que define el navegador, y para quien necesite el archivo suelto.

**Azul de acción.** En la escala del paquete, `brand-600` = `#2C589A` y `accent-600` = `#CC1F37`,
exactos. `bg-brand-solid` (el botón primario) resuelve a `brand-600`, el azul oficial, en los dos
temas; su hover es `brand-700` (`#1B488A`) en claro y `brand-500` en oscuro. El `#2C589A` no lo
escribas a mano: llega por los tokens (`bg-brand-solid`, `fg-brand-primary` y `chart-1` en claro…) y
por las superficies de marca (`bg-brand-600`). `brand-500` (`#537CB9`) es más claro: es el anillo de
foco en los dos temas y `border-brand` en claro, y en oscuro también `fg-brand-primary` y `chart-1`.
El anillo de foco en oscuro da ≈4.7:1 sobre el fondo, por encima del 3:1 de WCAG 1.4.11.

**Acento.** La rampa `accent` es para acentos puntuales de marca (un antetítulo, un destacado), no para
KPIs, acciones ni estados. Como texto, `text-accent` (accent-600 en claro, ≈5.5:1 sobre blanco;
accent-400 `#F6797A` en oscuro, ≈7.5:1), que se invierte con el tema; `text-accent-600` no. El paquete
trae también los semánticos (`text-accent-primary`/`secondary`/`tertiary`, `bg-accent-primary`/
`secondary`/`solid`, `border-accent`, `outline-focus-ring-accent`, `utility-accent-*`): úsalos antes que un
paso crudo de la rampa. Las acciones son azules, y `error`, `warning` y `success` se dejan intactos
porque son funcionales: si `error` fuera el rojo DPB, un exceso y un elemento de marca se verían iguales.

**Tipografía.** Inter 400/500/600/700, la del tema del paquete (`--font-body` y `--font-display`). El
paquete no la carga: va en `index.html` desde Google Fonts. El 500 es el de `font-medium`: sin él, se
pinta en 400. No la cambies desde la app; los documentos con la marca siguen en Open Sans
(`dpbranding`).

**Retícula isométrica** (`src/brand/iso-pattern.tsx`). La textura del panel de marca: es fondo, no
marca, y no va en superficies de trabajo.

**Movimiento del logo.** Nada en bucle junto al trabajo: en la sidebar, como mucho una entrada por
sesión y un realce al pasar el ratón; en el panel de acceso puede flotar. Todo bajo `motion-reduce`.

---

## Responsive

- **Rejillas `grid-cols-1` de base**, que suben con `sm:`, `md:`, `lg:` y `xl:`. Los selectores, a todo
  el ancho en móvil (`w-full sm:w-44`).
- **La sidebar no desaparece**, solo se colapsa a 72 px. Prueba a 320 px (el mínimo de
  `eecheverria-frontend-react`) y a 440 px, en Chrome en modo dispositivo: con la barra quedan ~210 y
  ~330 px útiles, y nada debe salirse del ancho.
- **Para cazar desbordes**, compara `main.scrollWidth` con `main.clientWidth` en la consola.

---

## Accesibilidad

- **Un solo `<h1>` por página**, el de `AppLayout`. Cada bloque es un `<section aria-labelledby>` con su
  `<h2>` (`Seccion`). Si el título visible sobraría, `Seccion` no sirve, porque siempre lo pinta: escribe
  un `<section aria-labelledby>` propio con el `<h2 className="sr-only">`.
- **Objetivos táctiles: aquí manda esta skill.** `eecheverria-frontend-react` pide 44×44 px; en DPB las
  filas miden 44 px (`FILA`) y las acciones de fila (`ButtonUtility xs`, 28 px) se aceptan bajo WCAG
  2.5.8 (24 px o más), para que quepan en un renglón de una tabla densa.
- **Movimiento:** `motion-reduce:animate-none` en entradas y esqueletos, y `motion-reduce:transition-none`
  en los realces.
- **El color nunca va solo:** badges con texto, ✓ y ○ en celdas, «Excede el límite por…» con ícono, una
  diferencia con signo y texto («+Q 50.00», «sin cambio»), y el fondo con un punto para marcar un cambio.
- **Anuncios:** `aria-live="polite"` en la paginación, `role="status"` en vacíos y esqueletos (con el
  texto dentro, no en `aria-label`), ninguno en las notas, que son estáticas, `role="alert"` en errores
  (uno a la vez) y `containerAriaLabel="Notificaciones"` en el `Toaster`. Un `role="status"` que se
  monta ya con su texto no lo anuncian todos los lectores: lo expone a quien llega a él. Un anuncio
  fiable pide una región viva que exista antes del cambio.
- **El anillo de foco no se recorta:** un área con scroll que contiene enlaces o campos lleva holgura
  (`-mx-1 px-1 pt-1` en la navegación, `py-1` en el cuerpo del diálogo, `pt-px` en `main`).

---

## Idioma

- **Todo en español:** textos, `aria-label`, tooltips, nombres de archivos descargados y mensajes.
  `<html lang="es">`, y `<I18nProvider locale="es-GT">` en `main.tsx`: React Aria formatea fechas y
  números con el idioma del navegador, no con el `lang`, y sin él `InputDate` sale mm/dd/yyyy en un
  equipo en inglés.
- **Desde la 0.3.0, el catálogo trae sus textos en español:** paginación, selects, fechas, carga de
  archivos, menús y etiquetas para el lector de pantalla. Siguen en inglés las variantes de ejemplo
  `dropdown-*` y la navegación de demo, que en DPB no se usan, y el `Toaster` de `sonner`, que va con
  `containerAriaLabel="Notificaciones"` (ya lo hace `notificaciones.tsx`). La paginación de DPB sigue siendo
  `Paginacion` de la plantilla, por su diseño.
- **Con la 0.2.0, el catálogo trae textos fijos en inglés**, y como el paquete no se edita desde la app,
  se apagan por props o se compone con otras piezas del catálogo (o se actualiza el paquete):

  | Componente (0.2.0) | Qué hacer |
  | --- | --- |
  | `Select` | `placeholder` en español (por defecto, «Select») |
  | `MultiSelect` | `showFooter={false}`. El placeholder «Search» de su buscador no tiene salida: se acepta si perder la búsqueda es peor |
  | `PaginationPageDefault` | `Paginacion` de la plantilla (dos `Button` del catálogo) |
  | `DateRangePicker` | dos `InputDate` encadenados con `minValue`/`maxValue` |
  | `DropZone` y los ítems de `file-upload` | `FileTrigger` + `Button` y una ficha propia |

- **Antes de usar un componente nuevo del catálogo, busca su texto fijo.**
- **Fechas con `formatearFecha`** («dd/mm/aaaa», sin pasar por `Date`) y montos con `formatearMonto` y
  `formatearCompacto`, de `src/utils/formato.ts`, nunca con un `Intl` sin revisar (ver
  [Datos en pantalla](trampas.md#datos-en-pantalla)).
