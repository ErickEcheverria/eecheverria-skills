# Catálogo de componentes — Untitled UI React

Índice para **mapear una intención a un componente** sin abrir el navegador. Se usa en el Paso 2 del
proceso de `eecheverria-untitled-ui`: primero `npx untitledui@latest search "<intención>"`, luego
este archivo, luego la doc del componente.

## Contenido

1. [Cómo leer estas tablas](#cómo-leer-estas-tablas)
2. [Base — piezas atómicas](#base--piezas-atómicas)
3. [Foundations — iconos y marcas](#foundations--iconos-y-marcas)
4. [Application UI — piezas de producto](#application-ui--piezas-de-producto)
5. [Páginas y secciones compartidas](#páginas-y-secciones-compartidas)
6. [Marketing — secciones de sitio](#marketing--secciones-de-sitio)
7. [Ejemplos de páginas completas (PRO)](#ejemplos-de-páginas-completas-pro)
8. [Recetas: intención compuesta → piezas](#recetas-intención-compuesta--piezas)
9. [Rutas de import](#rutas-de-import)

---

## Cómo leer estas tablas

- **Slug** — el de la **URL de docs**: `https://www.untitledui.com/react/components/<slug>`, salvo en
  Marketing, que usa `https://www.untitledui.com/react/marketing/<slug>`.

- **⚠️ El slug del CLI suele ser SINGULAR aunque la URL sea plural.** `/components/buttons` se
  instala con `add button`; `/components/filter-bars` con `add filter-bar`; `/components/tables` con
  `add table`. Si `add <slug>` no encuentra nada, **prueba el singular**, corre
  `npx untitledui@latest add` sin argumentos (lista interactiva) o
  `npx untitledui@latest search "<intención>"`. No inventes el slug: confírmalo.

- **Tier** — *indicativo*, no autoridad:
  - `free ✔` — confirmado en el repo open-source (`github.com/untitleduico/react`), MIT. Es la marca
    más confiable de este catálogo.
  - `free?` — la web lo lista como open-source pero no aparece en el repo público. Confírmalo con el
    CLI antes de prometerlo.
  - `PRO` — requiere licencia.

**Ojo con el botón "Get PRO" de la web:** aparece en páginas de componentes que **sí** están en el
repo open-source (`empty-states`, por ejemplo). Es un upsell del set completo de variantes, no prueba
de que el componente base sea de pago. **La única señal fiable es en runtime: si
`npx untitledui@latest add <x>` pide `login`, ese componente es PRO.**

Este catálogo es un mapa, no la fuente de verdad. La autoridad es el CLI y la doc oficial; puede
quedar desfasado cuando Untitled UI publique componentes nuevos.

---

## Base — piezas atómicas

| Componente | Slug | Úsalo para | Tier |
| --- | --- | --- | --- |
| Buttons | `buttons` | Toda acción: primaria, secundaria, terciaria, destructiva y enlaces (`link-*`) | free ✔ |
| Button groups | `button-groups` | Acciones agrupadas o selector segmentado | free ✔ |
| Social buttons | `social-buttons` | Login con Google/Apple/GitHub | free? |
| Utility buttons | `utility-buttons` | Botones de icono en toolbars y cabeceras de tabla | free? |
| Mobile app store buttons | `mobile-app-store-buttons` | Badges de App Store / Google Play | free? |
| Inputs | `inputs` | Campos de texto con label, hint, icono y estado de error | free ✔ |
| Textareas | `textareas` | Texto largo (descripciones, comentarios) | free ✔ |
| Select | `select` | Elegir uno de una lista; incluye `Select.ComboBox` con búsqueda | free ✔ |
| Multi select | `multi-select` | Elegir varios, con chips | free ✔ |
| Checkboxes | `checkboxes` | Booleano por ítem; soporta indeterminado | free ✔ |
| Radio buttons | `radio-buttons` | Una opción entre pocas | free ✔ |
| Radio groups | `radio-groups` | Tarjetas de opción (planes, métodos de pago) | free? |
| Toggles | `toggles` | Encender/apagar con efecto inmediato | free ✔ |
| Sliders | `sliders` | Rango numérico continuo | free ✔ |
| Tags | `tags` | Etiquetas removibles de entrada | free ✔ |
| Badges | `badges` | Estado o categoría de solo lectura (`Badge`, `BadgeWithDot`, `BadgeWithIcon`) | free ✔ |
| Badge groups | `badge-groups` | Badge + texto como anuncio o pill de novedad | free? |
| Avatars | `avatars` | Foto/iniciales de usuario, con estado y `AvatarLabelGroup` | free ✔ |
| Dropdowns | `dropdowns` | Menú de acciones colgado de un botón | free ✔ |
| Context menus | `context-menus` | Menú por clic derecho | free? |
| Tooltips | `tooltips` | Explicación corta al enfocar/hover | free ✔ |
| Progress indicators | `progress-indicators` | Barra o círculo de avance determinado | free ✔ |
| Featured icons | `featured-icons` | Icono destacado en modales, empty states y alertas | free ✔ |
| Verification code inputs | `verification-code-inputs` | OTP / código de verificación | free? |
| Text editors | `text-editors` | Editor rich text | free? |
| Credit cards | `credit-cards` | Representación visual de tarjeta | free? |
| QR codes | `qr-codes` | Generar/mostrar QR | free? |
| Video players | `video-players` | Reproductor embebido | free? |
| Illustrations | `illustrations` | Ilustraciones para vacíos y onboarding | free? |
| Rating badge and stars | `rating-badge-and-stars` | Calificaciones con estrellas | free ✔ |

## Foundations — iconos y marcas

Viven en `components/foundations/`. No siempre tienen página propia de docs; se traen con el CLI o ya
vienen con el `init`.

| Pieza | Úsalo para | Tier |
| --- | --- | --- |
| `featured-icon` | El icono en círculo/cuadro de modales, alertas y empty states | free ✔ |
| `logo` | Logo del producto en navegación y auth | free ✔ |
| `social-icons` | Iconos de redes en footers | free ✔ |
| `payment-icons` | Visa/Mastercard/Amex en checkout y facturación | free ✔ |
| `integration-icons` | Logos de integraciones (Slack, Notion…) | free ✔ |
| `rating-stars` / `rating-badge` | Estrellas y badge de calificación | free ✔ |
| `dot-icon`, `play-button-icon` | Indicadores y play de video | free ✔ |

Los **iconos de UI** no están aquí: son el paquete `@untitledui/icons`
(`npm i @untitledui/icons`, búsqueda con `npx untitledui@latest search "<algo>" --type icons`).

## Application UI — piezas de producto

Lo que más vas a usar en paneles administrativos, CRUD y sistemas con roles.

| Componente | Slug | Úsalo para | Tier |
| --- | --- | --- | --- |
| Tables | `tables` | Listados de registros: ordenamiento, selección, acciones por fila | free ✔ |
| Paginations | `pagination` | Paginar listados y tablas | free ✔ |
| Filter bars | `filter-bars` (CLI: `filter-bar`) | Búsqueda y filtros sobre un listado | free? |
| Empty states | `empty-states` | "Sin resultados", "aún no hay nada", primer uso | free ✔ |
| Loading indicators | `loading-indicators` | Spinners y estados de carga | free ✔ |
| Modals | `modals` | Confirmaciones, formularios cortos, acciones destructivas | free ✔ |
| Slideout menus | `slideout-menus` | Paneles laterales: detalle, edición, filtros avanzados | free ✔ |
| Tabs | `tabs` | Seccionar una vista (perfil, seguridad, notificaciones) | free ✔ |
| Sidebar navigations | `sidebar-navigations` | Navegación principal de una app | free ✔ |
| Header navigations | `header-navigations` | Barra superior de la app | free ✔ |
| Breadcrumbs | `breadcrumbs` | Ubicación en jerarquías profundas | free? |
| Page headers | `page-headers` | Título de página + acciones primarias | free? |
| Section headers | `section-headers` | Encabezado de bloque dentro de una página | free? |
| Section footers | `section-footers` | Pie de bloque con acciones (guardar/cancelar) | free? |
| Card headers | `card-headers` | Encabezado de tarjeta con acciones | free? |
| Content dividers | `content-dividers` | Separadores con o sin texto | free? |
| Alerts | `alerts` | Mensajes de éxito/error/aviso en la página | free? |
| Notifications | `notifications` | Toasts y notificaciones flotantes | free? |
| Inline CTAs | `inline-ctas` | Llamada a la acción dentro de la app (upgrade, invitar) | free? |
| Metrics | `metrics` | Tarjetas de KPI con variación | free? |
| Line & bar charts | `line-bar-charts` | Series temporales y comparaciones | free ✔ |
| Pie charts | `pie-charts` | Composición de un total | free ✔ |
| Radar charts | `radar-charts` | Comparación multivariable | free ✔ |
| Activity gauges | `activity-gauges` | Progreso circular tipo anillo | free? |
| Activity feeds | `activity-feeds` | Historial/timeline de eventos | free? |
| Progress steps | `progress-steps` | Wizards y procesos por pasos | free? |
| Date pickers | `date-pickers` | Fecha y rango de fechas | free ✔ |
| Calendars | `calendars` | Vista de calendario | free? |
| File uploaders | `file-uploaders` | Subida con drag & drop y progreso | free ✔ |
| Image pickers | `image-pickers` | Selección/recorte de imagen (avatar, portada) | free? |
| Color pickers | `color-pickers` | Selección de color | free? |
| Gradient pickers | `gradient-pickers` | Selección de degradado | free? |
| Command menus | `command-menus` | Paleta de comandos (⌘K) | free? |
| Tree views | `tree-views` | Jerarquías: carpetas, categorías, permisos | free? |
| Messaging | `messaging` | Chat y mensajería | free? |
| Carousels | `carousels` | Carrusel de contenido | free ✔ |
| Code snippets | `code-snippets` | Bloques de código con copiar | free? |

## Páginas y secciones compartidas

| Componente | Slug | Úsalo para | Tier |
| --- | --- | --- | --- |
| Log in pages | `log-in-pages` | Pantalla de inicio de sesión | free? |
| Sign up pages | `sign-up-pages` | Registro | free? |
| Forgot password pages | `forgot-password-pages` | Recuperación de contraseña | free? |
| Verification pages | `verification-pages` | Verificación por código/email | free? |
| 404 sections | `404-sections` | Página o bloque de no encontrado | free? |
| Email templates | `email-templates` | Correos transaccionales | free? |

## Marketing — secciones de sitio

URL: `https://www.untitledui.com/react/marketing/<slug>`. Menos relevantes para proyectos
administrativos, pero disponibles para landings y sitios públicos.

| Sección | Slug | Úsala para |
| --- | --- | --- |
| Hero header sections | `hero-header-sections` | Bloque principal de una landing |
| Header sections | `header-sections` | Encabezados de sección de sitio |
| Header navigations | `header-navigations` | Navegación del sitio público |
| Features sections | `features-sections` | Beneficios y funcionalidades |
| Pricing sections | `pricing-sections` | Planes y precios |
| CTA sections | `cta-sections` | Llamada a la acción |
| Newsletter CTA sections | `newsletter-cta-sections` | Captura de correo |
| Social proof sections | `social-proof-sections` | Logos de clientes |
| Testimonial sections | `testimonial-sections` | Testimonios |
| Metrics sections | `metrics-sections` | Cifras destacadas |
| FAQ sections | `faq-sections` | Preguntas frecuentes |
| Blog sections | `blog-sections` | Listados de artículos |
| Content & rich text sections | `content-rich-text-sections` | Contenido largo y legal |
| Team sections | `team-sections` | Equipo |
| Careers sections | `careers-sections` | Vacantes |
| Contact sections | `contact-sections` | Formularios de contacto |
| Banners | `banners` | Avisos superiores del sitio |
| Footers | `footers` | Pie de sitio |

Todas se listan como open-source; confirma con el CLI antes de prometer una en particular.

## Ejemplos de páginas completas (PRO)

Páginas armadas de punta a punta. **Requieren licencia PRO** — se traen con
`npx untitledui@latest example <slug>` tras `login`.

| Ejemplo | Slug | Qué es |
| --- | --- | --- |
| Dashboards 01 / 02 | `dashboards`, `dashboards-02` | 40 páginas de dashboard |
| Settings pages 01 / 02 | `settings-pages`, `settings-pages-02` | 40 páginas de configuración |
| Informational pages 01 / 02 | `informational-pages`, `informational-pages-02` | 40 páginas informativas |
| Landing / pricing / about / blog / contact / FAQ / team / 404 pages | `landing-pages`, `pricing-pages`, … | Páginas de marketing completas |

**Cómo tratarlos:** no los propongas como si fueran gratis. Di que son PRO y **arma la alternativa
free** — un dashboard se reconstruye con `metrics` + `line-bar-charts` + `tables` +
`sidebar-navigations` + `page-headers`.

## Recetas: intención compuesta → piezas

Los pedidos reales casi nunca son un componente. Descomponer es la mitad del trabajo.

| El usuario pide… | Piezas |
| --- | --- |
| "Listado de usuarios con búsqueda, filtros y paginación" | `tables` + `filter-bars` + `pagination` + `empty-states` + `avatars` + `badges` |
| "Modal para confirmar que se elimina un registro" | `modals` + `featured-icons` (color `error`) + `buttons` (`primary-destructive`) |
| "Formulario de alta de cliente" | `inputs` + `select` + `textareas` + `checkboxes` + `buttons` + `alerts` |
| "Panel de administración con menú lateral" | `sidebar-navigations` + `header-navigations` + `page-headers` + `breadcrumbs` |
| "Pantalla de configuración con secciones" | `tabs` + `section-headers` + `toggles` + `section-footers` |
| "Dashboard de métricas" | `metrics` + `line-bar-charts` + `pie-charts` + `date-pickers` + `tables` |
| "Login del sistema" | `log-in-pages` o `inputs` + `checkboxes` + `buttons` + `social-buttons` + `logo` |
| "Wizard de varios pasos" | `progress-steps` + `inputs` + `buttons` + `section-footers` |
| "Detalle de un registro sin salir del listado" | `slideout-menus` + `tabs` + `badges` + `activity-feeds` |
| "Subir un archivo con progreso" | `file-uploaders` + `progress-indicators` + `alerts` |
| "Aviso de éxito tras guardar" | `notifications` (flotante) o `alerts` (en la página) |
| "Cargando y sin resultados" | `loading-indicators` + `empty-states` + `illustrations` |

## Rutas de import

El CLI escribe los archivos bajo `components/` y resuelve el alias del proyecto (normalmente `@/`):

```
src/
├── components/
│   ├── base/           # buttons, input, select, checkbox, avatar, badges, tooltip…
│   ├── application/    # table, modals, tabs, pagination, date-picker, charts…
│   ├── foundations/    # featured-icon, logo, social-icons, payment-icons…
│   ├── marketing/      # secciones de sitio
│   └── shared-assets/  # ilustraciones y assets
├── hooks/              # use-breakpoint, use-clipboard…
├── styles/             # globals.css, theme.css
└── utils/              # cx.ts, is-react-component.ts
```

Ejemplos de import reales:

```typescript
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

import { Modal } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Pagination } from "@/components/application/pagination/pagination";
import { DatePicker } from "@/components/application/date-picker/date-picker";

import { cx } from "@/utils/cx";
```

La ruta llega hasta el **archivo**, no hasta la carpeta: `…/modals/modal`, no `…/modals`.

Los archivos son **kebab-case** y el nombre del directorio no siempre coincide con el slug del CLI
(`add tables` deja `components/application/table/`). Cuando dudes de una ruta, ábrela en el proyecto
en vez de adivinar: el código ya está ahí.
