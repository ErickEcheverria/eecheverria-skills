---
name: eecheverria-frontend-react
description: Construye UI de calidad de producción en React (React + Tailwind) — arquitectura de componentes, gestión de estado, adherencia a un design system con estética minimalista (anti "AI aesthetic"), accesibilidad WCAG 2.1 AA, responsive mobile-first y estados de vacío/carga/error. Actívate SIEMPRE que el usuario trabaje frontend en un proyecto React y diga frases como "crea un componente en React", "hazme un formulario", "una tabla", "un dashboard", "una vista/página", "un modal", "mejora la accesibilidad", "agrega estados de carga/error", "esto se ve muy 'de IA'", "aplica el design system", o "hazlo responsive". Es la capa de INGENIERÍA DE UI para proyectos React y complementa a la capa base eecheverria-senior-dev (delega en ella la disciplina de sesión y en eecheverria-clean-code la calidad transversal). Si dudas entre activarla en un contexto de frontend React, actívala.
---

# eecheverria-frontend-react

## Objetivo

Construir interfaces de calidad de producción en **React + Tailwind**: accesibles, responsivas y visualmente pulidas. La meta es que la UI parezca hecha por un ingeniero senior con criterio de diseño en una empresa top — **no** que parezca generada por una IA. Eso significa adherencia real a un design system, accesibilidad correcta, patrones de interacción pensados y cero "estética de IA".

El stack de frontend del usuario es **React**. Esta skill absorbe tanto la ingeniería de UI como el criterio de design system / estética minimalista.

## Skill viva — no te auto-edites

Documento vivo del usuario (eecheverria@paloblanco.com). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- Construir componentes o páginas nuevas en React
- Modificar interfaces existentes de cara al usuario
- Implementar layouts responsivos
- Agregar interactividad o gestión de estado
- Corregir problemas visuales o de UX
- Cuando la salida deba verse de producción, no "de IA"

Antes de tocar nada, sigue la disciplina de `eecheverria-senior-dev`: ubícate en el proyecto y lee su `CLAUDE.md` para conocer su design system, tokens y convenciones. Para refactors y limpieza, apóyate en `eecheverria-clean-code`. Para commits, en `eecheverria-git-workflow`.

## Arquitectura de componentes

### Estructura de archivos (colocation)

Coloca junto todo lo relacionado con un componente. El porqué: cuando el código de un componente, sus tipos y su estado viven en la misma carpeta, mover, borrar o entender el componente es una operación local, no una cacería por todo el repo.

```
src/components/
  TaskList/
    TaskList.tsx          # Implementación del componente
    TaskList.test.tsx     # Tests
    use-task-list.ts      # Hook propio (si el estado es complejo)
    types.ts              # Tipos propios del componente (si hacen falta)
    index.ts              # Reexporta la API pública de la carpeta
```

### Composición > configuración

El porqué: un componente configurado por props (`variant`, `padding`, `content`) crece hasta volverse un monstruo de condicionales. La composición deja que el consumidor arme lo que necesita con piezas pequeñas, y cada pieza sigue siendo simple.

```tsx
// BIEN: componible
<Card>
  <CardHeader>
    <CardTitle>Tareas</CardTitle>
  </CardHeader>
  <CardBody>
    <TaskList tasks={tasks} />
  </CardBody>
</Card>

// MAL: sobre-configurado
<Card
  title="Tareas"
  headerVariant="large"
  bodyPadding="md"
  content={<TaskList tasks={tasks} />}
/>
```

### Componentes enfocados

El porqué: un componente que hace una sola cosa se lee, se prueba y se reutiliza sin sorpresas. Si supera ~200 líneas o mezcla varias responsabilidades, divídelo.

```tsx
// BIEN: hace una sola cosa
export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 p-3">
      <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />
      <span className={task.done ? "line-through text-muted" : ""}>{task.title}</span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
        <TrashIcon />
      </Button>
    </li>
  );
}
```

### Separa datos de presentación (container / presentation)

El porqué: el componente de presentación se vuelve trivial de probar (recibe props, pinta) y reutilizable en cualquier contexto; el contenedor concentra la lógica de datos y los estados. Esta frontera es la que hace mantenible una vista.

```tsx
// Contenedor: maneja los datos y los estados
export function TaskListContainer() {
  const { tasks, isLoading, error, refetch } = useTasks();
  const toggle = useToggleTask();
  const remove = useDeleteTask();

  if (isLoading) return <TaskListSkeleton />;
  if (error) return <ErrorState message="No se pudieron cargar las tareas" onRetry={refetch} />;
  if (tasks.length === 0) return <EmptyState message="Aún no tienes tareas" />;

  return <TaskList tasks={tasks} onToggle={toggle.mutate} onDelete={remove.mutate} />;
}

// Presentación: solo pinta. Recibe los handlers y los reenvía a cada item,
// que los declara como obligatorios (TaskItemProps) — nada queda sin tipar.
type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  return (
    <ul role="list" className="divide-y">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
```

### Props tipadas (cero `any`)

El porqué: en React casi todo bug de UI es un dato con una forma que no esperabas. Un tipo en la
frontera del componente lo caza en compilación, no en runtime frente al usuario.

- Declara un `type` explícito para las props de cada componente; nada de `any` ni props implícitas.
- Modela los estados mutuamente excluyentes con **uniones discriminadas**, no con banderas booleanas
  sueltas que permiten combinaciones imposibles.
- Deriva los tipos del contrato de la API (ver `eecheverria-api-design`) en vez de redefinirlos a mano.

```tsx
// MAL: banderas que permiten estados imposibles (isLoading && error a la vez)
type Props = { isLoading: boolean; error?: string; data?: Task[] };

// BIEN: unión discriminada — el estado es uno y solo uno
type TaskListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tasks: Task[] };
```

## Gestión de estado

Elige el enfoque **más simple** que resuelva el problema. El porqué: cada nivel de estado que subes (local → global) agrega acoplamiento y superficie de bugs; subir de más es una deuda que se paga en cada cambio.

```
Estado local (useState)              → Estado de UI propio de un componente
Estado elevado (lifted)              → Compartido entre 2-3 hermanos
Context                              → Tema, auth, locale (mucha lectura, poca escritura)
Estado en la URL (searchParams)      → Filtros, paginación, estado compartible por enlace
Estado de servidor (TanStack Query)  → Datos remotos con caché, revalidación e invalidación
Store global (Zustand / Redux)       → Estado de cliente complejo compartido en toda la app
```

**Datos remotos = estado de servidor, no `useState` + `useEffect`.** El porqué: TanStack Query (o similar) te da caché, dedupe, revalidación en foco, reintentos y estados `isLoading`/`error` gratis; reimplementar eso a mano siempre sale peor.

**Evita el prop drilling de más de 3 niveles.** Si pasas props por componentes que no las usan, introduce context o reestructura el árbol.

## Formularios (React Hook Form + Zod)

El porqué: un formulario sin tipos ni validación por esquema es una fuente de bugs en runtime. Con
**React Hook Form** (rendimiento, menos re-renders) + **Zod** (un esquema único que valida *y* deriva el
tipo) tienes una sola fuente de verdad para la forma de los datos y sus reglas.

```tsx
const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(120),
  dueDate: z.coerce.date().optional(),
});
type TaskForm = z.infer<typeof taskSchema>; // el tipo sale del esquema, no se duplica

function TaskFormView({ onSubmit }: { onSubmit: (data: TaskForm) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskForm>({ resolver: zodResolver(taskSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="title">Título</label>
      <input
        id="title"
        {...register("title")}
        aria-invalid={!!errors.title}
        aria-describedby={errors.title ? "title-error" : undefined}
      />
      {/* Error asociado al campo y anunciado a lectores de pantalla */}
      {errors.title && (
        <p id="title-error" role="alert" className="text-sm text-danger">
          {errors.title.message}
        </p>
      )}

      <button type="submit" disabled={isSubmitting}>Guardar</button>
    </form>
  );
}
```

Reglas: valida en el submit **y también en el servidor** (el cliente no es autoridad); asocia cada error
a su campo con `aria-invalid` + `aria-describedby` y no dependas solo del color (ver Accesibilidad →
Formularios); no dejes el submit sin estado `disabled`/carga mientras envía. Reutiliza el mismo esquema
Zod en cliente y servidor cuando compartan tipos con el backend (ver `eecheverria-api-design`).

## Design system y estética minimalista

### Evita la "estética de IA"

La UI generada por IA tiene patrones reconocibles. Evítalos todos: delatan trabajo de baja calidad y hacen que toda app se vea igual.

| Default de IA | Por qué es un problema | Calidad de producción |
|---|---|---|
| Morado/índigo en todo | Los modelos caen a paletas "seguras"; toda app termina idéntica | Usa la paleta real del proyecto |
| Gradientes por todos lados | Agregan ruido visual y chocan con casi cualquier design system | Plano, o gradiente sutil que el sistema defina |
| Todo redondeado (`rounded-2xl`) | El redondeo máximo grita "amigable" e ignora la jerarquía de radios reales | Radio consistente tomado del design system |
| Hero sections genéricas | Layout de plantilla sin relación con el contenido ni la necesidad del usuario | Layouts que nacen del contenido |
| Copy tipo lorem ipsum | El texto de relleno esconde problemas de layout (largo, wrapping, overflow) | Contenido de ejemplo realista, en español |
| Padding gigante en todo | El padding generoso y uniforme mata la jerarquía y desperdicia pantalla | Escala de espaciado consistente |
| Grids de cards de stock | El grid uniforme ignora la prioridad de la información y el patrón de lectura | Layouts según la prioridad del contenido |
| Diseño cargado de sombras | Las sombras apiladas compiten con el contenido y ralentizan el render | Sombras sutiles o nulas salvo que el sistema las pida |

### Espaciado y layout

Usa una escala de espaciado consistente. No inventes valores. El porqué: los valores fuera de escala rompen el ritmo visual y son imposibles de mantener coherentes entre pantallas.

```tsx
{/* Usa la escala (incrementos de 0.25rem, o la que use el proyecto) */}
{/* BIEN */}  <div className="p-4 gap-3" />   {/* 16px / 12px */}
{/* MAL  */}  <div style={{ padding: 13, marginTop: "2.3rem" }} />  {/* fuera de escala */}
```

### Tipografía

Respeta la jerarquía de tipos. El porqué: los encabezados no son solo tamaño de letra; son la estructura del documento para lectores de pantalla y para el escaneo visual.

```
h1 → Título de página (uno por página)
h2 → Título de sección
h3 → Título de subsección
body → Texto por defecto
small → Texto secundario / de ayuda
```

No saltes niveles de encabezado. No uses estilos de encabezado para contenido que no lo es.

### Color

- Usa **tokens semánticos**: `text-primary`, `bg-surface`, `border-default` — no hex crudos. El porqué: los tokens permiten temas (claro/oscuro) y cambios globales en un solo lugar.
- Asegura contraste suficiente: 4.5:1 texto normal, 3:1 texto grande (18px+).
- No dependas solo del color para transmitir información (suma icono, texto o patrón).

## Accesibilidad (WCAG 2.1 AA)

No es "un extra": es un requisito legal en muchas jurisdicciones y un estándar de calidad de ingeniería. Todo componente debe cumplirlo.

### Navegación por teclado

El porqué: quien no usa mouse (teclado, lectores de pantalla) debe poder operar todo. Un `<div onClick>` es invisible para el teclado.

```tsx
// BIEN: enfocable por defecto
<button onClick={handleClick}>Haz clic</button>

// MAL: no es enfocable ni operable por teclado
<div onClick={handleClick}>Haz clic</div>

// Si NO hay más remedio que un elemento no nativo (prefiere <button>):
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter") handleClick();
    if (e.key === " ") e.preventDefault();
  }}
  onKeyUp={(e) => {
    if (e.key === " ") handleClick();
  }}
>
  Haz clic
</div>
```

### Etiquetas ARIA

```tsx
// Etiqueta los controles sin texto visible
<button aria-label="Cerrar diálogo"><XIcon /></button>

// Asocia label a input
<label htmlFor="email">Correo</label>
<input id="email" type="email" autoComplete="email" />

// O aria-label cuando no hay etiqueta visible
<input aria-label="Buscar tareas" type="search" />
```

### Manejo del foco

El porqué: cuando aparece contenido (modal, panel), el foco debe ir ahí y quedar atrapado dentro; al cerrar, debe volver al disparador. Si no, el usuario de teclado se pierde.

```tsx
function Dialog({ isOpen, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal() abre el <dialog> como MODAL real: atrapa el foco dentro,
  // pinta el backdrop y devuelve el foco al disparador al cerrar. El atributo
  // `open` NO hace nada de esto (queda no-modal); por eso se controla por ref.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen) el.showModal();
    else el.close();
  }, [isOpen]);

  return (
    // onCancel captura el cierre con Escape (nativo del <dialog> modal)
    <dialog ref={ref} aria-labelledby="dialog-title" onClose={onClose} onCancel={onClose}>
      <h2 id="dialog-title">Confirmar</h2>
      <button onClick={onClose}>Cerrar</button>
      {/* contenido del diálogo */}
    </dialog>
  );
}
```

### Checklist de accesibilidad (inline)

Antes reference externo; ahora vive aquí. Recórrelo al terminar cualquier UI.

**Teclado**
- [ ] Todo elemento interactivo es enfocable con Tab
- [ ] El orden de foco sigue el orden visual/lógico
- [ ] El foco es visible (outline/ring; **no** lo elimines, estilízalo)
- [ ] Widgets propios con soporte de teclado (Enter para activar, Escape para cerrar)
- [ ] Sin trampas de teclado (siempre se puede salir con Tab)
- [ ] Enlace "saltar al contenido" al inicio, visible al menos con foco
- [ ] Los modales atrapan el foco mientras están abiertos y lo devuelven al cerrar

**Lectores de pantalla**
- [ ] Toda imagen con `alt` (o `alt=""` si es decorativa)
- [ ] Todo input con label asociado (`<label>` o `aria-label`)
- [ ] Botones y enlaces con texto descriptivo (no "Haz clic aquí")
- [ ] Botones de solo icono con `aria-label`
- [ ] Un solo `<h1>` por página y sin saltar niveles de encabezado
- [ ] Cambios dinámicos anunciados con regiones `aria-live`
- [ ] Tablas con `<th scope>` en sus encabezados

**Visual**
- [ ] Contraste de texto ≥ 4.5:1 (normal) o ≥ 3:1 (grande, 18px+)
- [ ] Componentes de UI con contraste ≥ 3:1 contra el fondo
- [ ] El color no es el único medio para transmitir información
- [ ] El texto se puede escalar a 200% sin romper el layout
- [ ] Nada parpadea más de 3 veces por segundo

**Formularios**
- [ ] Todo input con label visible
- [ ] Campos obligatorios indicados (no solo por color)
- [ ] Mensajes de error específicos y asociados al campo
- [ ] Estado de error visible por más que el color (icono, texto, borde)
- [ ] Errores de envío resumidos y enfocables
- [ ] Campos conocidos usan `autoComplete` (p. ej. `type="email" autoComplete="email"`)

**Contenido**
- [ ] Idioma declarado (`<html lang="es">`)
- [ ] Página con `<title>` descriptivo
- [ ] Los enlaces se distinguen del texto (no solo por color)
- [ ] Áreas táctiles ≥ 44x44px en móvil
- [ ] Estados vacíos con significado (no pantallas en blanco)

**Regiones `aria-live` (referencia rápida)**

| Valor | Comportamiento | Úsalo para |
|---|---|---|
| `aria-live="polite"` / `role="status"` | Se anuncia en la próxima pausa | Confirmaciones, "Guardado" |
| `aria-live="assertive"` / `role="alert"` | Se anuncia de inmediato | Errores, alertas urgentes |

**Herramientas para verificar**
- `axe-core` / `pa11y` (auditoría automatizada)
- Chrome DevTools → Lighthouse → Accessibility; y el árbol de accesibilidad en Elements
- Lectores: NVDA (Windows, gratis), VoiceOver (macOS, Cmd+F5)

## Diseño responsivo (mobile-first)

Diseña primero para móvil y luego expande. El porqué: retroadaptar un layout de escritorio a móvil cuesta ~3x más que hacerlo mobile-first desde el inicio; el móvil te obliga a priorizar contenido.

```tsx
{/* Móvil: 1 columna · sm: 2 · lg: 3. Los comentarios van FUERA del className,
    nunca dentro del string de clases (romperían las clases). */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* … cards … */}
</div>
```

Prueba en estos breakpoints: **320px, 768px, 1024px, 1440px**.

## Estados de vacío, carga y error

Nunca muestres una pantalla en blanco. El porqué: sin estados explícitos, un fetch lento o vacío parece un bug; los estados le dicen al usuario qué pasa y qué hacer.

```tsx
// Estado vacío con acción
function EmptyState({ message, onCreate }: EmptyStateProps) {
  return (
    <div role="status" className="text-center py-12">
      <TasksEmptyIcon className="mx-auto h-12 w-12 text-muted" />
      <h3 className="mt-2 text-sm font-medium">{message}</h3>
      <p className="mt-1 text-sm text-muted">Empieza creando una tarea.</p>
      <Button className="mt-4" onClick={onCreate}>Crear tarea</Button>
    </div>
  );
}

// Skeleton de carga (no spinner para contenido)
function TaskListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando tareas">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}
```

El porqué del skeleton sobre el spinner: el skeleton comunica la forma del contenido que viene y reduce el "salto" de layout (CLS); el spinner solo dice "espera" sin contexto.

**Actualizaciones optimistas** para velocidad percibida. El porqué: aplicar el cambio en la UI antes de confirmar el servidor hace la app se sienta instantánea; guarda el estado previo para revertir si falla.

```tsx
function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData(["tasks"]); // guarda para revertir
      queryClient.setQueryData(["tasks"], (old: Task[]) =>
        old.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
      );
      return { previous };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(["tasks"], context?.previous); // revierte
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
```

## Tests

Usa los comandos de test del proyecto (revisa `package.json` / `CLAUDE.md`). Prueba el componente de presentación (recibe props, pinta) y la lógica de los hooks; deja que la separación container/presentation te facilite esto.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "La accesibilidad es un extra" | Es requisito legal en muchos lugares y estándar de calidad de ingeniería. |
| "Lo hacemos responsive después" | Retroadaptar responsive cuesta ~3x más que hacerlo desde el inicio. |
| "El diseño no está final, salto el estilo" | Usa los defaults del design system; UI sin estilo da mala primera impresión. |
| "Es solo un prototipo" | Los prototipos se vuelven producción. Construye bien los cimientos. |
| "La estética de IA está bien por ahora" | Señala baja calidad. Usa el design system real desde el principio. |

## Red flags

- Componentes de más de ~200 líneas (divídelos)
- Estilos inline o valores de pixel arbitrarios fuera de escala
- Faltan estados de error, carga o vacío
- Nunca se probó la navegación por teclado
- El color como único indicador de estado (rojo/verde sin texto ni icono)
- Look genérico "de IA" (morados, gradientes, cards gigantes, layouts de stock)
- Datos remotos manejados con `useState` + `useEffect` en vez de estado de servidor

## Verificación (al terminar una UI)

- [ ] Renderiza sin errores en consola
- [ ] Todo interactivo es accesible por teclado (recorre con Tab)
- [ ] Un lector de pantalla transmite contenido y estructura
- [ ] Responsive: funciona en 320px, 768px, 1024px, 1440px
- [ ] Estados de carga, error y vacío resueltos
- [ ] Sigue el design system del proyecto (espaciado, color, tipografía)
- [ ] Sin advertencias de accesibilidad en DevTools ni axe-core
- [ ] Sin "estética de IA"; usa la paleta y los tokens reales del proyecto
