# Patrones de pantalla DPB

Cómo se arma una pantalla de una app interna de DPB para que todas se vean y se comporten igual. El
origen es **app-presupuestos**: «Origen: …» es procedencia, no algo que abrir, y lo marcado «en el
origen» es un ejemplo de su negocio. Las rutas en `código` son las del proyecto después de copiar la
plantilla (`assets/plantilla/` de esta skill).

Lo general de Untitled UI —catálogo, CLI, tabla de tokens semánticos, imports `Aria*`, props `is*`
de React Aria, `cx`/`sortCx`, iconos con `data-icon`, `Button href`, dark mode con `.dark-mode`,
free vs. PRO— está en `eecheverria-untitled-ui`, y aquí no se repite. Lo que ya mordió, con
síntoma, causa y arreglo, está en [`trampas.md`](trampas.md).

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

- **No edites `src/components/` ni `src/styles/theme.css`.** Los regenera
  `npx untitledui@latest upgrade` y el cambio se perdería en silencio. La marca va en
  `src/styles/brand-dpb.css`, que se importa después de `theme.css`. Lo que haya que corregir de un
  componente se corrige desde fuera: props, una `className` (gana por `cx`) o una constante en
  `features/comunes/`. La única excepción es el parche de `calendar.tsx`, y solo con un starter
  anterior al del 22/10/2026 (ver [Instalación](trampas.md#instalación-y-toolchain)).
- **Todo control sale del catálogo.** `Select` y no `<select>`, `InputDate` y no
  `<input type="date">`. Los nativos pintan el chrome del navegador (el azul del sistema en el
  desplegable, el `dd/mm/aaaa`) y rompen la identidad. `NativeSelect` es justo el `<select>` del
  sistema: tampoco.
- **Tema claro por defecto** (`ThemeProvider defaultTheme="light"`), sin seguir al sistema: son apps
  que se usan junto a Excel e impresos. El oscuro queda disponible porque los tokens lo resuelven.
- **Página delgada.** Componentes de presentación en `features/x/` y una página en `src/pages/` que
  solo compone. Cómo se piden y se guardan los datos lo decide `eecheverria-frontend-react`.
- **Ocultar no autoriza.** Un botón o una entrada del menú se ocultan por rol para no ofrecer algo
  que va a responder 403; la autorización la hace el backend. Por lo mismo, no ofrezcas una acción
  que siempre fallaría (un «Importar» de una integración que nadie configuró).
- **Ramifica por `error.code`, nunca por el texto.** El código es el contrato; el mensaje cambia.

---

## Anatomía del shell

Plantillas: `src/layouts/app-layout.tsx` y `src/features/shell/` (`sidebar.tsx`, `nav-items.ts`,
`use-sidebar-collapsed.ts`, `shell.config.ts` para lo propio de cada app, `use-cuenta.ts` para el
usuario y la salida).

```
bg-canvas  (h-dvh · p-3 · gap-3 · overflow-hidden)
├── Sidebar    tarjeta: bg-primary · rounded-xl · shadow-md · ring-1 ring-secondary
│   ├── piso 1  lockup                         fijo
│   ├── piso 2  navegación                     lo único que se desplaza
│   └── piso 3  cuenta + «Colapsar»            fijo, con border-t
└── Contenido  la misma tarjeta
    ├── aviso     franja global (opcional)                         fija
    ├── <header>  volverA · h1 · subtítulo · action · filtros      fijo
    └── <main>    relative · flex-col · min-h-0 · flex-1 · overflow-y-auto · pt-px
```

**Lienzo y tarjetas.** El fondo es `bg-canvas` (token propio de `brand-dpb.css`, gris azulado) y
sobre él flotan dos tarjetas. No uses `bg-secondary` como lienzo: en claro es casi blanco y el efecto
flotante se pierde.

**El scroll vive dentro de la tarjeta de contenido.** `h-dvh` + `overflow-hidden` en la raíz y
`overflow-y-auto` en `main`: la cabecera no se va con el scroll y las tarjetas nunca se salen del
viewport. `main` es columna flex para que una pantalla pida todo el alto con `flex-1`, `relative`
como red contra los `absolute` que escapan del recorte, y `pt-px` para que el `ring` de su primer hijo
no se recorte arriba. Entre `main` y el área con scroll de una tabla, cada nivel flex lleva `min-h-0`.

**Sidebar de tres pisos.** Solo se desplaza la navegación: así el perfil no se va de la vista.

- **Ancho:** 72 px colapsada; expandida, lo decide el contenido (`w-auto min-w-60 max-w-80`), para que
  el nombre del usuario quepa sin cortar el apellido.
- **Ítem activo:** el ícono en `text-fg-brand-primary` sobre `bg-secondary hover:bg-secondary_hover`
  (el fondo azul sólido se probó y se descartó). El `NavLink` lleva `end` solo en `/`, para que un
  detalle (`/proveedores/7`) marque su módulo.
- **Grupos:** `NAV_ITEMS` sigue el orden del proceso, no el alfabeto, y no lista pantallas que todavía
  no existen: un enlace a una pantalla vacía es peor que no tenerlo.
- **Colapsada:** cada enlace lleva `Tooltip` a la derecha, envuelto en `Focusable` (con el `NavLink`
  suelto no abría), y `aria-label` con su nombre.
- **Cuenta:** el usuario (avatar, nombre en dos renglones —nombres y apellidos— y debajo su rol o
  área) **es** el menú. «Cerrar sesión» vive dentro y no como entrada suelta de la navegación, donde
  competía con los módulos y quedaba a un clic accidental. Sin sesión (`cuenta: null`, lo que trae
  `use-cuenta.ts` por defecto), el menú no aparece: una app que todavía no tiene login es un caso válido.
- **Se remonta al cambiar de página:** cada ruta monta una página distinta y React desmonta todo,
  sidebar incluida. Lo que deba pasar una vez por sesión (la entrada del logo) va en estado de módulo,
  no en `useState`; los datos que arman el menú, en la caché de la capa de datos.

**Header de página** (props de `AppLayout`):

- `title` es el único `<h1>` de la pantalla.
- `subtitle` es una línea de apoyo, oculta bajo `sm`: la cabecera es fija y en móvil cada renglón suyo
  es uno menos de contenido.
- `action` lleva los botones de la pantalla, arriba a la derecha.
- `filtros` es el contexto que se está viendo (periodo, área…) en un renglón propio dentro del header:
  no se va con el scroll ni empuja los botones fuera de la esquina. Los filtros de búsqueda de un
  listado no van aquí, sino en el cuerpo, encima de la tabla.
- `volverA` es `{ href, label }`: un `Button color="link-gray" size="sm"` con `ArrowLeft`, encima del
  título.

**`volverA` en vez de breadcrumbs.** Úsalo en el detalle de un listado (`/proveedores/:id` → «Volver a
proveedores»), también en sus estados de carga y error: un enlace mal escrito no debe dejar a nadie
atrapado. Con un nivel, dice lo mismo que unas migas en menos espacio. Con dos
(`/proveedores/:id/contratos/:id`), lleva al padre inmediato y lo nombra («Volver a Acme»), no al
listado. Desde tres, evalúa breadcrumbs: el origen no pasó de un nivel.

**Transición entre pantallas.** Header y `main` entran con un fundido de 200 ms y 4 px (`TRANSICION`
de `app-layout.tsx`, con `motion-reduce:animate-none`): por encima de ~300 ms se lee como lentitud. La
tarjeta no se anima. Entre páginas distintas la entrada se dispara sola, porque React monta todo de
nuevo; la `key` con el `pathname` es para cuando la misma página cambia de parámetro (`/x/1` → `/x/2`)
(ver [Animación](trampas.md#animación-svg-y-remontajes)).

**Franja global.** Lo que cambia el contexto de toda la pantalla (modo simulación, mantenimiento) va
en la prop `aviso` de `AppLayout`, que lo pinta fijo sobre el header, dentro de la tarjeta y sin
animación. Suele bastar una `NotaInformativa`; si exige atención, en `bg-warning-primary` con
`ring-warning_subtle`. `role="status"` si aparece a media sesión, y texto corto en móvil.

---

## Recetas de página

### Listado

Origen: `cuentas.tsx`. Orden de bloques:

1. **`AppLayout`** con `title`, `subtitle` y `action`. La acción es un
   `flex flex-wrap items-center justify-end gap-3` con «Recargar» (`secondary`, `RefreshCw01`), las
   secundarias que apliquen (importar, exportar) y al final la primaria («Nueva cuenta», `Plus`).
   Todas con `isDisabled` mientras se guarda.
2. **Cuerpo:** `flex min-h-0 flex-1 flex-col gap-5`.
3. **`MensajeError` de página**, para escrituras sin diálogo propio y solo si no hay un diálogo
   abierto (ver [Estados](#estados-carga-vacío-error-y-avisos)).
4. **Filtros:** `flex flex-wrap items-end gap-3`. La búsqueda, con `Input` + `SearchLg`
   (`min-w-56 flex-1`) y un retardo de ~300 ms. Los `Select`, en `w-full sm:w-44` (todo el ancho en
   móvil), con `placeholder` en español (el del catálogo es «Select») y una opción centinela para
   «Todas» (ver la trampa del `Select` en [Selects](trampas.md#selects-campos-y-controles)). Desde
   react-aria-components 1.22, usa `value`/`onChange`: `selectedKey`/`onSelectionChange` quedaron
   deprecados. Un selector con una sola opción no se muestra: ocupa sitio y no decide nada.
5. **Contenido según el estado** (ver [Estados](#estados-carga-vacío-error-y-avisos)): `Esqueleto` con
   las `filas` y el `altoFila` de la tabla real en la primera carga; en cada recarga, la tabla anterior
   a la vista con `Paginacion isDisabled`; el error centrado (`flex-1 items-center justify-center`) con
   `onReintentar`; `EstadoVacio` con dos textos; y con datos, `<div className={AREA_TABLA}>` con la
   tabla y, fuera del área, `Paginacion`.
6. **Diálogos al final**, como hermanos: alta y edición (uno solo para las dos), importaciones y
   `ConfirmarDialog` para eliminar.

La búsqueda va contra el servidor: con un listado paginado, filtrar en el cliente solo buscaría dentro
de la página visible.

Si el registro tiene detalle, la fila entera es el enlace (ver [Tablas](#tablas)). Si no lo tiene, la
fila no navega, porque prometería algo que no existe.

### Detalle

Origen: `ciclo-detalle.tsx`.

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
- **Dos caras por sección.** En solo lectura, un `<dl>` en rejilla `sm:grid-cols-2 lg:grid-cols-4`, con
  `dt` en `text-xs font-semibold tracking-wide text-quaternary uppercase` y `dd` en
  `text-sm text-primary`. Editable, los campos en la misma rejilla y «Guardar cambios» como `accion`,
  deshabilitado sin cambios. Un campo que no se puede guardar no se muestra: se explica en la
  `descripcion` de la sección.
- **Listas dentro de una sección:** en una tarjeta `overflow-hidden rounded-lg bg-primary ring-1
  ring-secondary` (blanca sobre el gris de la sección). Vacía, una línea de texto con `role="status"`:
  la sección ya tiene título y más contenido, y un `EstadoVacio` pesaría más que la lista. Con error,
  `MensajeError` dentro de la misma sección.
- **Estado local que nace de props:** dale a la sección una `key` hecha con los valores del servidor.
  Así se reinicia cuando el servidor responde algo distinto y no mientras se escribe.
- La acción destructiva que inicia un flujo («Anular solicitud») va a la izquierda del grupo de
  acciones, en `secondary-destructive`.

### Inicio con KPIs y gráficas

Origen: `inicio.tsx`.

- **`AppLayout`:** título personal («Hola, <nombre>») solo con sesión; sin login, el nombre de la
  pantalla. Subtítulo con el propósito, el selector de contexto (el periodo) en `filtros` y «Recargar»
  en `action` (solo ícono bajo `sm`).
- **Una sola petición** trae el inicio y la página pinta los bloques que lleguen: no decide quién ve qué.
- **Cuerpo** `flex flex-col gap-4`:
  1. Franja de contexto: el periodo y la próxima fecha que importa.
  2. Fila de `CifraKpi` en un `<dl className="grid grid-cols-1 gap-4 …">` con tantas columnas como
     cifras: tres, `md:grid-cols-3`; cuatro, `sm:grid-cols-2 xl:grid-cols-4`.
  3. Tarjetas en rejilla `grid-cols-1 lg:grid-cols-2`, o `lg:grid-cols-3` con la gráfica en
     `lg:col-span-2`.
- **Tarjetas: `<Seccion className="bg-primary p-5">`**, no sobre su gris de siempre: con muchas
  apiladas, el gris las vuelve una sola mancha. Su acción típica es
  `Button color="link-color" size="sm" iconTrailing={ArrowRight}` hacia la pantalla completa.
- **Tarjeta sin datos:** `EstadoVacio variante="punteado"` en lugar del cuerpo, que dice por qué: aquí
  la tarjeta entera es ese dato. En el inicio casi todo empieza vacío, y eso también informa. Si falta
  el contexto entero (no hay periodo abierto), un solo vacío en lugar de todos los bloques.
- **Esqueleto compuesto** con la forma real: la franja, las cifras y las tarjetas.
- **Cuida los huecos.** Las tarjetas de una misma fila se estiran al alto de la más alta, así que una
  lista larga deja espacio muerto al lado. Antes de agregar algo, mira qué hay junto. El equipo pidió
  dos veces quitar huecos, y por eso tampoco se agregan tarjetas cuando el dato cabe en una existente.

### Acceso

Plantilla: `src/layouts/pantalla-acceso.tsx`.

- **Dos columnas** a `min-h-dvh`: el acceso sobre `bg-primary`, con el lockup arriba y un pie con el ©
  y «Ayuda», y el panel de marca (`bg-brand-500`, isotipo `white`, `IsoPattern`), que se oculta bajo
  `lg` porque es apoyo y no contenido; por eso el lockup de la izquierda se queda siempre.
- **Bloque de acceso:** un antetítulo corto en `text-accent-600` (`lineaSuperior`, uno de los pocos
  usos legítimos del acento), el `<h1>` «Inicia sesión», una línea sobre qué cuenta usar, el error si lo
  hay y un solo botón `size="lg" color="secondary" className="w-full"` con `MicrosoftLogo` como
  `iconLeading`. La nota de soporte la pone `PantallaAcceso`, con `SHELL.correoSoporte`; no la agregues.
- **Un solo método y ningún campo de correo o contraseña:** quien autentica es Microsoft 365, y un campo
  que no sirve para nada confunde.
- **El error** dice qué pasó y qué hacer según su código (no registrado, inactivo, conflicto de cuenta,
  Microsoft caído, servidor inalcanzable), con la anatomía de `MensajeError`.
- **Mientras se restaura la sesión**, `LoadingIndicator type="dot-circle"` a pantalla completa con
  «Restaurando sesión…», no el formulario: si no, quien ya tiene sesión ve el login un instante.
- El logo de Microsoft lleva sus colores oficiales, fuera de los tokens: es la marca de un tercero y
  no cambia con el tema.

### Pestañas con la vista en la URL

Origen: `usuarios.tsx` y `consolidado.tsx`.

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
- **Las acciones del header son de la pestaña.** En una pestaña de solo lectura, «Recargar» y
  «Agregar» no tienen objeto: no se muestran.
- **Si renombras una vista, deja el valor viejo como alias:** hay enlaces y correos ya enviados con él.
- Una sub-vista dentro de una pestaña lleva su propio parámetro (`?vista=solicitudes&tipo=pendientes`).

---

## Piezas comunes

Cuándo sí y cuándo no. El código está en la plantilla; no lo repitas a mano.

- **`AppLayout`** (`src/layouts/app-layout.tsx`). Toda pantalla autenticada. Ver
  [Anatomía del shell](#anatomía-del-shell).
- **`TarjetaDialogo`** (`src/features/comunes/tarjeta-dialogo.tsx`). El contenido de todo diálogo, como
  **hijo directo de `Dialog`**: cabecera y pie fijos, scroll solo en el cuerpo. El `Dialog` del
  catálogo actual (`max-h-[inherit] overflow-y-auto`) desplazaría todo, cabecera y pie incluidos, y
  `TarjetaDialogo` hereda su tope. Si ese `Dialog` no lleva `max-h-[inherit]`, es el catálogo
  anterior: pásale `className="bg-primary shadow-xl max-h-[85dvh]"` (ver [Diálogos](trampas.md#diálogos));
  con el actual, nada. Con `onSubmit` es un `<form noValidate>`: Enter envía y ella misma llama a
  `preventDefault()`. El ancho va en el `Modal` de cada diálogo (`max-w-md` las confirmaciones,
  `max-w-lg` los formularios). No metas otra área con `overflow-y-auto` alrededor.
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
- **`NotaInformativa`** (en `mensaje-error.tsx`). La anatomía de `MensajeError` en tono neutro, para
  explicar sin alarmar: cómo funciona el acceso, por qué un registro ya no se edita. Sin `role`: es
  contenido estático. No compite con un error cuando los dos están en pantalla.
- **`EstadoVacio`** (`estado-vacio.tsx`). `titulo` (un `<p>`, para no saltar niveles de encabezado),
  `descripcion` y `accion` opcional, con `role="status"`. `variante="relleno"` para un listado sin filas
  (con dos textos según haya filtros o no); `"punteado"` para una tarjeta del inicio sin datos. Una
  lista vacía dentro de una `Seccion` con más contenido no lo usa: basta una línea de texto. No uses
  `application/empty-state` del starter: trae tokens no semánticos y una ilustración decorativa.
- **`Esqueleto`** (`esqueleto.tsx`). Toda primera carga con forma conocida pasa por él:
  `role="status"` con la `etiqueta` como texto `sr-only` dentro (sin `aria-busy`), `filas` y `altoFila`
  (por defecto `h-11`, el de `FILA`). Para otras formas (un detalle, el inicio), compón: un contenedor
  `relative` con `role="status"` y un texto `sr-only` («Cargando el inicio»), y dentro bloques de
  `BLOQUE_ESQUELETO` en `aria-hidden`.
- **`Paginacion`** (`paginacion.tsx`). «Anterior · Página N de M · T registros · Siguiente», con
  `aria-live`. Props `page`, `totalPages`, `total`, `onCambiarPagina` e `isDisabled`. Con el contrato
  de `eecheverria-api-design` (`pagination: { page, pageSize, totalItems, totalPages }`), `page` y
  `totalPages` pasan tal cual y `total={pagination.totalItems}`. Sin números de página: en un listado
  que se filtra, nadie salta a la página once. Con una sola página muestra solo el total.
- **`notificar`** (`notificaciones.tsx`). `notificar.exito(titulo, descripcion?)` después de que el
  backend confirmó; `<Notificaciones />` se monta una vez en la raíz. Va sobre `sonner` porque el
  toast del catálogo es PRO, con el aspecto de los tokens.
- **`Seccion`** (`seccion.tsx`). Un bloque del detalle: `<section aria-labelledby>` con `<h2>` real,
  `rounded-xl bg-secondary p-6 ring-1 ring-secondary` y `accion` arriba a la derecha. Es lo que deja al
  lector de pantalla saltar entre bloques. No la anides. Sobre `bg-primary`, es la tarjeta del inicio.
- **`CifraKpi`** (`cifra-kpi.tsx`). Una cifra destacada, dentro de un `<dl>`: el `div` de la tarjeta es
  el grupo del `dl`, con `dt` y `dd` como hijos directos. Manda el número; la etiqueta va arriba, el
  detalle debajo y el ícono arriba a la derecha. Si el valor va compacto (`formatearCompacto`), el
  exacto va en `exacto` (`formatearMonto`): sale en el `title` y como texto `sr-only`. El `title` no se
  alcanza con toque ni con teclado: si el exacto importa en móvil, no compactes bajo `sm` o ponlo en
  `detalle`. `tono="alerta"` pinta en rojo, y entonces el detalle tiene que decir por qué con palabras.
- **`Explicacion`** (`explicacion.tsx`). Un «?» con la explicación en tooltip, alcanzable con teclado,
  para franjas compactas donde el texto no cabe. Es para la explicación, no para el dato.
- **`tabla.ts`**. `AREA_TABLA` + `ENCABEZADO_FIJO`, siempre juntos, para el `Table` del catálogo;
  `AREA_TABLA_PROPIA` para una `<table>` propia, y `FILA` para el alto de las filas. Ver [Tablas](#tablas).
- **`estado-fila.ts`**. `claseFila(base, activo)`, `TACHADO_INACTIVO` y `SIN_TACHAR`, para las filas
  inactivas.
- **`toggle.ts`**. `TOGGLE_ANCHO_COMPLETO`, en todo `Toggle` que lleve `hint`.
- **`formato.ts`** (`src/utils/`). `formatearMonto(n)` → «Q 4,500.00», «-Q 250.50» (es-GT, GTQ, dos
  decimales; el espacio lo pone `Intl`, no lo quites) y `formatearCompacto(n)` → «1.9k», «184.5k»,
  «1.4M», «-1.9k», sin «Q». El compacto es propio porque `Intl` compacto en es-GT da «1.7 K» y
  «184.5 k». Donde va el compacto, el exacto sigue alcanzable.

---

## Tablas

- **Área con encabezado fijo.** Envuelve el `Table` del catálogo en `<div className={AREA_TABLA}>` y
  pasa `ENCABEZADO_FIJO` al `Table.Header`. El área es la única que se desplaza (también en
  horizontal), lleva el contorno y es `relative`. La paginación va fuera de ella.
- **`size` en el header y en cada fila**, nunca solo en `<Table>`, donde se ignora. Para listados
  densos, `{...FILA}` (`size: "sm"`, `h-11 *:py-2`) en cada `Table.Row` y `size={FILA.size}` en
  `Table.Header`: 44 px reales y casi el doble de filas a la vista. El `*:py-2` es por `Table.Cell`, que
  toma su relleno del contexto (ver [Tablas y filas](trampas.md#tablas-y-filas)). Las filas que navegan
  van en `md`.
- **`dependencies` en `Table.Body`.** Todo lo que una celda lea de fuera de su item (`trabajando`,
  `puedeEditar`, un mapa que llega después) va en `dependencies={[…]}`; si no, la fila no se repinta.
- **Acciones de fila.** `ButtonUtility size="xs" color="tertiary"` con su ícono y `tooltip`, en un
  `<div className="flex justify-end gap-1">`, todas en un renglón. El tooltip es el nombre accesible y
  lleva el identificador del registro («Editar 61103025»): veinticinco botones que dicen «Editar» son
  indistinguibles con lector de pantalla. La columna lleva `label=""`. Deshabilítalas mientras se guarda.
- **Códigos y números.** Códigos en `font-mono text-sm font-medium text-primary tabular-nums`. Montos
  con `formatearMonto` y `text-right tabular-nums` en la celda, y `className="*:justify-end"` en el
  `Table.Head`, porque `text-right` no mueve su etiqueta. Un valor ausente es «—».
- **Una columna que no decide nada no se muestra.** La de área, solo si hay más de una.
- **Filas inactivas.** `className={claseFila(FILA.className, activo)}`: fondo gris y todo el texto
  tachado y apagado: con decenas de filas, un badge gris solo se pierde. El badge de estado va dentro de
  `<span className={SIN_TACHAR}>` para seguir legible; ese `inline-block` no puede ser hijo directo de un
  flex (se *blockifica* y se tacha igual). El texto que vive en una caja `inline-flex`, o que trae su
  propio color (el código), lleva `TACHADO_INACTIVO` explícito. Lo pendiente (un borrador, algo sin
  abrir) va **atenuado, no tachado**: no está inactivo, le falta un paso.
- **Fila que navega.** `Table.Row href` (el `RouteProvider` de React Aria ya está conectado a
  react-router), `cursor-pointer` a mano y una señal estática en la última celda («Configurar ›», en
  `text-brand-secondary` y `aria-hidden`), porque el hover solo aparece cuando el cursor ya está
  encima. No es un botón: serían dos paradas de foco para el mismo destino. Si esa columna fuerza
  scroll horizontal en una tabla densa, quítala.
- **Tablas densas.** Como mucho dos renglones por fila (el dato secundario debajo, la hora como chip
  bajo la fecha) y `whitespace-nowrap`. Montos compactos con `formatearCompacto` («1.9k», «1.4M») solo
  si el exacto sigue alcanzable, no solo en un `title` (ver `CifraKpi`).
- **Personas:** iniciales en el `Avatar` de cada fila. La foto se pide solo al abrir una persona.
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
- **El manejo del estado no lo fija esta skill.** `TarjetaDialogo` solo recibe `onSubmit(evento)` y
  llama ella misma a `preventDefault()`, así que sirve igual con el `handleSubmit` de React Hook Form
  que con estado plano. La decisión la toman `eecheverria-frontend-react` y `eecheverria-untitled-ui`;
  lo que sigue aplica con cualquiera.
- **Reinicio al abrir.** El diálogo no se desmonta al cerrarse (se cierra el overlay), así que carga los
  valores cuando `abierto` pasa a `true`, no al montar. Con las dependencias `[abierto, registro]`,
  `abierto` hace que reabrir (aunque sea el mismo registro) descarte lo que se escribió antes, y
  `registro` que se lea el actual. `registro` tiene que ser estable (el objeto que llegó del servidor):
  uno que el padre arma en cada render vaciaría el formulario con cada tecla.
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
  rejilla, que ocupe todas las columnas, o el hint parte en cinco renglones. En DPB el `Toggle`
  también va dentro de formularios que se guardan con «Guardar» (una cuenta activa). Es la excepción
  que `eecheverria-untitled-ui` admite a su regla general (toggle para efecto inmediato; checkbox si
  hay que guardar) cuando el proyecto la sigue de forma consistente: en una misma app, los sí/no de
  formulario son todos `Toggle`, sin mezclar con `Checkbox`.
- **Números:** `Input` con `inputMode="numeric"` para enteros y `inputMode="decimal"` para montos (en
  iOS, `numeric` no trae punto decimal), nunca `type="number"`. El monto se formatea con
  `formatearMonto` al salir del campo.
- **Selects:** con una sola opción posible, elígela sola y no muestres el control. Mientras carga su
  lista, un `LoadingIndicator` chico con texto («Cargando proveedores…»); si falla, `MensajeError` en
  lugar del campo.
- **Listas dentro del cuerpo**, sin `max-h-*` propio salvo que haga falta: el cuerpo ya se desplaza, y
  dos áreas de scroll anidadas confunden.
- **Nada de modales anidados.** Una confirmación dentro de un diálogo va en la misma fila («Revertir a
  Q 100.00» / «No») o en un panel bajo la lista, no en otro diálogo encima.

---

## Estados: carga, vacío, error y avisos

- **Cómo se piden los datos no lo fija esta skill.** Lo decide `eecheverria-frontend-react` (TanStack
  Query o similar), igual que con los formularios, incluido que una respuesta vieja no pise a una
  nueva. Lo que sí se fija aquí es qué se ve en cada estado:
  - **primera carga:** `Esqueleto`;
  - **recarga** (cambio de página, búsqueda, filtro): los datos anteriores siguen a la vista y
    `Paginacion` va con `isDisabled`. Nunca vuelvas al esqueleto: desmontaría el paginador, perdería el
    foco y mataría el `aria-live`;
  - **búsqueda:** con un retardo de ~300 ms tras la última tecla;
  - **error:** `MensajeError`;
  - **vacío:** `EstadoVacio`.
- **`Esqueleto` o `LoadingIndicator`.** `Esqueleto` cuando el contenido tiene forma conocida (una tabla,
  las secciones de un detalle, el inicio). `LoadingIndicator type="dot-circle"` cuando no hay forma que
  copiar: al restaurar la sesión (pantalla completa, con `label`) o en una carga chica dentro de algo
  que ya está (la lista de un `Select` en un diálogo), con el texto al lado. En un botón, `isLoading`.
- **Vacío con dos textos:** «no hay nada» y «nada coincide con la búsqueda». Con el mismo texto, quien
  filtró creería que el catálogo está vacío y volvería a importar sin necesidad. La acción primaria
  («Importar») solo en el vacío real; en el filtrado, el texto dice qué filtro quitar. Si el listado no
  puede estar vacío sin filtros (los usuarios, que ve un usuario), no hay rama «no hay nada».
- **Error en línea, con remedio.** `MensajeError` con `onReintentar`, o con un botón «Volver al listado»
  si el registro no existe.
- **Un error, un sitio.** Si un diálogo está abierto, el error va en él y la página no lo pinta: el mismo
  `role="alert"` se anunciaría dos veces y quedaría un error visible detrás del diálogo. Las escrituras
  sin diálogo propio, arriba del contenido de la página. El error de una confirmación va dentro de ella
  (un 409 que lista lo pendiente, dentro del diálogo).
- **429:** el remedio dice que no se perdió nada y que hay que esperar y pulsar «Recargar».
- **Toasts solo para confirmar lo que el backend ya confirmó.** Un «se guardó» que resulta falso es peor
  que ningún aviso. Van arriba al centro, el único sitio sin acciones, y duran 5 s. Los errores que
  hay que corregir no van en toast, porque se iría antes de que alguien lo lea y lo arregle.
  Tampoco las escrituras muy frecuentes (un autoguardado por fila serían decenas por sesión): ahí el
  acuse va en la propia fila. `notificar.error` queda para un aviso que no tiene dónde vivir en la
  pantalla, una sola vez.
- **Avisos en cabeceras densas:** antes que una caja entera que empuje la tabla hacia abajo, una píldora
  del tamaño de un botón, del color del aviso y con su conteo, que abre el detalle en un popover. No
  viene en la plantilla.

---

## Badges de estado

Una tabla `ESTILO` por dominio, de estado a color y etiqueta. El `Record` sobre la unión de estados
hace que TypeScript exija cubrir un estado nuevo, y la etiqueta exportada sirve donde el estado va en
texto (un selector), con una sola fuente para las dos cosas.

```tsx
import { Badge } from "@/components/base/badges/badges";

type EstadoSolicitud = "BORRADOR" | "ENVIADA" | "EN_REVISION" | "APROBADA" | "DEVUELTA" | "ARCHIVADA";

const ESTILO: Record<EstadoSolicitud, { color: "gray" | "brand" | "warning" | "success" | "error"; etiqueta: string }> = {
    BORRADOR: { color: "gray", etiqueta: "Borrador" },
    ENVIADA: { color: "brand", etiqueta: "Enviada" },
    EN_REVISION: { color: "warning", etiqueta: "En revisión" },
    APROBADA: { color: "success", etiqueta: "Aprobada" },
    DEVUELTA: { color: "error", etiqueta: "Devuelta" },
    ARCHIVADA: { color: "gray", etiqueta: "Archivada" },
};

export const etiquetaEstadoSolicitud = (estado: EstadoSolicitud): string => ESTILO[estado].etiqueta;

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

- **`secondary` domina.** En el origen hay unos 114 botones `secondary` contra un puñado de primarios:
  recargar, importar, exportar, ver, reintentar, el Cancelar del pie y toda acción que no cierra el trabajo.
- **Primario por defecto** (sin `color`) para la acción que cierra el trabajo de su zona: «Nueva cuenta»,
  «Guardar cambios», «Revisar y enviar», «Aprobar». Normalmente uno por zona (cabecera, pie del diálogo,
  acción de sección) y al final del grupo, a la derecha.
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
- **`onPress`, no `onClick`,** en `Button` y `ButtonUtility` del catálogo: son de React Aria y sus tipos
  marcan `onClick` como no recomendado (`onPress` unifica ratón, teclado y toque).
- **Botones propios** (`AriaButton`, `<button>`) con `cursor-pointer` explícito. Los del catálogo ya lo
  traen.

---

## Gráficas

- **recharts**, compuesto en la propia feature, con `ChartTooltipContent` y `ChartLegendContent` de
  `components/application/charts/charts-base.tsx`. El catálogo free no trae gráficas armadas, solo esa
  base (verificado con `npx untitledui search chart`).
- **Color por `currentColor`:** `fill="currentColor"` con `className="text-chart-1"` en el `Bar` o el
  `Cell`, y `bg-chart-1` en el punto de una leyenda propia. El color sale del token y cambia solo en
  oscuro: `chart-1` sube un paso (brand-400) y `chart-2` baja un poco su luminancia (#D95926), para
  seguir en 3:1 o más contra el fondo oscuro.
- **Rejilla y ejes con tokens:** `CartesianGrid vertical={false} stroke="currentColor"
  className="text-utility-neutral-100"`; ejes con `axisLine={false} tickLine={false} className="text-xs"`
  y `tick={{ fill: "var(--color-text-tertiary)" }}`; `Tooltip cursor={{ className: "fill-bg-secondary" }}`.
  Los segmentos apilados y las partes de una dona se separan con un trazo del color de la superficie
  (`stroke="var(--color-bg-primary)"`).
- **Leyenda siempre**, y el color nunca identifica solo: la dona del origen repite monto y porcentaje en
  su leyenda, y el total va en el centro.
- **Eje de meses en móvil:** `interval="preserveStartEnd"` con `minTickGap`; con `interval={0}` las doce
  etiquetas se enciman.
- **Accesibilidad:** la gráfica va en un elemento con `role="img"` y un `aria-label` que la resume y
  remite a la tabla. La tabla con los números va **fuera** de ese elemento, como hermana, porque
  `role="img"` vuelve presentacional todo lo de dentro:
  `<div className="sr-only"><table><caption>…</caption>…</table></div>`. El `sr-only` va en el `div`, no
  en la tabla, y los dos dentro de un contenedor `relative`.
- **Paleta:** dos series validadas con el script de `dataviz` en claro y oscuro: `--color-chart-1`, el
  azul de marca, y `--color-chart-2`, el naranja `#EB6834`. **Al agregar una serie, revalida la paleta
  con la skill `dataviz`**; si no la tienes (no viene en este plugin), el mínimo es 3:1 o más contra el
  fondo, en claro y en oscuro, y series que se distingan sin depender solo del color. El naranja se
  eligió lejos del rojo DPB y de los colores de estado; una serie nueva tampoco debe confundirse con
  `error`, `warning`, `success` ni con `accent`.

---

## Marca

**Isotipo DPB o marca propia.** Por defecto, toda app interna lleva el isotipo DPB
(`src/brand/dpb-isotipo.tsx`) en el lockup (`src/brand/app-logo.tsx`). Una marca propia solo con un kit
aprobado, y aun así con el texto en Open Sans y los colores de DPB.

**Variantes por fondo:**

- `color` sobre superficies claras (la sidebar, la columna de acceso) y también sobre el fondo oscuro de
  la app: es lo que pide el manual de marca.
- `white` sobre el azul o el rojo de marca: el panel de acceso (`bg-brand-500`).
- `mono`, una sola tinta, para cuando no hay color.
- No rotes, no recolorees y no deformes.

> **Tamaño: 32 px como mínimo**, sin excepción. El contorno de la casa es fino (≈2 % del ancho del
> isotipo: a 30 px queda en ~0,6 px) y por debajo se pierde. No lo engroses: es una regla de marca, el
> dibujo no se cambia. Con la barra colapsada (72 px de ancho) cabe.

La app usa el componente inline, no el archivo: el SVG de `public/marca/` queda para el favicon y para
quien necesite el archivo suelto.

**Azul de acción.** `brand-500` = `#2C589A` y `accent-500` = `#CC1F37`, exactos, en `brand-dpb.css`.
`bg-brand-solid` (el botón primario) resuelve a `brand-600` (`#234B85`): así reparte la rampa Untitled
UI, no lo "corrijas" a 500. El `#2C589A` exacto sale en el anillo de foco, en `border-brand` y en
`bg-brand-500` (el panel de acceso).

**Acento.** La rampa `accent` es para acentos puntuales de marca (un antetítulo, un destacado), no para
KPIs, acciones ni estados. Las acciones son azules, y `error`, `warning` y `success` se dejan intactos
porque son funcionales: si `error` fuera el rojo DPB, un exceso y un elemento de marca se verían iguales.

**Tipografía.** Open Sans 400/500/600/700 e itálica 400 (`--font-body` y `--font-display`), cargada en
`index.html` desde Google Fonts. El 500 es el de `font-medium`: sin él, se pintaba en 400.

**Retícula isométrica** (`src/brand/iso-pattern.tsx`). La textura del panel de marca, en `text-white/10`
y con `aria-hidden`. Es fondo, no marca: no la pongas en superficies de trabajo.

**Movimiento del logo.** Nada en bucle junto al trabajo, porque distrae. En la sidebar, como mucho una
entrada por sesión y un leve realce al pasar el ratón; en el panel de acceso puede flotar. Todo bajo
`motion-reduce`.

---

## Responsive

- **Rejillas `grid-cols-1` de base**, que suben con `sm:`, `md:`, `lg:` y `xl:`.
- **Selectores a todo el ancho en móvil** (`w-full sm:w-44`): a la mitad cortaban los nombres.
- **La sidebar no desaparece**, solo se colapsa a 72 px. Prueba a 440 px (Chrome en modo dispositivo):
  con la barra quedan ~330 px útiles y nada debe salirse del ancho.
- **Para cazar desbordes**, compara `main.scrollWidth` con `main.clientWidth` en la consola.
- **Cifras compactas en móvil** con `formatearCompacto` («1.4M»), sin dejar el exacto solo en el
  `title` (ver `CifraKpi`).

---

## Accesibilidad

- **Un solo `<h1>` por página**, el de `AppLayout`. Cada bloque es un `<section aria-labelledby>` con su
  `<h2>` (`Seccion`). Si el título visible sobraría, `Seccion` no sirve, porque siempre lo pinta: escribe
  un `<section aria-labelledby>` propio con el `<h2 className="sr-only">`.
- **Filas de 44 px** (`FILA`) y objetivos táctiles de al menos 24 px (WCAG 2.5.8).
- **Movimiento:** `motion-reduce:animate-none` en entradas y esqueletos, y `motion-reduce:transition-none`
  en los realces.
- **El color nunca va solo:** badges con texto, ✓ y ○ en celdas, «Excede el límite por…» con ícono, una
  diferencia con signo y texto («+Q 50.00», «sin cambio»), y el fondo con un punto para marcar un cambio.
- **Anuncios:** `aria-live="polite"` en la paginación, `role="status"` en vacíos y esqueletos (con el
  texto dentro, no en `aria-label`), ninguno en las notas, que son estáticas, `role="alert"` en errores
  (uno a la vez) y `containerAriaLabel="Notificaciones"` en el `Toaster`.
- **El anillo de foco no se recorta:** un área con scroll que contiene enlaces o campos lleva holgura
  (`-mx-1 px-1` en la navegación, `py-1` en el cuerpo del diálogo, `pt-px` en `main`).
- El recorrido con teclado y lector de pantalla se verifica como dicen `eecheverria-untitled-ui` y
  `eecheverria-frontend-react`.

---

## Idioma

- **Todo en español:** textos, `aria-label`, tooltips, nombres de archivos descargados y mensajes.
  `<html lang="es">`.
- **El catálogo trae textos fijos en inglés**, y como `src/components/` no se toca, se apagan por props o
  se compone con otras piezas del catálogo:

  | Componente | Qué hacer |
  | --- | --- |
  | `Select` | `placeholder` en español (por defecto, «Select») |
  | `MultiSelect` | `showFooter={false}`. El placeholder «Search» de su buscador no tiene salida: se acepta si perder la búsqueda es peor |
  | `PaginationPageDefault` | `Paginacion` de la plantilla (dos `Button` del catálogo) |
  | `DateRangePicker` | dos `InputDate` encadenados con `minValue`/`maxValue` |
  | `DropZone` y los ítems de `file-upload` | `FileTrigger` + `Button` y una ficha propia |
  | `Toaster` de `sonner` | `containerAriaLabel="Notificaciones"` (por defecto, «Notifications») |
  | `not-found.tsx` del starter | `src/pages/no-encontrada.tsx` |

- **Antes de usar un componente nuevo del catálogo, busca su texto fijo.**
- **Fechas en `dd/mm/aaaa`**, sin pasar por `Date`, y montos con `formatearMonto` y `formatearCompacto`
  de `src/utils/formato.ts`, nunca con un `Intl` sin revisar (ver
  [Datos en pantalla](trampas.md#datos-en-pantalla)).
