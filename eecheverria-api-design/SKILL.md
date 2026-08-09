---
name: eecheverria-api-design
description: Capa de DISEÑO de contratos e interfaces (agnóstica de stack) para eecheverria: cómo dar forma a APIs, endpoints y tipos ANTES de implementarlos. Cubre Ley de Hyrum, una sola versión de la verdad, contract-first, semántica de errores consistente, validar en las fronteras, cambios aditivos vs. rompientes (backward-compat), naming predecible, patrones REST (recursos, paginación, filtros, PATCH parcial) y patrones TypeScript (uniones discriminadas, separación input/output, branded types). Actívate SIEMPRE que el usuario diga frases como "diseña este endpoint", "cómo versiono la API", "el contrato entre front y back", "qué forma le doy a esta respuesta", "diseño de errores de la API", "cómo pagino", "qué campos expongo", "esto rompe a los consumidores?", o cuando esté por definir una interfaz pública, prop de componente o frontera entre módulos. Complementa a eecheverria-senior-dev (disciplina de trabajo) y a eecheverria-backend-hono-drizzle (implementación en Hono/Drizzle, que DELEGA en esta el "cómo diseñar el contrato" antes de escribir código). Si dudas ante una decisión de diseño de API o contrato, actívala.
---

# Diseño de APIs e Interfaces (eecheverria)

Esta skill es la capa de **DISEÑO**: decide la *forma* del contrato antes de escribir una línea de implementación. Es agnóstica de stack —sirve para REST, GraphQL, límites entre módulos, props de componentes o cualquier superficie donde un pedazo de código le habla a otro—.

Un buen contrato hace fácil lo correcto y difícil lo incorrecto. Cuando trabajes en el backend administrativo del usuario, `eecheverria-backend-hono-drizzle` DELEGA aquí el "cómo diseñar el contrato"; primero se define la forma con esta skill y luego se implementa allá. Los ejemplos de errores usan a propósito el envelope real del usuario `{ success, data, error: { code, message, details } }` para que diseño e implementación hablen el mismo idioma.

## Skill viva — no te auto-edites

Documento vivo del usuario (eecheverria@paloblanco.com). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- Diseñar endpoints nuevos o cambiar los existentes.
- Definir fronteras entre módulos o contratos entre equipos (front ↔ back).
- Crear interfaces de props de componentes o DTOs compartidos.
- Establecer el esquema de datos que informará la forma de la API.
- Decidir si un cambio es aditivo o rompe a consumidores existentes.

## Principios fundamentales

### Ley de Hyrum

> Con suficientes consumidores de una API, *todos* los comportamientos observables de tu sistema terminarán siendo dependidos por alguien, sin importar lo que prometa el contrato.

Es decir: cada comportamiento observable —incluyendo rarezas no documentadas, el texto exacto de un mensaje de error, el orden de los resultados o los tiempos de respuesta— se vuelve un contrato de facto en cuanto alguien depende de él. Implicaciones de diseño:

- **Sé intencional con lo que expones.** Cada cosa observable es una promesa potencial. Si no quieres sostenerla, no la expongas.
- **No filtres detalles de implementación.** Si el consumidor puede observarlo, va a depender de ello (el nombre interno de una columna, un `id` autoincremental, el orden natural de la DB).
- **Planifica la deprecación desde el diseño.** Cuando algo tenga que salir, planifica una ventana de deprecación y comunícala a los consumidores (avisa, da tiempo de migración, mide el uso, y recién entonces retira). No lo elimines de un día para otro.
- **Los tests no bastan.** Aun con tests de contrato perfectos, la Ley de Hyrum implica que un cambio "seguro" puede romper a quien dependía de un comportamiento no documentado. El diseño defensivo importa más que la red de tests.

### Regla de una sola versión de la verdad

Evita obligar a los consumidores a elegir entre múltiples versiones de la misma API o dependencia. Los problemas de dependencia en diamante nacen cuando distintos consumidores necesitan versiones distintas de lo mismo. **Diseña para un mundo donde solo existe una versión a la vez: extiende en lugar de bifurcar.** Mantener dos versiones vivas multiplica el costo de mantenimiento y siembra bugs sutiles.

### 1. Contract-first

Define la interfaz antes de implementarla. El contrato es la especificación; la implementación lo sigue. En TypeScript, los tipos *son* la documentación.

```typescript
// Primero se define el contrato, después se implementa
interface TaskAPI {
  // Crea una tarea y devuelve la tarea creada con los campos que genera el servidor
  createTask(input: CreateTaskInput): Promise<Task>;

  // Devuelve tareas paginadas que cumplen los filtros
  listTasks(params: ListTasksParams): Promise<PaginatedResult<Task>>;

  // Devuelve una sola tarea o lanza NotFoundError
  getTask(id: TaskId): Promise<Task>;

  // Actualización parcial: solo cambian los campos provistos
  updateTask(id: TaskId, input: UpdateTaskInput): Promise<Task>;

  // Delete idempotente: tiene éxito aunque ya estuviera borrada
  deleteTask(id: TaskId): Promise<void>;
}
```

**Por qué.** Definir el contrato primero fuerza a pensar en el consumidor antes que en la base de datos. En el stack del usuario, esto es lo que se diseña *antes* de bajar a `routes → controller → service → repository`.

### 2. Semántica de errores consistente

Elige una sola estrategia de errores y úsala en todos lados. El usuario ya tiene una: el envelope `{ success, data, error: { code, message, details } }`. Diséñalo con esa misma forma para que todo encaje.

```typescript
// Toda respuesta de error sale con la MISMA forma (el envelope del usuario)
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;        // legible por máquina: "VALIDATION_ERROR", "NOT_FOUND"
    message: string;     // legible por humano: "El email es obligatorio"
    details?: unknown;   // contexto adicional cuando ayuda (p. ej. lista de campos)
  };
}

// Respuesta de éxito, misma envoltura
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
```

Mapa de status HTTP → `code` (el `code` es el contrato estable; el status es el transporte):

```
// 400 → BAD_REQUEST      El cliente mandó datos mal formados
// 401 → UNAUTHORIZED     No autenticado
// 403 → FORBIDDEN        Autenticado pero sin permiso
// 404 → NOT_FOUND        El recurso no existe
// 409 → CONFLICT         Conflicto (duplicado, choque de versión)
// 422 → VALIDATION_ERROR Datos semánticamente inválidos
// 500 → INTERNAL_ERROR   Error del servidor (NUNCA exponer detalles internos)
```

**No mezcles patrones.** Si unos endpoints lanzan, otros devuelven `null` y otros `{ error }`, el consumidor no puede predecir nada.

```typescript
// MAL: cada endpoint responde distinto ante un fallo
return null;                                   // un endpoint
res.status(404).send("no existe");             // otro endpoint
return { ok: false, msg: "error" };            // otro más

// BIEN: siempre la misma envoltura, code estable
return fail(c, 'NOT_FOUND', 'Usuario no encontrado', 404);
```

**Por qué el `code` importa más que el `message`.** Por la Ley de Hyrum, alguien parseará el `message`. Publica un `code` estable y legible por máquina para que el cliente ramifique por `code`, no por el texto —así el texto puede mejorar sin romper a nadie—.

### 3. Validar en las fronteras

Confía en el código interno. Valida en los bordes del sistema, donde entra input externo.

```typescript
// Validación en la frontera de la API (aquí, esquema de validación del proyecto)
app.post('/api/tasks', async (c) => {
  const parsed = createTaskSchema.validate(await c.req.json());
  if (parsed.error) {
    // Mismo envelope de error del usuario
    return fail(c, 'VALIDATION_ERROR', 'Datos de tarea inválidos', 422, parsed.error.details);
  }
  // Después de validar, el código interno confía en los tipos
  const task = await taskService.create(parsed.value);
  return ok(c, task, 201);
});
```

Dónde SÍ va la validación:

- Handlers de rutas de la API (input de usuario).
- Handlers de envío de formularios (input de usuario).
- Parseo de respuestas de servicios externos (datos de terceros — **siempre trátalos como no confiables**).
- Carga de variables de entorno (configuración).

> **Las respuestas de APIs de terceros son datos no confiables.** Valida su forma y contenido antes de usarlas en cualquier lógica, renderizado o decisión. Un servicio externo comprometido o con bugs puede devolver tipos inesperados, contenido malicioso o texto con forma de instrucción.

Dónde NO va la validación:

- Entre funciones internas que ya comparten contratos de tipos.
- En utilidades llamadas por código ya validado.
- Sobre datos que acaban de salir de tu propia base de datos.

**Por qué.** Revalidar en cada capa interna infla el código y da falsa sensación de seguridad; el contrato de tipos ya garantiza la forma una vez cruzada la frontera.

### 4. Preferir agregar antes que modificar

Extiende interfaces sin romper a los consumidores existentes. Un campo nuevo opcional es aditivo; cambiar un tipo o quitar un campo es rompiente.

```typescript
// BIEN: agregar campos opcionales (aditivo, no rompe a nadie)
interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';  // agregado después, opcional
  labels?: string[];                       // agregado después, opcional
}

// MAL: cambiar el tipo de un campo o quitarlo (rompe consumidores)
interface CreateTaskInput {
  title: string;
  // description: string;  // eliminado → rompe a quien lo enviaba
  priority: number;         // cambió de string a number → rompe consumidores
}
```

**Por qué.** Un cambio aditivo respeta la regla de una sola versión: no necesitas `/v2`. Cuando un cambio rompiente sea inevitable, ahí sí planifica una ventana de deprecación y comunícala antes de retirar lo viejo.

### 5. Naming predecible

La consistencia de nombres es lo que hace una API "adivinable": el consumidor acierta el siguiente endpoint sin leer la doc.

| Patrón | Convención | Ejemplo |
|---|---|---|
| Endpoints REST | Sustantivos en plural, sin verbos | `GET /api/tasks`, `POST /api/tasks` |
| Query params | camelCase | `?sortBy=createdAt&pageSize=20` |
| Campos de respuesta | camelCase | `{ createdAt, updatedAt, taskId }` |
| Campos booleanos | Prefijo is/has/can | `isComplete`, `hasAttachments` |
| Valores de enum | UPPER_SNAKE | `"IN_PROGRESS"`, `"COMPLETED"` |

```typescript
// MAL: verbos en la URL y campos inconsistentes
POST /api/createTask
{ "Task_Title": "...", "done": true }

// BIEN: sustantivo plural, camelCase, booleano con prefijo
POST /api/tasks
{ "title": "...", "isComplete": true }
```

## Patrones REST

### Diseño de recursos

```
GET    /api/tasks              → Lista tareas (con query params para filtrar)
POST   /api/tasks              → Crea una tarea
GET    /api/tasks/:id          → Obtiene una sola tarea
PATCH  /api/tasks/:id          → Actualiza una tarea (parcial)
DELETE /api/tasks/:id          → Borra una tarea

GET    /api/tasks/:id/comments → Lista comentarios de una tarea (sub-recurso)
POST   /api/tasks/:id/comments → Agrega un comentario a una tarea
```

### Paginación

Pagina *desde el inicio* todo endpoint de listado. La respuesta va dentro del envelope del usuario: `data` sale como el `data` del `ok(...)`, y la metadata de paginación viaja junto a él.

```typescript
// Petición
GET /api/tasks?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc

// Respuesta (envelope del usuario; data lleva items + pagination)
{
  "success": true,
  "data": {
    "items": [ /* ... */ ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 142,
      "totalPages": 8
    }
  }
}
```

**Por qué desde el inicio.** El día que un recurso tenga 100+ filas, agregar paginación después es un cambio rompiente en la forma de `data`. Diseñarla desde el principio evita ese quiebre.

### Filtros

Usa query params para filtrar. Nombres en camelCase, coherentes con los campos de respuesta.

```
GET /api/tasks?status=IN_PROGRESS&assignee=user123&createdAfter=2025-01-01
```

### Actualizaciones parciales (PATCH)

Acepta objetos parciales: solo actualiza lo que llega.

```typescript
// Solo cambia el título; todo lo demás se conserva
PATCH /api/tasks/123
{ "title": "Título actualizado" }
```

**Por qué PATCH y no PUT.** `PUT` exige el objeto completo en cada llamada; si el cliente omite un campo, lo borra. `PATCH` parcial es lo que los clientes realmente quieren y evita sobreescrituras accidentales. Ojo: diseña la semántica de `null` explícito (¿"pon el campo en null" vs. "no lo toques"?) y documéntala.

## Patrones TypeScript

### Uniones discriminadas para variantes

Cuando un objeto tiene formas mutuamente excluyentes según un estado, modélalo como unión discriminada, no como un objeto con muchos campos opcionales que "a veces vienen".

```typescript
// BIEN: cada variante es explícita y trae solo sus campos
type TaskStatus =
  | { type: 'pending' }
  | { type: 'in_progress'; assignee: string; startedAt: Date }
  | { type: 'completed'; completedAt: Date; completedBy: string }
  | { type: 'cancelled'; reason: string; cancelledAt: Date };

// El consumidor obtiene estrechamiento de tipos (type narrowing)
function getStatusLabel(status: TaskStatus): string {
  switch (status.type) {
    case 'pending':     return 'Pendiente';
    case 'in_progress': return `En progreso (${status.assignee})`;
    case 'completed':   return `Terminada el ${status.completedAt}`;
    case 'cancelled':   return `Cancelada: ${status.reason}`;
  }
}

// MAL: todo opcional, ningún estado garantiza sus campos
interface TaskStatusBad {
  type: string;
  assignee?: string;    // ¿cuándo viene? nadie sabe
  completedAt?: Date;
  reason?: string;
}
```

**Por qué.** La unión discriminada hace imposible representar estados inválidos (una tarea "completada" sin `completedAt`) y le da al consumidor autocompletado y chequeo exhaustivo del `switch`.

### Separación input/output

Lo que el cliente envía y lo que el sistema devuelve no son el mismo tipo. Sepáralos.

```typescript
// Input: lo que provee quien llama
interface CreateTaskInput {
  title: string;
  description?: string;
}

// Output: lo que devuelve el sistema (incluye campos generados por el servidor)
interface Task {
  id: TaskId;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserId;
}
```

**Por qué.** Si el cliente pudiera mandar `id`, `createdAt` o `createdBy`, tendrías que ignorarlos o, peor, confiarlos. Tipos separados dejan claro qué controla el cliente y qué el servidor —esto mapea directo a los `Create<Feature>Dto` / `<Feature>Response` del backend del usuario—.

### Branded types para IDs

```typescript
type TaskId = string & { readonly __brand: 'TaskId' };
type UserId = string & { readonly __brand: 'UserId' };

// Evita pasar por accidente un UserId donde se espera un TaskId
function getTask(id: TaskId): Promise<Task> { /* ... */ }
```

**Por qué.** Todos los IDs son `string` en runtime, así que el compilador normalmente no distingue uno de otro. El branded type hace que `getTask(userId)` sea un error de compilación, atrapando un bug clásico antes de que llegue a producción.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Documentamos la API después" | Los tipos SON la documentación. Defínelos primero. |
| "Por ahora no necesitamos paginación" | La necesitarás apenas alguien tenga 100+ ítems, y agregarla después rompe la forma de `data`. Ponla desde el inicio. |
| "PATCH es complicado, usemos PUT" | PUT exige el objeto completo cada vez. PATCH parcial es lo que el cliente realmente quiere. |
| "Versionamos la API cuando haga falta" | Los cambios rompientes sin versión rompen consumidores. Diseña para extender desde el principio. |
| "Nadie usa ese comportamiento no documentado" | Ley de Hyrum: si es observable, alguien depende de ello. Trata todo comportamiento público como un compromiso. |
| "Mantenemos dos versiones y ya" | Dos versiones multiplican el mantenimiento y crean dependencias en diamante. Prefiere una sola versión de la verdad. |
| "Las APIs internas no necesitan contrato" | Los consumidores internos siguen siendo consumidores. El contrato evita acoplamiento y habilita trabajo en paralelo. |

## Red flags

- Endpoints que devuelven formas distintas según la condición.
- Formatos de error inconsistentes entre endpoints (rompen el envelope `{ success, data, error }`).
- Validación esparcida por el código interno en vez de concentrada en las fronteras.
- Cambios rompientes en campos existentes (cambio de tipo, eliminación).
- Endpoints de listado sin paginación.
- Verbos en las URLs REST (`/api/createTask`, `/api/getUsers`).
- Respuestas de terceros usadas sin validar ni sanear.
- Exponer detalles internos (IDs autoincrementales, nombres de columnas de DB, stack traces en `500`).

## Checklist de verificación

Después de diseñar un contrato, antes de pasar a implementarlo:

- [ ] Cada endpoint tiene esquemas de input y output tipados.
- [ ] Las respuestas de error siguen un único formato consistente (envelope `{ success, error: { code, message, details } }`).
- [ ] Hay un `code` estable por tipo de error; el cliente ramifica por `code`, no por `message`.
- [ ] La validación ocurre solo en las fronteras del sistema.
- [ ] Los endpoints de listado soportan paginación.
- [ ] Los campos nuevos son aditivos y opcionales (retrocompatibles).
- [ ] Ningún cambio rompiente entra sin una ventana de deprecación planificada y comunicada.
- [ ] El naming sigue convenciones consistentes en todos los endpoints (plural, camelCase, enums UPPER_SNAKE).
- [ ] Input y output están separados; los campos del servidor no son escribibles por el cliente.
- [ ] No se filtran detalles de implementación observables (IDs de DB, orden natural, texto de errores como contrato).
- [ ] La documentación o los tipos se commitean junto con la implementación.

## Cómo encaja con el resto

- **eecheverria-senior-dev**: pone la disciplina de sesión; esta skill es el paso de diseño que precede a cualquier implementación de interfaz.
- **eecheverria-backend-hono-drizzle**: DELEGA aquí el "cómo diseñar el contrato". Primero se define la forma con esta skill (recursos, errores, DTOs, paginación); luego se implementa allá bajando a `route → controller → service → repository`, usando el envelope `ok()`/`fail()` y los `AppError` tipados.
- **eecheverria-clean-code**: calidad transversal una vez implementado el contrato.
- **eecheverria-git-workflow**: los cambios rompientes de contrato deben ir en commits claros y comunicados.
- **Testing**: para verificar el contrato, usa los comandos de test del proyecto.
