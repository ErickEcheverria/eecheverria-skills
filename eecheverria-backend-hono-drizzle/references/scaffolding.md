# Scaffolding inicial — archivos base del proyecto

Replica **exactamente** estos archivos cuando el usuario pide un proyecto nuevo. No improvises versiones de dependencias ni cambies la estructura — está calibrada para que todo funcione junto.

## Tabla de contenidos

- [Estructura final](#estructura-final)
- [`package.json`](#packagejson)
- [`tsconfig.json`](#tsconfigjson)
- [`drizzle.config.ts`](#drizzleconfigts)
- [`.env.example`](#envexample)
- [`.gitignore`](#gitignore)
- [`src/server.ts`](#srcserverts)
- [`src/app.ts`](#srcappts)
- [`src/config/env.ts`](#srcconfigenvts)
- [`src/db/client.ts`](#srcdbclientts)
- [`src/db/schema.ts`](#srcdbschemats)
- [`src/db/baseColumns.ts`](#srcdbbasecolumnsts)
- [`src/shared/errors/AppError.ts`](#srcsharederrorsapperrorts)
- [`src/shared/lib/response.ts`](#srcsharedlibresponsets)
- [`src/shared/lib/jwt.ts`](#srcsharedlibjwtts)
- [`src/shared/lib/password.ts`](#srcsharedlibpasswordts)
- [`src/shared/lib/swagger.ts`](#srcsharedlibswaggerts)
- [`src/shared/lib/pagination.ts`](#srcsharedlibpaginationts)
- [`src/shared/middlewares/auth.ts`](#srcsharedmiddlewaresauthts)
- [`src/shared/middlewares/validate.ts`](#srcsharedmiddlewaresvalidatets)
- [`src/shared/middlewares/errorHandler.ts`](#srcsharedmiddlewareserrorhandlerts)
- [`src/shared/types/context.ts`](#srcsharedtypescontextts)
- [Módulo health (ejemplo mínimo)](#módulo-health-ejemplo-mínimo)
- [Pasos finales](#pasos-finales)

## Estructura final

```
proyecto/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
├── .gitignore
└── src/
    ├── server.ts
    ├── app.ts
    ├── config/
    │   └── env.ts
    ├── db/
    │   ├── client.ts
    │   ├── schema.ts
    │   ├── baseColumns.ts
    │   └── migrations/        (lo crea drizzle-kit)
    ├── shared/
    │   ├── errors/
    │   │   └── AppError.ts
    │   ├── lib/
    │   │   ├── response.ts
    │   │   ├── jwt.ts
    │   │   ├── password.ts
    │   │   ├── swagger.ts
    │   │   └── pagination.ts
    │   ├── middlewares/
    │   │   ├── auth.ts
    │   │   ├── validate.ts
    │   │   └── errorHandler.ts
    │   └── types/
    │       └── context.ts
    └── modules/
        └── health/
            ├── health.routes.ts
            └── health.module.ts
```

## `package.json`

```json
{
  "name": "admin-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "@hono/swagger-ui": "^0.5.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.36.0",
    "hono": "^4.6.0",
    "joi": "^17.13.3",
    "mysql2": "^3.11.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.7.0",
    "@types/swagger-jsdoc": "^6.0.4",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## `drizzle.config.ts`

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## `.env.example`

```
NODE_ENV=development
PORT=3000

# MySQL connection string (formato mysql://user:pass@host:port/db)
# Para PlanetScale: usa el connection string que te da el panel
DATABASE_URL=mysql://root:password@localhost:3306/admin_db

# JWT
JWT_SECRET=cambia-esto-por-un-secreto-de-al-menos-32-caracteres
JWT_EXPIRES_IN=1d
```

## `.gitignore`

```
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

## `src/server.ts`

```ts
import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './config/env';

serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Docs at      http://localhost:${port}/docs`);
});
```

## `src/app.ts`

```ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { errorHandler } from '@/shared/middlewares/errorHandler';
import { swaggerSpec } from '@/shared/lib/swagger';
import { healthModule } from '@/modules/health/health.module';
import type { HonoEnv } from '@/shared/types/context';

export const app = new Hono<HonoEnv>();

app.use('*', logger());
app.use('*', cors());

// Documentación
app.get('/openapi.json', (c) => c.json(swaggerSpec));
app.get('/docs', swaggerUI({ url: '/openapi.json' }));

// Módulos
app.route('/api/health', healthModule);

// Error handler global (debe ir al final)
app.onError(errorHandler);

app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));
```

## `src/config/env.ts`

```ts
import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ['mysql'] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });
if (error) {
  console.error('Invalid environment variables:\n' + error.details.map(d => '  - ' + d.message).join('\n'));
  process.exit(1);
}

export const env = value as {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};
```

## `src/db/client.ts`

```ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/config/env';
import * as schema from './schema';

const pool = mysql.createPool({ uri: env.DATABASE_URL, connectionLimit: 10 });

export const db = drizzle(pool, { schema, mode: 'default' });
export type DB = typeof db;
```

## `src/db/schema.ts`

```ts
// Re-exporta todas las tablas de los módulos.
// Cada vez que crees un módulo nuevo con un *.schema.ts, agrégalo aquí.
export {}; // placeholder hasta que existan módulos con tablas
```

## `src/db/baseColumns.ts`

```ts
import { varchar, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const baseColumns = {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
  deletedAt: datetime('deleted_at'),
  createdBy: varchar('created_by', { length: 36 }),
  updatedBy: varchar('updated_by', { length: 36 }),
};
```

## `src/shared/errors/AppError.ts`

```ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
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

## `src/shared/lib/response.ts`

```ts
import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

export const ok = <T>(c: Context, data: T, status: StatusCode = 200) =>
  c.json({ success: true, data }, status);

export const fail = (
  c: Context,
  code: string,
  message: string,
  status: StatusCode = 400,
  details?: unknown,
) => c.json({ success: false, error: { code, message, details } }, status);
```

## `src/shared/lib/jwt.ts`

```ts
import { sign, verify } from 'hono/jwt';
import { env } from '@/config/env';

export type JwtPayload = {
  sub: string;          // userId
  roles: string[];
  exp: number;
};

const expiresInSeconds = (s: string): number => {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 86400;
  const n = Number(m[1]);
  return n * { s: 1, m: 60, h: 3600, d: 86400 }[m[2] as 's'|'m'|'h'|'d'];
};

export const signJwt = async (payload: Omit<JwtPayload, 'exp'>): Promise<string> => {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds(env.JWT_EXPIRES_IN);
  return sign({ ...payload, exp }, env.JWT_SECRET);
};

export const verifyJwt = async (token: string): Promise<JwtPayload> => {
  return await verify(token, env.JWT_SECRET) as JwtPayload;
};
```

## `src/shared/lib/password.ts`

```ts
import bcrypt from 'bcryptjs';

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);
```

## `src/shared/lib/swagger.ts`

```ts
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Admin API',
      version: '0.1.0',
      description: 'Admin backend API documentation.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'],
});
```

## `src/shared/lib/pagination.ts`

```ts
export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const paginate = <T>(items: T[], total: number, { page, pageSize }: PaginationParams): Paginated<T> => ({
  items,
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
```

## `src/shared/middlewares/auth.ts`

```ts
import { jwt as honoJwt } from 'hono/jwt';
import type { Context, Next } from 'hono';
import { env } from '@/config/env';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/AppError';
import type { JwtPayload } from '@/shared/lib/jwt';

export const auth = () => honoJwt({ secret: env.JWT_SECRET });

export const authorize = (...allowed: string[]) =>
  async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload') as JwtPayload | undefined;
    if (!payload) throw new UnauthorizedError();
    const has = payload.roles?.some((r) => allowed.includes(r));
    if (!has) throw new ForbiddenError(`Requires one of: ${allowed.join(', ')}`);
    c.set('user', { sub: payload.sub, roles: payload.roles });
    await next();
  };
```

## `src/shared/middlewares/validate.ts`

```ts
import type { Context, Next } from 'hono';
import type Joi from 'joi';
import { ValidationError } from '@/shared/errors/AppError';

type Source = 'json' | 'query' | 'param';

export const validate = (schema: Joi.Schema, source: Source = 'json') =>
  async (c: Context, next: Next) => {
    const raw =
      source === 'json' ? await c.req.json().catch(() => ({})) :
      source === 'query' ? c.req.query() :
      c.req.param();

    const { value, error } = schema.validate(raw, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((d) => ({ path: d.path.join('.'), message: d.message })));
    }
    c.set(source, value);
    await next();
  };
```

## `src/shared/middlewares/errorHandler.ts`

```ts
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '@/shared/errors/AppError';
import { fail } from '@/shared/lib/response';
import { env } from '@/config/env';

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return fail(c, err.code, err.message, err.status as any, err.details);
  }
  if (err instanceof HTTPException) {
    return fail(c, 'HTTP_ERROR', err.message, err.status as any);
  }
  console.error('[unhandled]', err);
  return fail(
    c,
    'INTERNAL_ERROR',
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
  );
};
```

## `src/shared/types/context.ts`

```ts
import type { JwtPayload } from '@/shared/lib/jwt';

export type HonoEnv = {
  Variables: {
    jwtPayload: JwtPayload;
    user: { sub: string; roles: string[] };
    json: unknown;
    query: unknown;
    param: unknown;
  };
};
```

## Módulo health (ejemplo mínimo)

Sirve para verificar que el servidor levanta y que swagger está pintando endpoints.

### `src/modules/health/health.routes.ts`

```ts
import { Hono } from 'hono';
import { ok } from '@/shared/lib/response';
import type { HonoEnv } from '@/shared/types/context';

export const healthRoutes = new Hono<HonoEnv>();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: ok }
 *                     uptime: { type: number, example: 12.34 }
 */
healthRoutes.get('/', (c) => ok(c, { status: 'ok', uptime: process.uptime() }));
```

### `src/modules/health/health.module.ts`

```ts
export { healthRoutes as healthModule } from './health.routes';
```

## Pasos finales

Después de generar todo, indica al usuario lo siguiente, en este orden:

1. `npm install`
2. Copiar `.env.example` a `.env` y llenar `DATABASE_URL` y `JWT_SECRET` (mínimo 32 caracteres).
3. `npm run db:push` (no hay tablas todavía, esto solo verifica conexión).
4. `npm run dev` y abrir `http://localhost:3000/docs` para ver Swagger.
5. Cuando quieras agregar el primer módulo de negocio, pídele a la skill: "agrega el módulo de `<feature>`".

Si el usuario menciona PlanetScale explícitamente, recuérdale que PlanetScale no soporta foreign keys nativas, así que las relaciones se manejan a nivel aplicación (Drizzle relations sin `references()` con cascade).
