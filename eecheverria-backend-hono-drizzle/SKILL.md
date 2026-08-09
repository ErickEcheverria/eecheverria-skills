---
name: eecheverria-backend-hono-drizzle
description: Genera código backend nivel senior para proyectos administrativos con Node.js + TypeScript + Hono + Drizzle ORM (MySQL/PlanetScale) + Joi + JWT + Swagger. Actívate SIEMPRE que el usuario pida crear, agregar, scaffoldar o refactorizar código en este stack, incluso si no nombra la skill — frases como "crea un proyecto con Hono", "agrega el módulo de usuarios", "scaffolding de una API", "endpoint nuevo en mi backend Hono", "configura Drizzle con MySQL/PlanetScale", "valida con Joi", "agrega JWT a mi API", "documenta con Swagger", o "refactoriza este controller". Aplica también cuando solo mencionen una pieza del stack (Hono, Drizzle, Joi, swagger-jsdoc) en contexto de un backend administrativo, panel, CRUD, API REST modular, o sistema con roles. Si dudas entre activarla o no en este stack, actívala.
---

# Hono + Drizzle Senior Backend

Genera código backend siguiendo arquitectura **Modular Monolith con Vertical Slicing** y capas internas (`route → controller → service → repository`) por módulo. La meta es código que un desarrollador senior firmaría sin pedir cambios: tipado estricto, errores propios, separación clara, y nada de lógica acoplada a Hono fuera de la capa de routes.

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js (LTS, ≥20) |
| Lenguaje | TypeScript (strict) |
| HTTP | Hono + `@hono/node-server` |
| ORM | Drizzle ORM + `drizzle-kit` |
| Base de datos | MySQL (compatible PlanetScale) |
| Validación | Joi |
| Auth | JWT vía `hono/jwt` |
| Documentación | `swagger-jsdoc` + `@hono/swagger-ui` |

Si el usuario menciona Postgres, SQLite, Zod, Better-Auth u otra alternativa, confirma con él antes de cambiar — la skill asume este stack salvo instrucción explícita.

## Arquitectura: Modular Monolith + Vertical Slicing

Cada feature vive en su propia carpeta autocontenida bajo `src/modules/`. Tocar "usuarios" no debe obligar a abrir seis carpetas distintas.

```
src/
├── modules/
│   └── <feature>/
│       ├── <feature>.routes.ts        # endpoints Hono + JSDoc swagger
│       ├── <feature>.controller.ts    # parsea Context → llama service → arma response
│       ├── <feature>.service.ts       # lógica de negocio (pura, sin Hono)
│       ├── <feature>.repository.ts    # queries Drizzle (única capa que toca db)
│       ├── <feature>.schema.ts        # tabla(s) Drizzle
│       ├── <feature>.validation.ts    # esquemas Joi por endpoint
│       ├── <feature>.types.ts         # DTOs e interfaces del módulo
│       └── <feature>.module.ts        # exporta el sub-router Hono del módulo
├── shared/
│   ├── middlewares/                   # auth, authorize, validate, errorHandler, logger
│   ├── errors/                        # AppError + subclases (NotFound, Conflict, ...)
│   ├── lib/                           # response, jwt, swagger config, password, pagination
│   ├── utils/
│   └── types/                         # HonoEnv (Variables tipadas del Context)
├── config/
│   └── env.ts                         # carga + valida variables de entorno con Joi
├── db/
│   ├── client.ts                      # singleton Drizzle
│   ├── schema.ts                      # re-exporta todos los <feature>.schema.ts
│   ├── baseColumns.ts                 # id + timestamps + soft delete + audit
│   └── migrations/
├── app.ts                             # registra middlewares globales, módulos y swagger
└── server.ts                          # arranca @hono/node-server
```

**Por qué este patrón.** Los proyectos administrativos son CRUD-céntricos con muchos módulos (usuarios, roles, productos, órdenes, reportes, auditoría…). Una estructura global por capa rasga cada feature en seis carpetas y los conflictos de merge se disparan en equipos chicos. El vertical slicing mantiene el contexto junto y permite que un desarrollador nuevo entienda un módulo sin saltar entre carpetas. Las capas internas (`route → controller → service → repository`) mantienen la lógica de negocio independiente del framework HTTP — puedes reemplazar Drizzle por mocks en tests, o migrar de Hono sin reescribir los services.

No es DDD completo a propósito: agregados, value objects y eventos son sobreingeniería para un CRUD administrativo. Si el dominio crece a algo más complejo, se introducen incrementalmente.

## Convenciones no-negociables

Estas decisiones evitan inconsistencias y pequeñas erratas que un revisor senior marcaría en code review.

### 1. Envelope de respuesta uniforme

Toda respuesta sale por un helper único. Nada de `c.json({...})` directo en un controller.

```ts
// shared/lib/response.ts
import type { Context } from 'hono';

export const ok = <T>(c: Context, data: T, status = 200) =>
  c.json({ success: true, data }, status as 200);

export const fail = (
  c: Context,
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) => c.json({ success: false, error: { code, message, details } }, status as 400);
```

La forma `{ success, data, error: { code, message, details } }` queda garantizada para todos los endpoints, lo que simplifica el cliente y los logs.

### 2. Errores tipados, no strings sueltos

Los services lanzan `AppError`. Un único `errorHandler` global los traduce a HTTP. Los controllers no llevan try/catch por errores de negocio; solo si necesitan transformar un error externo desconocido.

```ts
// shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) { super('NOT_FOUND', `${resource} not found`, 404); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super('CONFLICT', message, 409); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super('UNAUTHORIZED', message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super('FORBIDDEN', message, 403); }
}
export class ValidationError extends AppError {
  constructor(details: unknown) { super('VALIDATION_ERROR', 'Invalid input', 422, details); }
}
```

Un `throw new NotFoundError('User')` es mil veces más útil que `return c.json({ error: 'not found' }, 404)` esparcido por controllers.

### 3. Capas estrictas

- **routes**: solo declara endpoints (`router.get`, `router.post`…), aplica middlewares de auth/validate, y delega al controller. Cada handler lleva su bloque JSDoc `@swagger`.
- **controller**: extrae datos del `Context` (params, query, body validado), llama al service, retorna con `ok(...)`. **Sin lógica de negocio.** Sin queries Drizzle.
- **service**: recibe parámetros tipados (no `Context`). No importa nada de `hono`. Coordina repositorios, ejecuta reglas, lanza `AppError` cuando algo falla.
- **repository**: única capa que importa Drizzle. Retorna DTOs ya mapeados, nunca filas crudas con campos de DB. Aplica filtro `deletedAt IS NULL` por defecto en lecturas.

Si un controller hace queries directas a Drizzle, está mal. Si un service importa de `hono`, está mal. Si un repository retorna un objeto con `created_at` en snake_case, está mal.

### 4. Validación con Joi como middleware

Cada endpoint declara su esquema en `<feature>.validation.ts`. Un middleware genérico aplica la validación y deja el resultado tipado en el `Context`:

```ts
// shared/middlewares/validate.ts
import type { Context, Next } from 'hono';
import type Joi from 'joi';
import { ValidationError } from '@/shared/errors/AppError';

type Source = 'json' | 'query' | 'param';

export const validate = (schema: Joi.Schema, source: Source = 'json') =>
  async (c: Context, next: Next) => {
    const raw = source === 'json' ? await c.req.json().catch(() => ({}))
              : source === 'query' ? c.req.query()
              : c.req.param();
    const { value, error } = schema.validate(raw, { abortEarly: false, stripUnknown: true });
    if (error) throw new ValidationError(error.details.map(d => ({ path: d.path.join('.'), message: d.message })));
    c.set(source, value);
    await next();
  };
```

El controller lee `c.get('json')` (o `'query'`, `'param'`) ya validado y tipado. Nunca validar a mano dentro del controller.

### 5. Tablas con columnas base

Toda tabla incluye `id` (UUID v4), `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`. Hay un helper para evitar repetirlos:

```ts
// db/baseColumns.ts
import { varchar, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const baseColumns = {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()),
  deletedAt: datetime('deleted_at'),
  createdBy: varchar('created_by', { length: 36 }),
  updatedBy: varchar('updated_by', { length: 36 }),
};
```

Los repositorios filtran `deletedAt IS NULL` por defecto en `findAll`/`findById`. El método `delete()` no hace `DELETE FROM`, hace `UPDATE ... SET deleted_at = NOW(), updated_by = ?`. Los servicios pasan el `userId` del request para llenar `createdBy`/`updatedBy`.

### 6. Variables de entorno validadas al arranque

`config/env.ts` carga `.env`, valida con Joi y exporta un objeto tipado. Si falta una variable obligatoria, el proceso muere al arranque (no en producción a las 3am).

```ts
// config/env.ts
import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });
if (error) { console.error('Invalid environment variables:', error.message); process.exit(1); }

export const env = value as {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};
```

### 7. JWT con middleware reutilizable

`shared/middlewares/auth.ts` envuelve `hono/jwt`, valida el token y carga `userId` + `roles` en `c.set('user', ...)`. Un segundo middleware `authorize(...roles)` chequea permisos.

```ts
// shared/middlewares/auth.ts
import { jwt as honoJwt } from 'hono/jwt';
import type { Context, Next } from 'hono';
import { env } from '@/config/env';
import { ForbiddenError } from '@/shared/errors/AppError';

export const auth = () => honoJwt({ secret: env.JWT_SECRET });

export const authorize = (...allowed: string[]) =>
  async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload') as { sub: string; roles: string[] };
    if (!payload?.roles?.some(r => allowed.includes(r))) throw new ForbiddenError();
    await next();
  };
```

### 8. Swagger con JSDoc junto al código

Cada handler en `*.routes.ts` lleva su bloque JSDoc `@swagger`. `swagger-jsdoc` los recoge en runtime y `@hono/swagger-ui` los sirve en `/docs`. Mantener la doc junto al código evita que se desactualice — si cambias el endpoint y no actualizas el JSDoc, lo ves en el mismo archivo.

### 9. Imports absolutos

`tsconfig.json` define `"paths": { "@/*": ["./src/*"] }`. Cero `../../../shared/lib/...`. Refactors quedan inmediatos.

### 10. Tipado estricto en todas partes

`strict: true` en `tsconfig.json`. Cero `any` implícito. Los DTOs viven en `<feature>.types.ts` y se exportan; no se inventan tipos inline en firmas públicas. Las firmas de service/repository nunca retornan `any`.

### 11. HonoEnv tipado

Define `Variables` del Context una vez en `shared/types/context.ts` para que `c.get('user')`, `c.get('json')` etc. queden tipados sin asserts:

```ts
// shared/types/context.ts
export type HonoEnv = {
  Variables: {
    user: { sub: string; roles: string[] };
    json: unknown;
    query: unknown;
    param: unknown;
  };
};
```

Y todas las rutas se crean como `new Hono<HonoEnv>()`.

## Workflows

### A. Scaffolding inicial

Cuando el usuario pide un proyecto nuevo:

1. Lee `references/scaffolding.md` y replica **exactamente** la estructura completa de archivos base.
2. Crea un módulo de ejemplo (`health` para empezar, opcionalmente `auth` si el usuario pidió JWT desde el inicio).
3. Genera el `package.json` con los scripts: `dev`, `build`, `start`, `db:generate`, `db:push`, `db:studio`.
4. Después del scaffold, dile al usuario los pasos: `npm install`, copiar `.env.example` a `.env`, llenar `DATABASE_URL` y `JWT_SECRET`, correr `npm run db:push`, levantar con `npm run dev`, abrir `http://localhost:3000/docs`.

No improvises sobre el contenido de los archivos base — usa lo que dice `references/scaffolding.md`.

### B. Nuevo módulo en proyecto existente

Lee `references/module-template.md`. Crea exactamente estos archivos en `src/modules/<feature>/`:

- `<feature>.schema.ts` — tabla(s) Drizzle con `baseColumns` + columnas específicas + relaciones si aplican
- `<feature>.types.ts` — DTOs (`Create<Feature>Dto`, `Update<Feature>Dto`, `<Feature>Response`)
- `<feature>.validation.ts` — esquemas Joi por endpoint
- `<feature>.repository.ts` — CRUD con filtro soft-delete automático
- `<feature>.service.ts` — lógica de negocio, lanza `AppError` cuando aplica
- `<feature>.controller.ts` — handlers que orquestan (sin lógica)
- `<feature>.routes.ts` — declaración de rutas + JSDoc `@swagger` por endpoint
- `<feature>.module.ts` — exporta el sub-router

Después:
1. Registra el módulo en `src/app.ts`: `app.route('/api/<feature>', <feature>Module)`.
2. Re-exporta el schema en `src/db/schema.ts`.
3. Indica al usuario que corra `npm run db:generate` y revise el SQL antes de aplicar.

### C. Endpoint nuevo en módulo existente

1. Agrega el esquema Joi al `<feature>.validation.ts`.
2. Agrega el método al `<feature>.service.ts` con la lógica.
3. Si toca DB, agrega el método al `<feature>.repository.ts`.
4. Agrega el handler al `<feature>.controller.ts`.
5. Agrega la ruta al `<feature>.routes.ts` con su JSDoc `@swagger`.

Nunca declares una ruta sin su esquema Joi (salvo GET sin params/query) y sin su JSDoc.

### D. Refactor de código existente

Antes de tocar nada, pide ver la estructura actual (`ls`, leer 2-3 archivos clave). Identifica desviaciones del patrón:

- ¿Hay lógica de negocio en routes/controllers? → muévela al service.
- ¿Hay queries Drizzle fuera del repository? → muévelas al repository.
- ¿Hay try/catch repetitivos por errores de negocio? → reemplaza con `throw new AppError(...)` y deja que el errorHandler global responda.
- ¿Respuestas inconsistentes (`c.json` directo, distintas formas)? → unifica con `ok()` / `fail()`.
- ¿Validación manual dentro del controller? → muévela a Joi + middleware `validate`.
- ¿Tablas sin `baseColumns`? → migra y agrega los campos.

Refactoriza **módulo por módulo**, no todo a la vez. Confirma con el usuario antes de tocar más de un módulo en una misma pasada — un PR gigante de refactor es difícil de revisar.

## Recursos del bundle

Cada workflow tiene un archivo de referencia con el contenido exacto que necesitas. Léelo cuando el workflow lo requiera; no inventes el contenido.

- **`references/scaffolding.md`** — contenido exacto de cada archivo del scaffold inicial: `package.json`, `tsconfig.json`, `drizzle.config.ts`, `.env.example`, todo `src/server.ts`, `src/app.ts`, `src/shared/*`, `src/config/*`, `src/db/*`, módulo `health`.
- **`references/module-template.md`** — plantillas de los 8 archivos de un módulo, con un ejemplo completo del módulo `products` resuelto (CRUD + paginación + soft delete + auth).
- **`references/conventions.md`** — detalles ampliados: paginación estándar, filtros de búsqueda, JSDoc swagger completo con ejemplos, catálogo de error codes, naming.

## Checklist antes de entregar

Pasa cada cambio por este filtro antes de decir "listo":

- [ ] ¿El código compila con `strict: true`? Cero `any` implícito.
- [ ] ¿Cada endpoint nuevo tiene su esquema Joi (cuando aplica) y su JSDoc `@swagger`?
- [ ] ¿Los services no importan nada de `hono`?
- [ ] ¿Las queries Drizzle viven solo en el repository?
- [ ] ¿Los repositorios filtran `deletedAt IS NULL` en lecturas?
- [ ] ¿Las respuestas pasan por `ok()` / `fail()`?
- [ ] ¿Los errores de negocio son `AppError`, no strings sueltos ni `c.json` con status?
- [ ] ¿El módulo está registrado en `app.ts` y su schema re-exportado en `db/schema.ts`?
- [ ] ¿Los imports usan `@/` en lugar de rutas relativas largas?

Si algo falla, arréglalo antes de cerrar la tarea. Vale más entregar un módulo limpio que tres con deuda.
