# Convenciones ampliadas

Este archivo completa lo que está en `SKILL.md` con detalles que no quepan ahí: paginación estándar, JSDoc swagger detallado, naming, catálogo de error codes, y patrones comunes que se repiten entre módulos.

## Tabla de contenidos

- [Naming](#naming)
- [Paginación estándar](#paginación-estándar)
- [Filtros estándar](#filtros-estándar)
- [Catálogo de error codes](#catálogo-de-error-codes)
- [JSDoc swagger por tipo de endpoint](#jsdoc-swagger-por-tipo-de-endpoint)
- [Patrones recurrentes](#patrones-recurrentes)
- [Smells y anti-patterns](#smells-y-anti-patterns)
- [Decisiones de Drizzle / MySQL](#decisiones-de-drizzle--mysql)

## Naming

| Cosa | Convención | Ejemplo |
|---|---|---|
| Carpeta del módulo | kebab/lowercase plural | `users/`, `products/`, `audit-logs/` |
| Archivo | `<feature>.<capa>.ts` | `users.service.ts` |
| Tabla en DB | snake_case plural | `users`, `audit_logs` |
| Export tabla | `<feature>Table` | `usersTable` |
| Clase service/repo/controller | PascalCase singular | `UsersService` |
| Instancia exportada (singleton) | camelCase | `usersService` |
| DTO de input | `Create<Entity>Dto`, `Update<Entity>Dto` | `CreateUserDto` |
| DTO de output | `<Entity>Response` | `UserResponse` |
| Endpoint base | `/api/<feature>` (lowercase plural) | `/api/users` |
| Path param | `:id` (uuid) | `/api/users/:id` |

## Paginación estándar

Todas las listas paginadas usan los mismos query params: `page` (1-based), `pageSize` (default 20, max 100), y opcionalmente `search`.

- El controller extrae los params validados desde `c.get('query')`.
- El service llama al repo y envuelve el resultado con `paginate()`.
- El repo retorna `{ items, total }` y NO el envelope completo — la paginación es responsabilidad del service.

Respuesta:

```json
{
  "success": true,
  "data": {
    "items": [ /* ... */ ],
    "page": 1,
    "pageSize": 20,
    "total": 137,
    "totalPages": 7
  }
}
```

## Filtros estándar

Para filtros adicionales sobre listas, añade al `listQuerySchema` los campos que aplica el módulo y propágalos al repo:

```ts
// validation
export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('active', 'inactive'),
  createdFrom: Joi.date().iso(),
  createdTo: Joi.date().iso().min(Joi.ref('createdFrom')),
});
```

En el repo, construye el `WHERE` componiendo `and(...)` con cada filtro condicional (`filter ? eq(...) : undefined`). Drizzle ignora los `undefined` dentro de `and()`.

## Catálogo de error codes

Mantén estos códigos consistentes entre módulos para que el cliente pueda manejarlos:

| Code | HTTP | Cuándo usarlo |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Input no pasó Joi |
| `NOT_FOUND` | 404 | Recurso no existe o está soft-deleted |
| `CONFLICT` | 409 | Violación de unicidad u otra regla de consistencia |
| `UNAUTHORIZED` | 401 | Falta o JWT inválido |
| `FORBIDDEN` | 403 | JWT válido pero sin permisos para esta acción |
| `BAD_REQUEST` | 400 | Input válido por Joi pero combinación inconsistente (ej. fecha de fin antes de inicio) |
| `INTERNAL_ERROR` | 500 | Error no controlado, capturado por el handler global |

Si necesitas un código específico de dominio (ej. `INSUFFICIENT_STOCK`), créalo como subclase de `AppError`:

```ts
export class InsufficientStockError extends AppError {
  constructor(productId: string, available: number) {
    super('INSUFFICIENT_STOCK', `Not enough stock for product ${productId}`, 409, { available });
  }
}
```

## JSDoc swagger por tipo de endpoint

`swagger-jsdoc` lee los bloques `@swagger` dentro de los `*.routes.ts`. La sintaxis es YAML embebido. Estos son los patrones que cubren el 95% de endpoints administrativos.

### Listado paginado

```yaml
@swagger
/api/<feature>:
  get:
    tags: [<Feature>]
    summary: List <feature>
    security: [{ bearerAuth: [] }]
    parameters:
      - in: query
        name: page
        schema: { type: integer, default: 1 }
      - in: query
        name: pageSize
        schema: { type: integer, default: 20, maximum: 100 }
      - in: query
        name: search
        schema: { type: string }
    responses:
      200: { description: OK }
      401: { description: Unauthorized }
```

### Detalle por ID

```yaml
@swagger
/api/<feature>/{id}:
  get:
    tags: [<Feature>]
    summary: Get <feature> by id
    security: [{ bearerAuth: [] }]
    parameters:
      - in: path
        name: id
        required: true
        schema: { type: string, format: uuid }
    responses:
      200: { description: OK }
      404: { description: Not found }
```

### Crear

```yaml
@swagger
/api/<feature>:
  post:
    tags: [<Feature>]
    summary: Create <feature>
    security: [{ bearerAuth: [] }]
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name]
            properties:
              name: { type: string, minLength: 1, maxLength: 120 }
    responses:
      201: { description: Created }
      409: { description: Conflict }
      422: { description: Validation error }
```

### Update parcial (PATCH)

```yaml
@swagger
/api/<feature>/{id}:
  patch:
    tags: [<Feature>]
    summary: Update <feature>
    security: [{ bearerAuth: [] }]
    parameters:
      - in: path
        name: id
        required: true
        schema: { type: string, format: uuid }
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            minProperties: 1
            properties:
              name: { type: string }
    responses:
      200: { description: OK }
      404: { description: Not found }
```

### Soft delete

```yaml
@swagger
/api/<feature>/{id}:
  delete:
    tags: [<Feature>]
    summary: Soft-delete <feature>
    security: [{ bearerAuth: [] }]
    parameters:
      - in: path
        name: id
        required: true
        schema: { type: string, format: uuid }
    responses:
      200: { description: OK }
      404: { description: Not found }
```

### Login (sin auth)

```yaml
@swagger
/api/auth/login:
  post:
    tags: [Auth]
    summary: Login with email + password
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password]
            properties:
              email: { type: string, format: email }
              password: { type: string, minLength: 8 }
    responses:
      200:
        description: Token issued
        content:
          application/json:
            schema:
              type: object
              properties:
                success: { type: boolean }
                data:
                  type: object
                  properties:
                    token: { type: string }
                    expiresIn: { type: string, example: "1d" }
      401: { description: Invalid credentials }
```

## Patrones recurrentes

### Unicidad antes de insertar

El service consulta el repo antes de insertar y lanza `ConflictError`:

```ts
const existing = await this.repo.findBySku(input.sku);
if (existing) throw new ConflictError(`Product with sku "${input.sku}" already exists`);
return this.repo.create({ ...input, createdBy: userId });
```

No confiar solo en el unique constraint de la DB — atrapar el error de driver es feo y específico al dialecto.

### Update parcial con tipo Drizzle

`update().set({...})` acepta `Partial`, pero si tu DTO tiene campos con nombres distintos a las columnas (ej. `price` viene como `number` y la columna es `decimal` que pide string), arma un objeto intermedio explícito y solo asigna los campos que vinieron en el patch.

### Transacciones

Cuando un caso de uso toca varias tablas y la consistencia importa, envuelve en una transacción Drizzle:

```ts
await db.transaction(async (tx) => {
  await tx.insert(ordersTable).values({ ... });
  await tx.update(productsTable).set({ stock: sql`stock - 1` }).where(eq(productsTable.id, productId));
});
```

Las transacciones viven en el **service**, no en el controller ni en el repository. Si necesitas exponer el `tx` al repo, agrega un parámetro opcional al método del repo y úsalo en lugar de `db`.

### Logging

Usa `hono/logger` para logs HTTP. Para logs de negocio, considera `pino` (`pino` + `hono-pino`). En este scaffold queda fuera para mantenerlo minimal — si el usuario lo pide explícitamente, agrégalo. Nunca uses `console.log` en código de producción salvo en el `errorHandler` para errores no controlados.

## Smells y anti-patterns

Lista para tener en mente al refactorizar o revisar código existente:

| Smell | Por qué está mal | Cómo arreglarlo |
|---|---|---|
| `c.json({...})` dentro del controller | Rompe la consistencia del envelope | Usar `ok()` / `fail()` |
| `try/catch` en controller para errores de negocio | Lógica de respuesta dispersa | Lanzar `AppError` desde el service y dejar al `errorHandler` global |
| Query Drizzle en el controller | Brinca capas, dificulta tests | Mover a repository |
| Service importa `hono` | Acopla negocio al framework | Recibir parámetros tipados; el controller hace la traducción |
| Repository retorna fila cruda con `created_at` snake_case | Filtra detalles de DB a capas superiores | Mapear a `<Entity>Response` antes de retornar |
| Validación manual con `if (!email)` en el controller | Inconsistente, sin mensaje estandarizado | Mover a `<feature>.validation.ts` + middleware `validate` |
| Endpoint sin JSDoc swagger | La doc queda desactualizada o ausente | Agregar bloque `@swagger` arriba del handler |
| Tabla nueva sin `baseColumns` | Sin auditoría ni soft delete | Spread `baseColumns` al inicio del objeto de columnas |
| Borrado físico (`DELETE FROM`) | Pérdida irreversible, sin trazabilidad | `update().set({ deletedAt: new Date(), updatedBy })` |
| Hardcodear `JWT_SECRET` o `DATABASE_URL` | Filtración inminente | Sacar a `.env`, validar con Joi al arranque |
| Imports relativos largos (`../../../shared/...`) | Frágiles al mover archivos | Usar el alias `@/` |
| Inyección de dependencias en cada handler (instanciar service por request) | Innecesario, cuesta GC | Service como singleton exportado |
| Roles hardcodeados como strings sueltos en `authorize('admin')` por todas partes | Tipos errors o magic strings | Eventualmente, exportar constante `ROLES` en `shared/types/roles.ts` |

## Decisiones de Drizzle / MySQL

- **Tipo de `id`**: `varchar(36)` UUID v4. Más seguro para admin (no expone conteo), portable entre DBs si migran.
- **Timestamps**: `datetime` (no `timestamp`) para evitar el rango limitado de `timestamp` en MySQL (1970-2038).
- **`decimal` para dinero**: `decimal(12, 2)` por defecto. Nunca `float`/`double` para montos. Drizzle retorna string; el `toResponse` del repo lo convierte a `Number` cuando es seguro, o usa una librería como `decimal.js` si los cálculos son sensibles.
- **`text` solo cuando lo necesitas**: `varchar(N)` por defecto. `text` solo si el contenido excede 1000-2000 chars con frecuencia (descripciones largas, contenido markdown).
- **PlanetScale**: no soporta foreign keys nativas. Las "relaciones" se declaran en Drizzle (`relations()`) y se respetan a nivel aplicación. Tampoco hay `ALTER TABLE` rápido en producción — usar el flujo de deploy requests. Avísale al usuario.
- **Índices**: agregar `.unique()` en columnas como `email`, `sku`. Agregar `index('idx_...').on(table.column)` cuando una columna se filtra/ordena frecuentemente. Drizzle los recoge en la migración.
- **Enums**: usar `mysqlEnum('status', ['active', 'inactive'])` para campos cerrados; nada de strings libres validados solo por Joi.

## Antes de cerrar un PR

Repaso final que la skill debe ejecutar mentalmente:

1. `npm run typecheck` pasa sin errores.
2. Cada ruta nueva tiene su JSDoc `@swagger` y el sitio `/docs` la muestra correcta.
3. `npm run db:generate` no produce diffs inesperados sobre tablas existentes.
4. Si el módulo tiene mutaciones, las rutas pasan por `auth()` + `authorize(...)` con los roles correctos.
5. Las respuestas exitosas usan `ok()` y los errores son `AppError`.
6. Búsqueda manual de smells: `git grep -nE "c\.json\(" src/modules` — solo deberían salir matches dentro de `response.ts`.
