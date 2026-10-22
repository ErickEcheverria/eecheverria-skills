# Patrones de pantalla DPB

Cómo se arma una pantalla de una app interna de DPB para que se vea y se comporte como
**app-presupuestos**. Las rutas en `código` son las del proyecto después de copiar la plantilla
(`assets/plantilla/` de esta skill, con `scripts/copiar-plantilla.mjs`).

Lo general de Untitled UI —catálogo, CLI, tabla de tokens semánticos, imports `Aria*`, props `is*`
de React Aria, `cx`/`sortCx`, iconos con `data-icon`, `Button href`, dark mode con `.dark-mode`,
free vs. PRO— está en `eecheverria-untitled-ui`, y aquí no se repite. Lo que ya mordió, con
síntoma, causa y arreglo, está en `trampas.md`.

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
  `features/comunes/`. La única excepción del origen es el parche de `calendar.tsx` (ver `trampas.md`).
- **Todo control sale del catálogo.** `Select` y no `<select>`, `InputDate` y no
  `<input type="date">`. Los nativos pintan el chrome del navegador (el azul del sistema en el
  desplegable, el `dd/mm/aaaa`) y rompen la identidad. `NativeSelect` existe en el catálogo, pero es
  justo el `<select>` del sistema: no se usa.
- **Tema claro por defecto** (`ThemeProvider defaultTheme="light"`), sin seguir al sistema. Son apps
  administrativas que se usan junto a Excel e impresos. El oscuro queda disponible porque los tokens
  lo resuelven.
- **Página delgada.** `x.types.ts` (espejo de los DTOs), `use-x.ts` (estado y llamadas), componentes
  de presentación en `features/x/` y una página en `src/pages/` que solo compone.
- **Ocultar no autoriza.** Un botón o una entrada del menú se ocultan por rol para no ofrecer algo
  que va a responder 403; la autorización la hace el backend. Por lo mismo, no ofrezcas una acción
  que siempre fallaría (en el origen, «Importar de SAP» solo aparece si alguna sociedad tiene SAP).
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
    ├── [franja de aviso global]               fija
    ├── <header>  volverA · h1 · subtítulo · action · filtros      fijo
    └── <main>    relative · flex-col · min-h-0 · flex-1 · overflow-y-auto
```

**Lienzo y tarjetas.** El fondo es `bg-canvas` (token propio de `brand-dpb.css`, gris azulado) y
sobre él flotan dos tarjetas. No uses `bg-secondary` como lienzo: en claro es casi blanco y el efecto
flotante se pierde. El aire entre tarjetas lo pone el `p-3 gap-3` del contenedor, no un margen de
cada una. La guía general de marca (`dpbranding`) pide fondo blanco y sidebar azul; en las apps
internas manda lo que se aprobó en app-presupuestos.

**El scroll vive dentro de la tarjeta de contenido.** `h-dvh` + `overflow-hidden` en la raíz y
`overflow-y-auto` en `main`: la cabecera no se va con el scroll y las tarjetas nunca se salen del
viewport. `main` es columna flex para que una pantalla pida todo el alto con `flex-1`, y `relative`
como red contra los `absolute` que escapan del recorte. Entre `main` y el área con scroll de una
tabla, cada nivel flex lleva `min-h-0`.

**Sidebar de tres pisos.** Solo se desplaza la navegación. Antes se desplazaba la tarjeta entera y,
en pantallas bajas, el perfil se iba de la vista.

- **Ancho:** 72 px colapsada; expandida, lo decide el contenido (`w-auto min-w-60 max-w-80`), para que
  el nombre del usuario quepa sin cortar el apellido. La transición de ancho usa
  `[interpolate-size:allow-keywords]`; donde no se soporta, cambia de golpe sin romperse.
- **Ítem activo:** el ícono en `text-fg-brand-primary` sobre `bg-active`. El fondo azul sólido se probó
  y se descartó: basta con el ícono, que además es lo único que queda a la vista con la barra colapsada.
- **Grupos:** al cambiar de grupo va un separador con su nombre (el nombre, solo expandida), nunca antes
  de la primera entrada visible. `NAV_ITEMS` sigue el orden del proceso, no el alfabeto, y no lista
  pantallas que todavía no existen: un enlace a una pantalla vacía es peor que no tenerlo.
- **Colapsada:** cada enlace lleva `Tooltip` a la derecha y `aria-label` con su nombre.
- **Cuenta:** el usuario (avatar, nombre en dos renglones —nombres y apellidos— y debajo su rol o
  área) **es** el menú. «Cerrar sesión» vive dentro y no como entrada suelta de la navegación, donde
  competía con los módulos y quedaba a un clic accidental. El menú abre hacia arriba (`top`), o a la
  derecha con la barra colapsada.
- **Persistencia:** el estado colapsado va en `localStorage`, con `try/catch` y una clave con el prefijo
  de la app.
- **Se remonta en cada navegación**, porque cada página monta su `AppLayout`. Lo que deba pasar una vez
  por sesión (la entrada del logo, la petición que arma el menú) va en estado de módulo, no en `useState`.

**Header de página** (props de `AppLayout`):

- `title` es el único `<h1>` de la pantalla (`text-display-xs font-semibold`, `truncate`).
- `subtitle` es una línea de apoyo, oculta bajo `sm`: la cabecera es fija y en móvil cada renglón suyo
  es uno menos de contenido.
- `action` lleva los botones de la pantalla, arriba a la derecha y con `ml-auto`, para que sigan
  pegados a la derecha si bajan de renglón.
- `filtros` es el contexto que se está viendo (ciclo, área…) en un renglón propio (`basis-full`)
  dentro del header: no se va con el scroll ni empuja los botones fuera de la esquina. Los filtros de
  búsqueda de un listado no van aquí, sino en el cuerpo, encima de la tabla.
- `volverA` es `{ href, label }`: un `Button color="link-gray" size="sm"` con `ArrowLeft`, encima del
  título. Vive en el layout porque, metido en `children`, saldría debajo del título.

**`volverA` en vez de breadcrumbs.** Úsalo en el detalle de un listado (`/ciclos/:id` → «Volver a
ciclos»), también en sus estados de carga y error: un enlace mal escrito no debe dejar a nadie
atrapado. App-presupuestos no tiene breadcrumbs porque su profundidad máxima es un nivel, y ahí un
enlace de vuelta dice lo mismo en menos espacio. Si una app llega a tres niveles, evalúa breadcrumbs
entonces: el origen no resolvió ese caso.

**Transición entre pantallas.** Header y `main` entran con
`animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none`. Son
200 ms y 4 px a propósito: por encima de ~300 ms se lee como lentitud. La tarjeta no se anima (el
marco se queda quieto y cambia lo de dentro). Para que se dispare en cada navegación hace falta una
`key` con el `pathname` (ver `trampas.md`).

**Franja global.** Un aviso que tiene que verse en toda pantalla (en el origen, «Ver como» otro rol)
va como franja fija al principio de la tarjeta de contenido: `bg-warning-primary`,
`border-b border-warning_subtle`, `role="status"`, y texto corto en móvil.

---

## Recetas de página

### Listado

Referencia: `src/pages/cuentas.tsx` de app-presupuestos. Orden real de bloques:

1. **`AppLayout`** con `title`, `subtitle` y `action`. La acción es un
   `flex flex-wrap items-center justify-end gap-3` con «Recargar» (`secondary`, `RefreshCw01`), las
   secundarias que apliquen (importar, exportar) y al final la primaria («Nueva cuenta», `Plus`).
   Todas con `isDisabled` mientras se guarda.
2. **Cuerpo:** `flex min-h-0 flex-1 flex-col gap-5`.
3. **`MensajeError` de página**, para escrituras sin diálogo propio y solo si no hay un diálogo
   abierto (ver [Estados](#estados-carga-vacío-error-y-avisos)).
4. **Filtros:** `flex flex-wrap items-end gap-3`; la búsqueda con `Input` + `SearchLg`
   (`min-w-56 flex-1`) y los `Select` a ancho fijo (`w-44`, `w-48`). Un selector con una sola opción no
   se muestra: ocupa sitio y no decide nada.
5. **Según `carga.status`:**
   - `cargando`: `Esqueleto` con `filas` y `altoFila` de la tabla real, para que la llegada de los
     datos no haga saltar la pantalla.
   - `error`: centrado (`flex-1 items-center justify-center`), `MensajeError` con `onReintentar` en
     `max-w-lg`.
   - `listo` y vacío: `EstadoVacio` con dos textos.
   - `listo`: `<div className={AREA_TABLA}>` con la tabla y, fuera del área, `Paginacion`.
6. **Diálogos al final**, como hermanos: alta y edición (uno solo para las dos), importaciones y
   `ConfirmarDialog` para eliminar.

La búsqueda va contra el servidor, y el hook descarta las respuestas que llegan fuera de orden. Con un
listado paginado, filtrar en el cliente solo buscaría dentro de la página visible.

Si el registro tiene detalle, la fila entera es el enlace (ver [Tablas](#tablas)). Si no lo tiene, la
fila no navega, porque prometería algo que no existe.

### Detalle

Referencia: `src/pages/ciclo-detalle.tsx` de app-presupuestos.

- **`AppLayout`:** `title` = nombre del registro, `subtitle` = su contexto, `volverA` al listado,
  `action` = las acciones de estado, con «Recargar» como secundaria.
- **Mientras carga:** un título genérico, `volverA` y un esqueleto de tres bloques `h-40` hechos con
  `BLOQUE_ESQUELETO`. **Con error:** título genérico, `volverA`, `MensajeError` y un botón «Volver al
  listado».
- **Cuerpo** `flex flex-col gap-5`, en este orden:
  1. `MensajeError` de escritura, en un solo sitio para toda la página: cuatro `role="alert"` a la
     vez se pisan al anunciarse y ninguno se entiende.
  2. Si el registro no admite cambios, una nota neutra (`NotaInformativa`; en el origen, `role="status"`
     con `rounded-lg bg-secondary p-3 ring-1 ring-secondary`) con su badge y cómo retomarlo.
  3. Bloques `Seccion` apilados, cada uno con su `accion` arriba a la derecha.
- **Secciones y no pestañas**, a propósito: la configuración completa se ve de un vistazo y no queda
  escondido tras una pestaña el dato que bloquea el siguiente paso.
- **Dos caras por sección.** En solo lectura, un `<dl>` en rejilla `sm:grid-cols-2 lg:grid-cols-4`, con
  `dt` en `text-xs font-semibold tracking-wide text-quaternary uppercase` y `dd` en
  `text-sm text-primary`. Editable, los campos en la misma rejilla y «Guardar cambios» como `accion`,
  deshabilitado sin cambios. Un campo que no se puede guardar no se muestra: se explica en la
  `descripcion` de la sección.
- **Listas dentro de una sección:** en una tarjeta `overflow-hidden rounded-lg bg-primary ring-1
  ring-secondary` (blanca sobre el gris de la sección). Vacía, una línea `role="status"`; con error,
  `MensajeError` dentro de la misma sección.
- **Estado local que nace de props:** dale a la sección una `key` hecha con los valores del servidor.
  Así se reinicia cuando el servidor responde algo distinto y no mientras se escribe.
- La acción destructiva que inicia un flujo («Cancelar ciclo») va a la izquierda del grupo de
  acciones, en `secondary-destructive`.

### Inicio con KPIs y gráficas

Referencia: `src/pages/inicio.tsx` y `src/features/inicio/` de app-presupuestos.

- **`AppLayout`:** título personal («Hola, Erick»), subtítulo con el propósito y, en `action`, el
  selector de contexto y «Recargar» (solo ícono bajo `sm`).
- **Una sola petición** trae el inicio y la página pinta los bloques que lleguen: no decide quién ve qué.
- **Cuerpo** `flex flex-col gap-4`:
  1. Franja de contexto (en el origen, el «pulso del ciclo»: cierre, próximo corte destacado y fechas).
  2. Fila de `CifraKpi` dentro de `<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">`.
  3. Tarjetas en rejilla `grid-cols-1 lg:grid-cols-2`, o `lg:grid-cols-3` con la gráfica en
     `lg:col-span-2`.
- **Tarjetas: `Seccion` sobre `bg-primary`**, no sobre su gris de siempre: con muchas apiladas, el
  gris las vuelve una sola mancha. En el origen era un componente aparte (`TarjetaInicio`, misma
  anatomía, `bg-primary p-5`); aquí es `<Seccion className="bg-primary p-5">`, no otra plantilla.
  Su acción típica es `Button color="link-color" size="sm" iconTrailing={ArrowRight}` hacia la
  pantalla completa.
- **Bloque sin datos:** `EstadoVacio variante="punteado"`, que dice por qué. En el inicio casi todo
  empieza vacío, y eso también informa. Si falta el contexto entero (no existe el ciclo), un solo vacío
  en lugar de todos los bloques.
- **Esqueleto** con la forma real, compuesto con `BLOQUE_ESQUELETO`: la franja, cuatro cifras y dos
  tarjetas.
- **Cuida los huecos.** Las tarjetas de una misma fila se estiran al alto de la más alta, así que una
  lista larga deja espacio muerto al lado. Antes de agregar algo, mira qué hay junto. El equipo pidió
  dos veces quitar huecos, y por eso tampoco se agregan tarjetas cuando el dato cabe en una existente.

### Acceso

Plantilla: `src/layouts/pantalla-acceso.tsx`. Referencia: `src/pages/login.tsx` de app-presupuestos.

- **Dos columnas** `lg:grid-cols-2` a `min-h-dvh`:
  - Izquierda, `bg-primary`: el lockup chico arriba (isotipo a color y nombre de la app), el bloque de
    acceso centrado en `max-w-90` y un pie con el © y «Ayuda».
  - Derecha, el panel de marca: `bg-brand-500` con `IsoPattern` (`text-white/10`, `aria-hidden`), el
    isotipo grande en variante `white`, el nombre de la app y «Desarrollos Palo Blanco». Se oculta bajo
    `lg` porque es apoyo y no contenido; por eso el lockup de la izquierda se queda siempre.
- **Bloque de acceso:** un antetítulo corto en `text-accent-600` (uno de los pocos usos legítimos del
  acento), el `<h1>` «Inicia sesión», una línea sobre qué cuenta usar, el error si lo hay, un solo
  botón `size="lg" color="secondary" className="w-full"` con `MicrosoftLogo` como `iconLeading` y una
  `NotaInformativa` (en el origen, con el ícono `Lock01`) con el correo de soporte.
- **Un solo método y ningún campo de correo o contraseña:** quien autentica es Microsoft 365, y un campo
  que no sirve para nada confunde.
- **El error** dice qué pasó y qué hacer según su código (no registrado, inactivo, conflicto de cuenta,
  Microsoft caído, servidor inalcanzable), con la anatomía de `MensajeError`.
- **Mientras se restaura la sesión**, `LoadingIndicator type="dot-circle"` a pantalla completa con
  «Restaurando sesión…», no el formulario: si no, quien ya tiene sesión ve el login un instante.
- El logo de Microsoft lleva sus colores oficiales, fuera de los tokens: es la marca de un tercero y
  no cambia con el tema.

### Pestañas con la vista en la URL

Referencia: `src/pages/usuarios.tsx` y `src/pages/consolidado.tsx` de app-presupuestos.

- **La pestaña vive en `?vista=`** y no en estado local: recargar o compartir el enlace deja a la
  persona donde estaba. La vista por defecto no lleva parámetro.
- **Léela con lista cerrada:** `parametros.get("vista") === "roles" ? "roles" : "usuarios"`. Un valor
  desconocido cae en la vista por defecto.
- **Al cambiar, conserva los demás parámetros** (`new URLSearchParams(parametros)` y `set`/`delete` de
  `vista`) con `{ replace: true }`, para no llenar el historial. Usuarios reemplaza todos los
  parámetros y el consolidado los conserva: sigue al consolidado.
- **Markup:** `Tabs selectedKey onSelectionChange className="min-h-0 flex-1 gap-5"` ›
  `Tabs.List type="underline" aria-label` › `Tabs.Item id label`; y cada `Tabs.Panel id` con
  `flex min-h-0 flex-1 flex-col`, para que la tabla de dentro conserve su scroll.
- **Datos perezosos:** el hook de una pestaña recibe si está activa y solo pide con ella abierta. Importa
  sobre todo si su lectura es cara.
- **Las acciones del header son de la pestaña.** En una pestaña de solo lectura, «Recargar» y
  «Agregar» no tienen objeto: no se muestran.
- **Si renombras una vista, deja el valor viejo como alias:** hay enlaces y correos ya enviados con él.
- Una sub-vista dentro de una pestaña lleva su propio parámetro (`?vista=solicitudes&tipo=aumentos`).

---

## Piezas comunes

Cuándo sí y cuándo no. El código está en la plantilla; no lo repitas a mano.

- **`AppLayout`** (`src/layouts/app-layout.tsx`). Toda pantalla autenticada. Ver
  [Anatomía del shell](#anatomía-del-shell).
- **`TarjetaDialogo`** (`src/features/comunes/tarjeta-dialogo.tsx`). El contenido de todo diálogo, como
  **hijo directo de `Dialog`**: cabecera y pie fijos, scroll solo en el cuerpo (`relative`). El `Dialog`
  del starter actual es `max-h-[inherit] overflow-y-auto` y desplazaría todo, cabecera y pie incluidos;
  `TarjetaDialogo` toma ese `max-h-[inherit]` y conserva `ring-1 ring-secondary` con las esquinas del
  `Modal`, para que el borde se vea en oscuro. Con `onSubmit` es un `<form noValidate>`: Enter envía y
  ella misma llama a `preventDefault()`. El ancho va en el `Modal` de cada diálogo (`max-w-md` las
  confirmaciones, `max-w-lg` los formularios). No metas otra área con `overflow-y-auto` alrededor.
- **`ConfirmarDialog`** (`confirmar-dialog.tsx`). Para lo irreversible y para lo que tiene efectos que
  no se deshacen (un correo enviado a todos). `tono="primary-destructive"` si destruye; `primary` si
  solo es definitivo. El texto va en el cuerpo, nunca en la cabecera, y anticipa lo que el backend
  rechazaría («si tiene conceptos amarrados, no dejará eliminarla»). Sin ×: se sale con Cancelar,
  Escape o clic fuera. Lo reversible no se confirma (en el origen, «Bloquear» va directo y «Abrir»,
  que manda correos, confirma).
- **`MensajeError`** (`mensaje-error.tsx`). Error en línea: `titulo` (qué pasó, el mensaje del
  backend), `detalles` por campo y `remedio`, obligatorio, porque un error correcto sin qué hacer deja
  a la persona sin salida. El remedio sale de una tabla por motivo de cada app, no del texto. Con
  `onReintentar` trae el «Reintentar». Arriba del cuerpo de un diálogo, en la página o dentro de una
  sección; no para avisos que se van solos.
- **`NotaInformativa`** (en `mensaje-error.tsx`). La misma anatomía en tono neutro, para explicar sin
  alarmar: cómo funciona el acceso, por qué un registro ya no se edita. No compite con un error cuando
  los dos están en pantalla.
- **`EstadoVacio`** (`estado-vacio.tsx`). `titulo`, `descripcion` y `accion` opcional, con
  `role="status"`. `variante="relleno"` para un listado sin filas (con dos textos según haya filtros o
  no); `"punteado"` para un bloque del inicio. Dentro de una `Seccion` basta una línea de texto. No uses
  `application/empty-state` del starter: trae tokens no semánticos (`from-neutral-50 to-neutral-200`) y
  una ilustración decorativa.
- **`Esqueleto`** (`esqueleto.tsx`). Toda carga de contenido con forma conocida pasa por él, no por
  bloques sueltos: `etiqueta` (lo que anuncia su `role="status"`), `filas` y `altoFila` para una tabla,
  y `motion-reduce` incluido. Para formas que no son filas (un detalle, el inicio), compón bloques con
  `BLOQUE_ESQUELETO`.
- **`Paginacion`** (`paginacion.tsx`). «Anterior · Página N de M · T registros · Siguiente», con
  `aria-live`; recibe `{...meta}` del backend tal cual. Sin números de página: en un listado que se
  filtra, saltar a la página once no lo hace nadie. Con una sola página muestra solo el total, que
  responde a «¿cuántos hay?». Reemplaza a `PaginationPageDefault`, que trae los textos en inglés.
- **`notificar`** (`notificaciones.tsx`). `notificar.exito(titulo, descripcion?)` después de que el
  backend confirmó; `<Notificaciones />` se monta una vez en la raíz. Va sobre `sonner` porque el
  toast del catálogo es PRO, con el aspecto de los tokens.
- **`Seccion`** (`seccion.tsx`). Un bloque del detalle: `<section aria-labelledby>` con `<h2>` real,
  `rounded-xl bg-secondary p-6 ring-1 ring-secondary` y `accion` arriba a la derecha. Es lo que deja al
  lector de pantalla saltar entre bloques. No la anides. Sobre `bg-primary`, es la tarjeta del inicio.
- **`CifraKpi`** (`cifra-kpi.tsx`). Una cifra destacada, dentro de un `<dl>`: manda el número
  (`text-display-xs tabular-nums`), la etiqueta va arriba, el detalle debajo y el `FeaturedIcon`
  `brand` arriba a la derecha, para que la tarjeta no quede con un hueco. Si el valor va compacto, el
  exacto va en el `title`. `tono="alerta"` pinta en rojo, y entonces el detalle tiene que decir por qué
  con palabras.
- **`Explicacion`** (`explicacion.tsx`). Un «?» con la explicación en tooltip, alcanzable con teclado,
  para franjas compactas donde el texto no cabe. Es para la explicación, no para el dato.
- **`tabla.ts`**. `AREA_TABLA` + `ENCABEZADO_FIJO`, siempre juntos, para el `Table` del catálogo;
  `AREA_TABLA_PROPIA` para una `<table>` propia, y `FILA` para el alto de las filas. Ver [Tablas](#tablas).
- **`estado-fila.ts`**. `claseFila(base, activo)`, `TACHADO_INACTIVO` y `SIN_TACHAR`, para las filas
  inactivas.
- **`toggle.ts`**. `TOGGLE_ANCHO_COMPLETO`, en todo `Toggle` que lleve `hint`.

Hay piezas del origen que no vienen en la plantilla; si las necesitas, cópialas de app-presupuestos:
`AvisoDesplegable` (`features/comunes/aviso-desplegable.tsx`: un aviso del tamaño de un botón, con su
conteo y el detalle en popover, para cabeceras donde manda una tabla), `InputMonto`
(`features/presupuestos/input-monto.tsx`: montos con comas de miles al teclear) y `SelectorCiclo`
(`features/ciclos/selector-ciclo.tsx`: selector de contexto sin etiqueta visible, para la cabecera).

---

## Tablas

- **Área con encabezado fijo.** Envuelve el `Table` del catálogo en `<div className={AREA_TABLA}>` y
  pasa `ENCABEZADO_FIJO` al `Table.Header`. El área es la única que se desplaza (también en
  horizontal), lleva el contorno y es `relative`. La paginación va fuera de ella.
- **`size` en el header y en cada fila**, nunca solo en `<Table>`, donde se ignora. Para listados
  densos, `FILA` de `tabla.ts` (`size: "sm"` y `h-11`) esparcida en cada `Table.Row`: 44 px, que es el
  mínimo de área táctil, y casi el doble de filas a la vista que con el alto por defecto. Las filas que
  navegan van en `md`.
- **`dependencies` en `Table.Body`.** Todo lo que una celda lea de fuera de su item (`trabajando`,
  `puedeEditar`, un mapa que llega después) va en `dependencies={[…]}`; si no, la fila no se repinta.
- **Acciones de fila.** `ButtonUtility size="xs" color="tertiary"` con su ícono y `tooltip`, en un
  `<div className="flex justify-end gap-1">`, todas en un renglón. El tooltip es el nombre accesible y
  lleva el identificador del registro («Editar 61103025»): veinticinco botones que dicen «Editar» son
  indistinguibles con lector de pantalla. La columna lleva `label=""`. Deshabilítalas mientras se guarda.
- **Códigos y números.** Códigos en `font-mono text-sm font-medium text-primary tabular-nums`, para que
  se alineen por columna y se comparen de un vistazo. Montos con `text-right tabular-nums` en la celda
  y `className="*:justify-end"` en el `Table.Head`, porque `text-right` no mueve su etiqueta. Un valor
  ausente es «—».
- **Una columna que no decide nada no se muestra.** La de sociedad, solo si hay más de una.
- **Filas inactivas.** `className={claseFila(FILA.className, activo)}`: fondo gris y todo el texto
  tachado y apagado. Son dos señales y no solo el badge, porque con decenas de filas un badge gris
  entre verdes se pierde, y el tachado sobrevive sin color. El badge de estado va dentro de
  `<span className={SIN_TACHAR}>` para seguir legible; el texto que vive en una caja `inline-flex`, o
  que trae su propio color (el código), lleva `TACHADO_INACTIVO` explícito. Lo pendiente (un
  borrador, algo sin abrir) va **atenuado, no tachado**: no está inactivo, le falta un paso.
- **Fila que navega.** `Table.Row href` (el `RouteProvider` de React Aria ya está conectado a
  react-router), `cursor-pointer` a mano y una señal estática en la última celda («Configurar ›», en
  `text-brand-secondary` y `aria-hidden`), porque el hover solo aparece cuando el cursor ya está
  encima. No es un botón: serían dos paradas de foco para el mismo destino. Si esa columna fuerza
  scroll horizontal en una tabla densa, quítala (el consolidado del origen no la tiene).
- **Tablas densas.** Como mucho dos renglones por fila (el dato secundario debajo, la hora como chip
  bajo la fecha), `whitespace-nowrap` y el desglose en el `title`. Montos compactos («1.9k», «1.4M»)
  con el exacto en el `title`.
- **Personas:** iniciales en el `Avatar` de cada fila. La foto se pide solo al abrir una persona.
- **Cuándo pasar a una `<table>` propia:** cuando la rejilla de React Aria pelea con lo que la tabla
  tiene que hacer.
  - Una rejilla editable con campos (la hoja de captura): el `Table` del catálogo trae su propio
    teclado de rejilla y pelearía con los inputs.
  - Filas que se despliegan (el consolidado por concepto, la proyección de personal).
  - Matrices de celdas clicables (los techos por mes).

  Reglas para la propia: estilo solo con tokens y `AREA_TABLA_PROPIA` (también `relative`). En una
  rejilla editable, solo la fila en edición lleva campos y el resto es texto, porque mil campos vivos
  vuelven lenta la captura. Para fijar la primera columna se ancla el contenido de la celda, no la
  celda con `colSpan`. Un estado por celda va con símbolo y texto (✓ autorizado, ○ propuesto), no solo
  con color. Y cuidado con el `blur` de los diálogos abiertos desde una fila (ver `trampas.md`).

---

## Formularios en diálogo

- **Estructura:** `ModalOverlay isOpen onOpenChange isDismissable` › `Modal className="max-w-lg"` ›
  `Dialog aria-label={titulo}` › `TarjetaDialogo` como hijo directo, con `titulo`, `descripcion`,
  `onCerrar`, `cerrarDeshabilitado={trabajando}`, `onSubmit` y `pie`. Si alta y edición tienen los
  mismos campos, van en un solo diálogo: cambian el título, el texto del botón y a qué función se llama.
- **El manejo del estado no lo fija esta skill.** `TarjetaDialogo` solo recibe `onSubmit(evento)` y
  llama ella misma a `preventDefault()`, así que sirve igual con el `handleSubmit` de React Hook Form
  que con estado plano. App-presupuestos usa un `useState` por campo, sin React Hook Form, pero eso no
  es una prescripción: la decisión entre React Hook Form + Zod u otra cosa la toman
  `eecheverria-frontend-react` y `eecheverria-untitled-ui`. Lo que sigue aplica con cualquiera.
- **Reinicio al abrir.** El diálogo no se desmonta al cerrarse (se cierra el overlay), así que carga los
  valores cuando `abierto` pasa a `true`, no al montar. Incluye el registro en las dependencias, para
  que reabrir el mismo descarte lo que se escribió antes. No metas en las dependencias un objeto que el
  padre arma en cada render: el formulario se vaciaría con cada tecla.
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
  significa («Último día de captura») va como chip (`BadgeWithIcon`) en el `hint`, no como párrafo.
- **`Toggle` a ancho completo:** siempre `className={TOGGLE_ANCHO_COMPLETO}` si lleva `hint`; en una
  rejilla, que ocupe todas las columnas, o el hint parte en cinco renglones. En DPB el `Toggle`
  también va dentro de formularios que se guardan con «Guardar» (en el origen: cuenta activa,
  controlar techos). Es la excepción que `eecheverria-untitled-ui` admite a su regla general
  (toggle para efecto inmediato; checkbox si hay que guardar) cuando el proyecto la sigue de forma
  consistente: en una misma app, los sí/no de formulario son todos `Toggle`, sin mezclar con
  `Checkbox`.
- **Números:** `inputMode="numeric"` y no `type="number"`. Para montos, un campo que dé formato
  (en el origen, `InputMonto`).
- **Selects:** con una sola opción posible, elígela sola y no muestres el control. Mientras carga su
  lista, un `LoadingIndicator` chico con texto («Cargando sociedades…»); si falla, `MensajeError` en
  lugar del campo.
- **Listas dentro del cuerpo**, sin `max-h-*` propio salvo que haga falta: el cuerpo ya se desplaza, y
  dos áreas de scroll anidadas confunden.
- **Nada de modales anidados.** Una confirmación dentro de un diálogo va en la misma fila («Revertir a
  Q100.00» / «No») o en un panel bajo la lista, no en otro diálogo encima.

---

## Estados: carga, vacío, error y avisos

- **Modelo:** `Carga<T> = { status: "cargando" } | { status: "error"; error } | { status: "listo"; datos }`.
  Una unión discriminada, no tres booleanos que admiten combinaciones imposibles (cargando y con error a
  la vez).
- **`Esqueleto` o `LoadingIndicator`.** `Esqueleto` cuando el contenido tiene forma conocida (una tabla,
  las secciones de un detalle, el inicio): copia sus bloques y alturas para que la llegada de los datos
  no haga saltar la pantalla. `LoadingIndicator type="dot-circle"` cuando no hay forma que copiar: al
  restaurar la sesión (pantalla completa, con `label`) o en una carga chica dentro de algo que ya está
  (la lista de un `Select` en un diálogo, el resumen de una sección), con el texto al lado. En un botón,
  `isLoading`, no un spinner aparte.
- **Vacío con dos textos:** «no hay nada» y «nada coincide con la búsqueda». Con el mismo texto, quien
  filtró creería que el catálogo está vacío y volvería a importar sin necesidad. La acción primaria
  («Importar de SAP») solo en el vacío real; en el filtrado, el texto dice qué filtro quitar. Si el
  listado no puede estar vacío sin filtros (los usuarios, que ve un usuario), no hay rama «no hay nada».
- **Error en línea, con remedio.** `MensajeError` con `onReintentar`, o con un botón «Volver al listado»
  si el registro no existe.
- **Un error, un sitio.** Si un diálogo está abierto, el error va en él y la página no lo pinta: el mismo
  `role="alert"` se anunciaría dos veces y quedaría un error visible detrás del diálogo. Las escrituras
  sin diálogo propio, arriba del contenido de la página. El error de una confirmación va dentro de ella
  (en el origen, el 409 de «Consolidar» lista lo pendiente dentro del diálogo).
- **429:** el remedio dice que no se perdió nada y que hay que esperar y pulsar «Recargar».
- **Toasts solo para confirmar lo que el backend ya confirmó.** Un «se guardó» que resulta falso es peor
  que ningún aviso. Van arriba al centro: arriba a la derecha tapaban las acciones de la pantalla, y
  abajo a la derecha, el pie de los diálogos anchos. Duran 5 s y se pausan con el ratón encima. Los
  errores que hay que corregir no van en toast, porque se iría antes de que alguien lo lea y lo arregle.
  Tampoco las escrituras muy frecuentes (un autoguardado por fila serían decenas por sesión): ahí el
  acuse va en la propia fila. `notificar.error` queda para un aviso que no tiene dónde vivir en la
  pantalla (en el origen, que el backend terminó una simulación de rol a media sesión), una sola vez.
- **Avisos en cabeceras densas:** una píldora del color del aviso con su conteo, y el detalle en un
  popover (`AvisoDesplegable` del origen), antes que una caja entera que empuje la tabla hacia abajo.

---

## Badges de estado

Una tabla `ESTILO` por dominio, de estado a color y etiqueta. El `Record` sobre la unión de estados
hace que TypeScript exija cubrir un estado nuevo, y la etiqueta exportada sirve donde el estado va en
texto (un selector), con una sola fuente para las dos cosas.

```tsx
import { Badge } from "@/components/base/badges/badges";

type EstadoSolicitud = "BORRADOR" | "ENVIADA" | "EN_REVISION" | "APROBADA" | "DEVUELTA" | "ARCHIVADA";

const ESTILO: Record<EstadoSolicitud, { color: "gray" | "brand" | "warning" | "success" | "error" | "slate"; etiqueta: string }> = {
    BORRADOR: { color: "gray", etiqueta: "Borrador" },
    ENVIADA: { color: "brand", etiqueta: "Enviada" },
    EN_REVISION: { color: "warning", etiqueta: "En revisión" },
    APROBADA: { color: "success", etiqueta: "Aprobada" },
    DEVUELTA: { color: "error", etiqueta: "Devuelta" },
    ARCHIVADA: { color: "slate", etiqueta: "Archivada" },
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
  `error` para lo devuelto o rechazado, `brand` para lo enviado o en curso, `gray` para borrador o
  inactivo y `slate` para lo cerrado.
- **Etiquetas en español natural y en el género del sustantivo** («Aprobada por Finanzas», no `APROBADO`).
- **Si el backend calcula un estado efectivo** (uno que cambia por fecha sin que nadie escriba), pinta ese
  y no el de la columna.

---

## Botones

- **`secondary` domina.** En el origen hay unos 114 botones `secondary` contra un puñado de primarios:
  recargar, importar, exportar, ver, el Cancelar del pie y toda acción que no cierra el trabajo.
- **Primario por defecto** (sin `color`) para la acción que cierra el trabajo de su zona: «Nueva cuenta»,
  «Guardar cambios», «Revisar y enviar», «Aprobar». Normalmente uno por zona (cabecera, pie del diálogo,
  acción de sección) y al final del grupo, a la derecha.
- **`tertiary`:** los `ButtonUtility` de las filas y la × de diálogos y avisos.
- **`link-color`:** el enlace a la pantalla completa desde una tarjeta («Ver consolidado →») o un
  «Reintentar» en línea.
- **`link-gray`:** volver (`volverA`).
- **Destructivos:** `secondary-destructive` para el botón que abre un flujo destructivo (con borde, como
  los demás, y a la izquierda del grupo); `primary-destructive` solo para el botón que confirma dentro de
  `ConfirmarDialog`.
- **Pie del diálogo:** Cancelar (`secondary`) y después la confirmación, alineados a la derecha.
- **En móvil (bajo `sm`)**, los secundarios de la cabecera van solo con ícono: el texto en
  `<span className="hidden sm:inline">` y el nombre completo en `aria-label`. El primario conserva su
  texto. Con todos los textos, el primario se salía de la pantalla.
- **`onPress`, no `onClick`,** en `Button` y `ButtonUtility` del catálogo: son de React Aria y sus tipos
  marcan `onClick` como no recomendado (`onPress` unifica ratón, teclado y toque). El origen usa
  `onClick`; en apps nuevas, `onPress`.
- **Botones propios** (`AriaButton`, `<button>`) con `cursor-pointer` explícito. Los del catálogo ya lo
  traen.

---

## Gráficas

- **recharts**, compuesto en la propia feature, con `ChartTooltipContent` y `ChartLegendContent` de
  `components/application/charts/charts-base.tsx`. El catálogo free no trae gráficas armadas; solo esa
  base (`npx untitledui search chart`).
- **Color por `currentColor`:** `fill="currentColor"` con `className="text-chart-1"` en el `Bar` o el
  `Cell`, y `bg-chart-1` en el punto de una leyenda propia. El color sale del token y cambia solo en
  oscuro, donde `brand-dpb.css` sube un paso cada serie para conservar el contraste.
- **Rejilla y ejes con tokens:** `CartesianGrid vertical={false} stroke="currentColor"
  className="text-utility-neutral-100"`; ejes con `axisLine={false} tickLine={false} className="text-xs"`
  y `tick={{ fill: "var(--color-text-tertiary)" }}`; `Tooltip cursor={{ className: "fill-bg-secondary" }}`.
  Los segmentos apilados y las partes de una dona se separan con un trazo del color de la superficie
  (`stroke="var(--color-bg-primary)"`).
- **Leyenda siempre**, y el color nunca identifica solo: la dona del origen repite monto y porcentaje en
  su leyenda, y el total va en el centro.
- **Eje de meses en móvil:** `interval="preserveStartEnd"` con `minTickGap`; con `interval={0}` las doce
  etiquetas se enciman.
- **Accesibilidad:** el contenedor de la gráfica lleva `role="img"` y un `aria-label` que la resume y
  remite a la tabla; debajo, `<div className="sr-only"><table><caption>…</caption>…</table></div>` con
  los números. El `sr-only` va en el `div`, no en la tabla, y todo dentro de un contenedor `relative`.
- **Paleta:** dos series validadas con el script de `dataviz` en claro y oscuro (lightness, croma,
  separación para daltonismo y contraste contra la superficie): `--color-chart-1`, el azul de marca, y
  `--color-chart-2`, el naranja `#EB6834`. Dos tonos del mismo azul fallaban. **Al agregar una serie,
  revalida la paleta con la skill `dataviz`.** El naranja se eligió lejos del rojo DPB y de los colores
  de estado; una serie nueva tampoco debe confundirse con `error`, `warning`, `success` ni con `accent`.

---

## Marca

**Isotipo DPB o marca propia.** Por defecto, toda app interna lleva el isotipo DPB
(`src/brand/dpb-isotipo.tsx`) en el lockup (`src/brand/app-logo.tsx`): el nombre de la app en
`text-sm font-semibold text-primary` y «Desarrollos Palo Blanco» debajo, en `text-xs text-tertiary`. Una
marca propia solo si la app tiene un kit aprobado, como app-presupuestos (la línea de tendencia 13a de
«Portal de Finanzas»). Aun así, el lockup se compone con el texto en Open Sans y no con la tipografía del
kit, y la marca toma los colores de DPB (el rojo del 13a ya es `#CC1F37`).

**Variantes por fondo:**

- `color` sobre superficies claras: la sidebar y la columna de acceso. En modo oscuro, la sidebar sigue
  con `color`: la guía de marca (`dpbranding`) pide la versión a color sobre fondos oscuros neutros.
- `white` sobre el azul o el rojo de marca: el panel de acceso (`bg-brand-500`).
- `mono`, una sola tinta, para cuando no hay color.
- No rotes, no recolorees y no deformes.

> **Tamaño.** El contorno de la casa es fino (≈2 % del ancho del isotipo: a 30 px queda en ~0,6 px) y a
> 30 px o menos se ve muy delgado. No lo engroses: es una regla de marca, el dibujo no se cambia.
> Prefiere 32 px o más en el lockup; con la barra colapsada (72 px de ancho) cabe.

La app usa el componente inline, no el archivo: el SVG de `public/marca/` queda para el favicon y para
quien necesite el archivo suelto.

**Azul de acción.** `brand-500` = `#2C589A` y `accent-500` = `#CC1F37`, exactos, en `brand-dpb.css`.
`bg-brand-solid` (el botón primario) resuelve a `brand-600` (`#234B85`), no a `#2C589A`. Es lo esperado:
así reparte la rampa el tema de Untitled UI. No lo "corrijas" a 500. El `#2C589A` exacto sale en el anillo
de foco, en `border-brand` y donde pidas `bg-brand-500` (el panel de acceso). `text-brand-secondary`, el
de los enlaces, es `brand-700`.

**Acento.** La rampa `accent` es para acentos puntuales de marca (un antetítulo, un destacado), no para
acciones ni estados. Las acciones son azules, y `error`, `warning` y `success` se dejan intactos porque
son funcionales: si `error` fuera el rojo DPB, un exceso y un elemento de marca se verían iguales.

**Tipografía.** Open Sans 400/600/700 (`--font-body` y `--font-display`), cargada en `index.html` desde
Google Fonts.

**Retícula isométrica** (`src/brand/iso-pattern.tsx`). La textura del panel de marca, en `text-white/10`
y con `aria-hidden`. Es fondo, no marca: no la pongas en superficies de trabajo.

**Movimiento del logo.** Nada en bucle junto al trabajo, porque distrae. En la sidebar, como mucho una
entrada por sesión y un leve realce al pasar el ratón; en el panel de acceso puede flotar. Todo bajo
`motion-reduce`.

**La pestaña del navegador:** `<title>` «Nombre de la app — Palo Blanco» y
`<meta name="theme-color" content="#2C589A">`.

---

## Responsive

- **Rejillas `grid-cols-1` de base**, que suben con `sm:`, `lg:` y `xl:`.
- **Cabecera fija.** Bajo `sm` lleva menos relleno y no lleva subtítulo, y los secundarios van solo con
  ícono.
- **Selectores a todo el ancho en móvil:** a la mitad cortaban los nombres.
- **La sidebar no desaparece**, solo se colapsa a 72 px. Prueba a 440 px (Chrome en modo dispositivo):
  con la barra quedan ~330 px útiles y nada debe salirse del ancho.
- **Para cazar desbordes**, compara `main.scrollWidth` con `main.clientWidth` en la consola.
- **Cifras compactas en móvil** («Q 3.7M»), con el exacto en el `title`.
- El panel de marca del acceso se oculta bajo `lg`.

---

## Accesibilidad

- **Un solo `<h1>` por página**, el de `AppLayout`. Cada bloque es un `<section aria-labelledby>` con su
  `<h2>`; si el título visible sobraría, el `<h2>` va `sr-only`.
- **Filas y objetivos de 44 px o más** (`h-11`).
- **`cursor-pointer`** en botones propios y en filas con `href`.
- **Movimiento:** `motion-reduce:animate-none` en entradas y esqueletos, y `motion-reduce:transition-none`
  en los realces. Para quien activó «reducir movimiento» por vértigo, una pantalla que se desplaza en cada
  navegación es un síntoma, no un adorno.
- **El color nunca va solo:** badges con texto, ✓ y ○ en celdas, «Excede el techo por…» con ícono, una
  diferencia con signo y texto («+Q50.00», «sin cambio»), y el fondo con un punto para marcar un cambio.
- **Nombres accesibles con contexto:** el tooltip de cada `ButtonUtility` lleva el identificador del
  registro; el botón de la cuenta, el nombre del usuario.
- **Anuncios:** `aria-live="polite"` en la paginación, `role="status"` en vacíos, notas y esqueletos
  (`Esqueleto` anuncia su `etiqueta`), `role="alert"` en errores (uno a la vez) y
  `containerAriaLabel="Notificaciones"` en el `Toaster`.
- **El anillo de foco no se recorta:** un área con scroll que contiene enlaces o campos lleva holgura
  (`-mx-1 px-1` en la navegación, `py-1` en el cuerpo del diálogo).
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
  | `MultiSelect` | `showFooter={false}`. El placeholder «Search» de su buscador no tiene salida: se acepta si perder la búsqueda es peor |
  | `PaginationPageDefault` | `Paginacion` de la plantilla (dos `Button` del catálogo) |
  | `DateRangePicker` | dos `InputDate` encadenados con `minValue`/`maxValue` |
  | `DropZone` y los ítems de `file-upload` | `FileTrigger` + `Button` y una ficha propia |
  | `Toaster` de `sonner` | `containerAriaLabel="Notificaciones"` (por defecto, «Notifications») |
  | `not-found.tsx` del starter | `src/pages/no-encontrada.tsx` |

- **Antes de usar un componente nuevo del catálogo, busca su texto fijo.**
- **Fechas en `dd/mm/aaaa`** y montos con el formateador de la app, nunca con el de `Date` o con un
  `Intl` sin revisar (ver `trampas.md`).
