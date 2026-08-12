# Reglas de uso — Untitled UI React

Los tokens semánticos completos y los patrones de uso por familia de componente. Se consulta en el
Paso 4 del proceso de `eecheverria-untitled-ui`, antes de escribir código.

**El archivo local manda.** Los componentes viven en el repo del usuario: si la firma real difiere de
lo que hay aquí, gana el archivo del proyecto — ábrelo (`components/base/...`) en vez de adivinar.
Estos son los patrones idiomáticos, no un reemplazo de leer el código que ya tienes.

## Contenido

1. [Tokens de color](#tokens-de-color)
2. [Utilidades: cx y sortCx](#utilidades-cx-y-sortcx)
3. [Dark mode](#dark-mode)
4. [Iconos](#iconos)
5. [Patrones por familia](#patrones-por-familia)
6. [Tabla rápida de antipatrones](#tabla-rápida-de-antipatrones)

---

## Tokens de color

Cuatro escalas, cada una con su trabajo. La confusión más frecuente es usar `text-*` para iconos:
**`text-*` es para texto, `fg-*` para todo lo que no es texto.**

### `text-*` — texto

| Token | Cuándo | Reemplaza a |
| --- | --- | --- |
| `text-primary` | Títulos y texto principal | `text-gray-900` |
| `text-secondary` | Labels y encabezados de sección | `text-gray-700` |
| `text-secondary_hover` | Ese mismo texto en hover | — |
| `text-tertiary` | Párrafos y texto de apoyo | `text-gray-500` |
| `text-tertiary_hover` | Apoyo en hover | — |
| `text-quaternary` | Texto sutil, de bajo contraste | `text-gray-400` |
| `text-placeholder` | Placeholder de inputs | `placeholder-gray-400` |
| `text-white` | Blanco siempre, en ambos modos | `text-white` |
| `text-primary_on-brand` | Texto principal sobre fondo de marca sólido | — |
| `text-secondary_on-brand` · `text-tertiary_on-brand` · `text-quaternary_on-brand` | Jerarquía sobre fondo de marca | — |
| `text-brand-primary` | Títulos con color de marca | `text-blue-900` |
| `text-brand-secondary` | Texto de marca en botones y destacados | `text-blue-600` |
| `text-brand-secondary_hover` | Ese texto en hover | — |
| `text-brand-tertiary` · `text-brand-tertiary_alt` | Acentos de marca más claros | — |
| `text-error-primary` | Mensajes de error | `text-red-600` |
| `text-warning-primary` | Mensajes de advertencia | `text-amber-600` |
| `text-success-primary` | Mensajes de éxito | `text-green-600` |

### `fg-*` — elementos no textuales (iconos, indicadores)

| Token | Cuándo |
| --- | --- |
| `fg-primary` | Iconos de máximo contraste |
| `fg-secondary` · `fg-secondary_hover` | Iconos de alto contraste, con su hover |
| `fg-tertiary` · `fg-tertiary_hover` | Iconos de contraste medio |
| `fg-quaternary` · `fg-quaternary_hover` | Iconos de bajo contraste: ayuda, dentro de inputs y botones |
| `fg-white` | Blanco siempre |
| `fg-brand-primary` · `fg-brand-primary_alt` | Iconos de marca (`_alt` pasa a gris en dark) |
| `fg-brand-secondary` · `fg-brand-secondary_alt` | Acentos y flechas de marca |
| `fg-error-primary` · `fg-error-secondary` | Iconos de error (el secundario, en inputs y gráficas) |
| `fg-warning-primary` · `fg-warning-secondary` | Iconos de advertencia |
| `fg-success-primary` · `fg-success-secondary` | Iconos y puntos de éxito |

### `border-*` — bordes (también valen para `ring-` y `outline-`)

| Token | Cuándo | Reemplaza a |
| --- | --- | --- |
| `border-primary` | Alto contraste: inputs, botones, checkboxes | `border-gray-300` |
| `border-secondary` | Contraste medio — **el default más común** | `border-gray-200` |
| `border-secondary_alt` | Igual pero con transparencia alfa | — |
| `border-tertiary` | Divisores sutiles | `border-gray-100` |
| `border-brand` · `border-brand_alt` | Estado activo/seleccionado (`_alt` pasa a gris en dark) | `border-blue-500` |
| `border-error` · `border-error_subtle` | Campo inválido | `border-red-500` |

### `bg-*` — fondos

| Token | Cuándo | Reemplaza a |
| --- | --- | --- |
| `bg-primary` | Fondo base de layouts y tarjetas | `bg-white` |
| `bg-primary_alt` · `bg-primary_hover` | Variante que se invierte en dark · hover | — |
| `bg-primary-solid` | Fondo oscuro primario | — |
| `bg-secondary` | Secciones con contraste respecto al fondo base | `bg-gray-50` |
| `bg-secondary_alt` · `bg-secondary_hover` · `bg-secondary_subtle` | Variantes de la secundaria | — |
| `bg-tertiary` | Fondos de control (toggles) | `bg-gray-100` |
| `bg-quaternary` | Pistas de sliders y barras de progreso | `bg-gray-200` |
| `bg-active` | Ítem seleccionado en menús y navegación | `bg-gray-50` |
| `bg-overlay` | Velo detrás de modales | `bg-black/50` |
| `bg-brand-primary` · `bg-brand-primary_alt` | Fondo de marca suave (fondo de iconos check) | `bg-blue-50` |
| `bg-brand-secondary` | Fondo de marca secundario | `bg-blue-100` |
| `bg-brand-solid` · `bg-brand-solid_hover` | **Botón primario** y superficies de marca sólidas | `bg-blue-600` |
| `bg-brand-section` · `bg-brand-section_subtle` | Secciones oscuras de marca | — |
| `bg-error-primary` · `bg-error-secondary` | Fondo suave de error (alertas, iconos) | `bg-red-50` |
| `bg-error-solid` · `bg-error-solid_hover` | Botón destructivo sólido | `bg-red-600` |
| `bg-warning-primary` · `bg-warning-secondary` · `bg-warning-solid` · `bg-warning-solid_hover` | Advertencia | `bg-amber-*` |
| `bg-success-primary` · `bg-success-secondary` · `bg-success-solid` · `bg-success-solid_hover` | Éxito | `bg-green-*` |

Regla mnemotécnica: **`primary` es el fondo base, `solid` es el fondo intenso.** `bg-brand-primary`
es el azul clarito de un fondo de icono; `bg-brand-solid` es el azul fuerte del botón.

## Utilidades: `cx` y `sortCx`

```typescript
import { cx } from "@/utils/cx";

// ✅ cx envuelve tailwind-merge: la clase que llega por props gana sobre la del componente
<div className={cx("rounded-lg bg-primary p-4", isActive && "bg-active", className)} />

// ❌ template string: las clases se pelean y gana la del CSS, no la intención
<div className={`rounded-lg bg-primary p-4 ${isActive ? "bg-active" : ""} ${className}`} />
```

Para variantes, agrúpalas con `sortCx` en vez de encadenar ternarios en el JSX:

```typescript
import { sortCx } from "@/utils/cx";

export const styles = sortCx({
    common: { root: "inline-flex items-center gap-2 rounded-lg font-semibold" },
    sizes: {
        sm: { root: "px-3 py-2 text-sm" },
        md: { root: "px-3.5 py-2.5 text-sm" },
    },
    colors: {
        primary: { root: "bg-brand-solid text-white hover:bg-brand-solid_hover" },
        secondary: { root: "bg-primary text-secondary border border-primary" },
    },
});
```

## Dark mode

No se usa el prefijo `dark:` de Tailwind. El sistema declara la variante en `globals.css`:

```css
@custom-variant dark (&:where(.dark-mode, .dark-mode *));
```

Basta con poner la clase `dark-mode` en un contenedor (normalmente `<html>`) y **los tokens se
invierten solos**:

```jsx
// ✅ funciona en ambos modos sin escribir nada más
<div className="bg-primary text-primary border border-secondary">…</div>

// ❌ si necesitas esto, es que usaste un color genérico antes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">…</div>
```

El toggle: `document.documentElement.classList.toggle("dark-mode")` con persistencia en
`localStorage`, o `useTheme` de `next-themes` en Next.js. Como la clase se puede poner en **cualquier**
contenedor, también sirve para tener una sección oscura dentro de una página clara.

## Iconos

```bash
npm install @untitledui/icons
npx untitledui@latest search "flecha" --type icons --limit 10
```

```typescript
import { Check, Trash02, Mail01 } from "@untitledui/icons";   // ✅ named import (tree-shakeable)

<Button iconLeading={Check}>Guardar</Button>                  // ✅ referencia del componente
<Button iconLeading={<Check data-icon className="size-4" />}>Guardar</Button> // ✅ JSX con data-icon
<Button iconLeading={<Check className="size-4" />}>Guardar</Button>           // ❌ pierde los estilos del slot
<Home01 className="size-5 text-brand-secondary" aria-hidden="true" />         // ✅ suelto en el JSX
```

Cuando pasas un icono como prop, **pasa la referencia** (`iconLeading={Check}`) y deja que el
componente lo dimensione. Solo usa JSX si necesitas personalizarlo, y entonces márcalo con
`data-icon` para que el componente lo reconozca como su icono.

## Patrones por familia

### Button

```typescript
import { Button } from "@/components/base/buttons/button";
```

`size`: `xs | sm | md | lg | xl` (default `sm`) · `color`: `primary | secondary | tertiary |
link-gray | link-color | primary-destructive | secondary-destructive | tertiary-destructive |
link-destructive` · `iconLeading` · `iconTrailing` · `isDisabled` · `isLoading` ·
`showTextWhileLoading` · `href`.

```tsx
<Button size="md">Guardar</Button>
<Button color="primary" iconLeading={Check}>Guardar</Button>
<Button isLoading showTextWhileLoading>Enviando…</Button>
<Button color="primary-destructive" iconLeading={Trash02}>Eliminar</Button>

// Enlaces: son Button con href y color link-*
<Button href="/dashboard" color="link-color">Ver panel</Button>
<Button href="https://ejemplo.com" color="link-color" iconTrailing={ExternalLink01}>Sitio</Button>
```

### Input, InputGroup y Textarea

```typescript
import { Input } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
```

`size`: `sm | md | lg` · `label` · `placeholder` · `hint` · `tooltip` · `icon` · `isRequired` ·
`isDisabled` · `isInvalid`.

```tsx
<Input label="Correo" placeholder="olivia@untitledui.com" />

<Input
    icon={Mail01}
    label="Correo"
    isRequired
    isInvalid
    hint="Ingresa un correo válido"
/>

<InputGroup label="Sitio web" trailingAddon={<Button>Copiar</Button>}>
    <InputBase placeholder="www.untitledui.com" />
</InputGroup>
```

El mensaje de error va en **`hint` con `isInvalid`**, nunca en un `<p className="text-error-primary">`
aparte: el componente lo asocia al campo para lectores de pantalla.

### Select, ComboBox y MultiSelect

```typescript
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
```

Props del select: `size` · `label` · `placeholder` · `hint` · `items` · `icon` · `isRequired` ·
`isDisabled`. Props del ítem: `id` · `supportingText` · `icon` · `avatarUrl` · `isDisabled`.

```tsx
<Select label="Responsable" placeholder="Selecciona" items={usuarios}>
    {(item) => (
        <Select.Item id={item.id} supportingText={item.email}>
            {item.name}
        </Select.Item>
    )}
</Select>

// Con búsqueda
<Select.ComboBox label="Buscar" placeholder="Busca un usuario" items={usuarios}>
    {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
</Select.ComboBox>

// Con avatar y texto de apoyo
<Select items={usuarios} icon={User01}>
    {(item) => (
        <Select.Item avatarUrl={item.avatar} supportingText={item.role}>
            {item.name}
        </Select.Item>
    )}
</Select>
```

El render prop sobre `items` es el patrón previsto de React Aria — evita mapear a mano con `.map()`,
porque pierdes el manejo de colección (teclado, tipeo para buscar, virtualización).

### Checkbox, Radio y Toggle

```typescript
import { Checkbox } from "@/components/base/checkbox/checkbox";
```

`size`: `sm | md` · `label` · `hint` · `isSelected` · `isDisabled` · `isIndeterminate`.

```tsx
<Checkbox label="Recordarme" />
<Checkbox label="Recordarme" hint="Guardar mis datos para la próxima vez" />
<Checkbox isSelected={checked} onChange={setChecked} />   // onChange recibe el VALOR, no el evento
```

`isIndeterminate` es lo correcto para el checkbox de "seleccionar todo" de una tabla cuando hay
selección parcial. Los toggles son para cambios de efecto inmediato; si el cambio requiere "Guardar",
usa checkbox.

### Badge, Avatar y FeaturedIcon

```typescript
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
```

```tsx
<Badge color="brand" size="md">Nuevo</Badge>
<BadgeWithDot color="success" type="pill-color">Activo</BadgeWithDot>
<BadgeWithIcon iconLeading={ArrowUp} color="success">12%</BadgeWithIcon>

<Avatar src="/avatar.jpg" alt="Olivia Rhye" size="md" />
<Avatar src="/avatar.jpg" status="online" />
<Avatar initials="OR" size="lg" />
<AvatarLabelGroup src="/avatar.jpg" title="Olivia Rhye" subtitle="olivia@untitledui.com" size="md" />

<FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
<FeaturedIcon icon={AlertTriangle} color="warning" theme="gradient" size="xl" />
<FeaturedIcon icon={Settings01} color="gray" theme="modern" size="lg" />  // modern: solo color gray
```

Badge tiene `type`: `pill-color | color | modern`, y colores semánticos (`gray`, `brand`, `error`,
`warning`, `success`) más una paleta decorativa (`blue`, `purple`, `pink`, `orange`…). Para **estado**
usa los semánticos; los decorativos son para categorías sin significado de estado.

`Avatar` con `initials` es el fallback correcto cuando no hay foto — no pongas una imagen genérica.

### Modal

```typescript
import { Modal } from "@/components/application/modals/modal";
```

```tsx
<Modal isOpen={isOpen} onClose={close}>
    <Modal.Overlay />
    <Modal.Dialog>
        <FeaturedIcon icon={Trash02} color="error" theme="light" size="lg" />
        <h2 className="text-lg font-semibold text-primary">Eliminar cliente</h2>
        <p className="text-sm text-tertiary">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
            <Button color="secondary" onClick={close}>Cancelar</Button>
            <Button color="primary-destructive" isLoading={isDeleting}>Eliminar</Button>
        </div>
    </Modal.Dialog>
</Modal>
```

React Aria ya se encarga del focus trap, del `Escape` y del scroll del fondo: no los reimplementes.
Para acciones destructivas, la receta es `FeaturedIcon color="error"` + botón
`primary-destructive`, y el botón seguro (Cancelar) a la izquierda.

### Table

```typescript
import { Table, TableCard } from "@/components/application/table/table";
```

```tsx
<Table sortDescriptor={sort} onSortChange={setSort} selectionMode="multiple">
    <Table.Header>
        <Table.Column key="name" allowsSorting>Nombre</Table.Column>
        <Table.Column key="email">Correo</Table.Column>
    </Table.Header>
    <Table.Body items={data}>
        {(item) => (
            <Table.Row key={item.id}>
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.email}</Table.Cell>
            </Table.Row>
        )}
    </Table.Body>
</Table>
```

El ordenamiento es **controlado**: `sortDescriptor` + `onSortChange` — la tabla no ordena los datos
sola, tú decides si reordenas en cliente o pides al backend. Cuando `items` viene vacío, no dejes la
tabla desnuda: renderiza `empty-states`.

### Tabs

```typescript
import { Tabs } from "@/components/application/tabs/tabs";
```

```tsx
<Tabs defaultSelectedKey="perfil">
    <Tabs.List>
        <Tabs.Tab key="perfil">Perfil</Tabs.Tab>
        <Tabs.Tab key="seguridad">Seguridad</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel key="perfil">…</Tabs.Panel>
    <Tabs.Panel key="seguridad">…</Tabs.Panel>
</Tabs>
```

Las `key` conectan tab y panel — no uses índices. Si el estado de la pestaña debe sobrevivir a un
refresh o compartirse por URL, controla `selectedKey`/`onSelectionChange` contra el router.

### Pagination

```typescript
import { Pagination } from "@/components/application/pagination/pagination";
```

```tsx
<Pagination total={total} pageSize={20} currentPage={page} onChange={setPage}>
    <Pagination.PrevButton />
    <Pagination.Items />
    <Pagination.NextButton />
</Pagination>
```

`total` es el total de **registros**, no de páginas. Con datos del servidor, ese número viene del
backend — ver la sección de paginación de `eecheverria-api-design`.

### DatePicker

```typescript
import { DatePicker } from "@/components/application/date-picker/date-picker";
```

```tsx
<DatePicker label="Fecha de nacimiento" value={date} onChange={setDate} maxValue={hoy}>
    <DatePicker.Input />
    <DatePicker.Calendar />
</DatePicker>
```

Usa `minValue`/`maxValue` para acotar en vez de validar después: evita que el usuario elija algo que
vas a rechazar.

### Estados de carga, vacío y error

No los improvises; el catálogo los tiene y así quedan consistentes en toda la app:

- **Cargando** → `loading-indicators` (o `isLoading` del propio botón/tabla).
- **Vacío** → `empty-states`, con `FeaturedIcon`, texto explicativo y una acción primaria.
- **Error de la operación** → `alerts` si es dentro de la página; `notifications` si es un toast.
- **Campo inválido** → `isInvalid` + `hint` del propio input, no un mensaje suelto.

## Tabla rápida de antipatrones

| ❌ | ✅ | Por qué |
| --- | --- | --- |
| `className="bg-blue-600"` | `className="bg-brand-solid"` | Sigue el color de marca y el dark mode |
| `className="text-gray-400"` en un icono | `className="fg-quaternary"` | `fg-*` es la escala de no-texto |
| `dark:bg-gray-900` | Nada: los tokens se invierten solos | El sistema ya lo resuelve |
| `<button disabled>` | `<Button isDisabled>` | La prop HTML no hace nada aquí |
| `import { Button } from "react-aria-components"` | `import { Button as AriaButton } …` | Colisiona con el componente del sistema |
| `DatePicker.tsx` | `date-picker.tsx` | Convención kebab-case del sistema |
| `` className={`a ${b}`} `` | `cx("a", b)` | `tailwind-merge` resuelve los conflictos |
| `<a className="text-blue-600">` | `<Button href color="link-color">` | Estilo, foco y estados del sistema |
| `items.map(...)` dentro de `Select` | render prop sobre `items` | Conserva teclado y manejo de colección |
| `<Check className="size-4" />` como prop | `iconLeading={Check}` o JSX con `data-icon` | El slot necesita reconocer el icono |
| Escribir una tabla a mano | `npx untitledui add tables` | Ordenamiento, selección y accesibilidad gratis |
