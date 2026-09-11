# Plantilla de módulo + ejemplo resuelto

Cuando el usuario pide "agrega el módulo de `<feature>`", genera **exactamente** los 8 archivos descritos abajo. Luego registra el módulo en `app.ts` y re-exporta el schema en `db/schema.ts`.

## Tabla de contenidos

- [Reglas de oro](#reglas-de-oro)
- [Convención de nombres](#convención-de-nombres)
- [Plantillas (genéricas)](#plantillas-genéricas)
  - [`<feature>.schema.ts`](#featureschemats)
  - [`<feature>.types.ts`](#featuretypests)
  - [`<feature>.validation.ts`](#featurevalidationts)
  - [`<feature>.repository.ts`](#featurerepositoryts)
  - [`<feature>.service.ts`](#featureservicets)
  - [`<feature>.controller.ts`](#featurecontrollerts)
  - [`<feature>.routes.ts`](#featureroutests)
  - [`<feature>.module.ts`](#featuremodulets)
- [Registro del módulo](#registro-del-módulo)
- [Ejemplo completo: módulo `products`](#ejemplo-completo-módulo-products)

## Reglas de oro

- **Una capa, una responsabilidad.** Si un controller hace una query, está mal. Si un service importa `hono`, está mal. Si un repository retorna `created_at` con guion bajo, está mal (mapea a `createdAt`).
- **DTOs explícitos.** Inputs y outputs viven en `<feature>.types.ts`. Nada de inferir tipos directos desde la tabla en firmas públicas.
- **Soft delete por defecto.** Las lecturas filtran `deletedAt IS NULL`. El `delete()` del repo hace `UPDATE ... SET deleted_at = NOW()`.
- **Auditoría obligatoria.** `createdBy`/`updatedBy` se llenan desde el `userId` del request. Lo pasa el controller al service.
- **JSDoc swagger siempre.** Cualquier endpoint nuevo lleva su bloque `@swagger` arriba del handler en `routes.ts`.

## Convención de nombres

- Carpeta y prefijo en minúscula plural: `users`, `products`, `roles`.
- Clase del repo/service en singular PascalCase: `UsersRepository`, `UsersService`. Instancia exportada como singleton.
- DTOs: `Create<Feature>Dto`, `Update<Feature>Dto`, `<Feature>Response`.
- Tabla Drizzle: nombre singular en plural (`users`), exportada como `usersTable`.

## Plantillas (genéricas)

Reemplaza `<feature>` (carpeta/lower-plural), `<Feature>` (PascalCase singular) y `<entity>` (PascalCase singular, ej. `User`). Los campos `<...>` son específicos del módulo y los rellenas según el caso.

### `<feature>.schema.ts`

```ts
import { mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { baseColumns } from '@/db/baseColumns';

export const <feature>Table = mysqlTable('<feature>', {
  ...baseColumns,
  // ⬇⬇⬇ columnas específicas del módulo
  name: varchar('name', { length: 120 }).notNull(),
  // ...
});

export type <Entity>Row = typeof <feature>Table.$inferSelect;
export type New<Entity>Row = typeof <feature>Table.$inferInsert;
```

### `<feature>.types.ts`

```ts
export type <Entity>Response = {
  id: string;
  // campos de respuesta (en camelCase, sin password ni columnas sensibles)
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Create<Entity>Dto = {
  name: string;
  // ...
};

export type Update<Entity>Dto = Partial<Create<Entity>Dto>;
```

### `<feature>.validation.ts`

```ts
import Joi from 'joi';

export const create<Entity>Schema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  // ...
});

export const update<Entity>Schema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  // ...
}).min(1); // al menos un campo

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
});
```

### `<feature>.repository.ts`

```ts
import { and, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { <feature>Table } from './<feature>.schema';
import type { Create<Entity>Dto, Update<Entity>Dto, <Entity>Response } from './<feature>.types';
import type { PaginationParams } from '@/shared/lib/pagination';

const toResponse = (row: typeof <feature>Table.$inferSelect): <Entity>Response => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class <Feature>Repository {
  async findById(id: string): Promise<<Entity>Response | null> {
    const [row] = await db.select().from(<feature>Table)
      .where(and(eq(<feature>Table.id, id), isNull(<feature>Table.deletedAt)))
      .limit(1);
    return row ? toResponse(row) : null;
  }

  async findMany(params: PaginationParams & { search?: string }): Promise<{ items: <Entity>Response[]; total: number }> {
    const where = and(
      isNull(<feature>Table.deletedAt),
      params.search ? like(<feature>Table.name, `%${params.search}%`) : undefined,
    );

    const offset = (params.page - 1) * params.pageSize;
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(<feature>Table).where(where).orderBy(desc(<feature>Table.createdAt)).limit(params.pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(<feature>Table).where(where),
    ]);

    return { items: rows.map(toResponse), total: Number(count) };
  }

  async create(input: Create<Entity>Dto & { createdBy: string }): Promise<<Entity>Response> {
    const id = crypto.randomUUID();
    await db.insert(<feature>Table).values({
      id,
      name: input.name,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    });
    const created = await this.findById(id);
    if (!created) throw new Error('Failed to load created entity');
    return created;
  }

  async update(id: string, patch: Update<Entity>Dto & { updatedBy: string }): Promise<<Entity>Response | null> {
    await db.update(<feature>Table)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(<feature>Table.id, id), isNull(<feature>Table.deletedAt)));
    return this.findById(id);
  }

  async softDelete(id: string, updatedBy: string): Promise<boolean> {
    const result = await db.update(<feature>Table)
      .set({ deletedAt: new Date(), updatedBy })
      .where(and(eq(<feature>Table.id, id), isNull(<feature>Table.deletedAt)));
    return result[0].affectedRows > 0;
  }
}

export const <feature>Repository = new <Feature>Repository();
```

### `<feature>.service.ts`

```ts
import { NotFoundError } from '@/shared/errors/AppError';
import { paginate, type Paginated } from '@/shared/lib/pagination';
import { <feature>Repository } from './<feature>.repository';
import type { Create<Entity>Dto, Update<Entity>Dto, <Entity>Response } from './<feature>.types';

export class <Feature>Service {
  constructor(private readonly repo = <feature>Repository) {}

  async getById(id: string): Promise<<Entity>Response> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('<Entity>');
    return found;
  }

  async list(params: { page: number; pageSize: number; search?: string }): Promise<Paginated<<Entity>Response>> {
    const { items, total } = await this.repo.findMany(params);
    return paginate(items, total, params);
  }

  async create(input: Create<Entity>Dto, userId: string): Promise<<Entity>Response> {
    // reglas de negocio aquí (unicidad, normalizaciones, etc.)
    return this.repo.create({ ...input, createdBy: userId });
  }

  async update(id: string, patch: Update<Entity>Dto, userId: string): Promise<<Entity>Response> {
    const updated = await this.repo.update(id, { ...patch, updatedBy: userId });
    if (!updated) throw new NotFoundError('<Entity>');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const ok = await this.repo.softDelete(id, userId);
    if (!ok) throw new NotFoundError('<Entity>');
  }
}

export const <feature>Service = new <Feature>Service();
```

### `<feature>.controller.ts`

```ts
import type { Context } from 'hono';
import { ok } from '@/shared/lib/response';
import { <feature>Service } from './<feature>.service';
import type { Create<Entity>Dto, Update<Entity>Dto } from './<feature>.types';

export const <feature>Controller = {
  list: async (c: Context) => {
    const q = c.get('query') as { page: number; pageSize: number; search?: string };
    return ok(c, await <feature>Service.list(q));
  },

  getById: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    return ok(c, await <feature>Service.getById(id));
  },

  create: async (c: Context) => {
    const body = c.get('json') as Create<Entity>Dto;
    const user = c.get('user');
    return ok(c, await <feature>Service.create(body, user.sub), 201);
  },

  update: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    const body = c.get('json') as Update<Entity>Dto;
    const user = c.get('user');
    return ok(c, await <feature>Service.update(id, body, user.sub));
  },

  remove: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    const user = c.get('user');
    await <feature>Service.remove(id, user.sub);
    return ok(c, { deleted: true });
  },
};
```

### `<feature>.routes.ts`

```ts
import { Hono } from 'hono';
import { auth, authorize } from '@/shared/middlewares/auth';
import { validate } from '@/shared/middlewares/validate';
import type { HonoEnv } from '@/shared/types/context';
import { <feature>Controller } from './<feature>.controller';
import { create<Entity>Schema, update<Entity>Schema, listQuerySchema, idParamSchema } from './<feature>.validation';

const router = new Hono<HonoEnv>();

router.use('*', auth());

/**
 * @swagger
 * /api/<feature>:
 *   get:
 *     tags: [<Feature>]
 *     summary: List <feature> (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.get('/', validate(listQuerySchema, 'query'), <feature>Controller.list);

/**
 * @swagger
 * /api/<feature>/{id}:
 *   get:
 *     tags: [<Feature>]
 *     summary: Get a single <feature> by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/:id', validate(idParamSchema, 'param'), <feature>Controller.getById);

/**
 * @swagger
 * /api/<feature>:
 *   post:
 *     tags: [<Feature>]
 *     summary: Create a new <feature>
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Created }
 *       422: { description: Validation error }
 */
router.post('/', authorize('admin'), validate(create<Entity>Schema, 'json'), <feature>Controller.create);

/**
 * @swagger
 * /api/<feature>/{id}:
 *   patch:
 *     tags: [<Feature>]
 *     summary: Update a <feature>
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.patch('/:id',
  authorize('admin'),
  validate(idParamSchema, 'param'),
  validate(update<Entity>Schema, 'json'),
  <feature>Controller.update,
);

/**
 * @swagger
 * /api/<feature>/{id}:
 *   delete:
 *     tags: [<Feature>]
 *     summary: Soft-delete a <feature>
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.delete('/:id', authorize('admin'), validate(idParamSchema, 'param'), <feature>Controller.remove);

export const <feature>Routes = router;
```

### `<feature>.module.ts`

```ts
export { <feature>Routes as <feature>Module } from './<feature>.routes';
```

## Registro del módulo

Después de crear los 8 archivos:

1. **`src/app.ts`** — importa y monta:

   ```ts
   import { <feature>Module } from '@/modules/<feature>/<feature>.module';
   // ...
   app.route('/api/<feature>', <feature>Module);
   ```

2. **`src/db/schema.ts`** — re-exporta el schema:

   ```ts
   export * from '@/modules/<feature>/<feature>.schema';
   ```

3. Genera el SQL, pero **no apliques la migración tú** — el usuario la ejecuta él mismo (regla de BD en
   `eecheverria-senior-dev`). Recuérdale:
   - `npm run db:generate` para crear la migración SQL (esto sí puedes correrlo; solo genera el archivo).
   - **Revisar el SQL generado antes de aplicar** (sobre todo en PlanetScale: sin `ALTER TABLE ... DROP COLUMN` en producción sin deploy request).
   - Que **él** corra `npm run db:push` (dev) o aplique la migración manualmente (prod). Tú deja el SQL listo en `db/migrations/` (o `db/scripts/`), no lo apliques.

## Ejemplo completo: módulo `products`

Stack mínimo de un módulo realista: tabla con relaciones simples, búsqueda, paginación, soft delete, roles. Sirve como referencia exacta de cómo debe verse el output cuando el usuario pide "agrega el módulo de productos".

### `products.schema.ts`

```ts
import { mysqlTable, varchar, decimal, int } from 'drizzle-orm/mysql-core';
import { baseColumns } from '@/db/baseColumns';

export const productsTable = mysqlTable('products', {
  ...baseColumns,
  sku: varchar('sku', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: varchar('description', { length: 1000 }),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  stock: int('stock').notNull().default(0),
});

export type ProductRow = typeof productsTable.$inferSelect;
```

### `products.types.ts`

```ts
export type ProductResponse = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductDto = {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
};

export type UpdateProductDto = Partial<CreateProductDto>;
```

### `products.validation.ts`

```ts
import Joi from 'joi';

export const createProductSchema = Joi.object({
  sku: Joi.string().trim().alphanum().min(2).max(64).required(),
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow(''),
  price: Joi.number().precision(2).min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
});

export const updateProductSchema = Joi.object({
  sku: Joi.string().trim().alphanum().min(2).max(64),
  name: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(1000).allow(''),
  price: Joi.number().precision(2).min(0),
  stock: Joi.number().integer().min(0),
}).min(1);

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
});
```

### `products.repository.ts`

```ts
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { productsTable, type ProductRow } from './products.schema';
import type { CreateProductDto, UpdateProductDto, ProductResponse } from './products.types';
import type { PaginationParams } from '@/shared/lib/pagination';

const toResponse = (row: ProductRow): ProductResponse => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  stock: row.stock,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class ProductsRepository {
  async findById(id: string): Promise<ProductResponse | null> {
    const [row] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, id), isNull(productsTable.deletedAt)))
      .limit(1);
    return row ? toResponse(row) : null;
  }

  async findBySku(sku: string): Promise<ProductResponse | null> {
    const [row] = await db.select().from(productsTable)
      .where(and(eq(productsTable.sku, sku), isNull(productsTable.deletedAt)))
      .limit(1);
    return row ? toResponse(row) : null;
  }

  async findMany(params: PaginationParams & { search?: string }): Promise<{ items: ProductResponse[]; total: number }> {
    const searchTerm = params.search ? `%${params.search}%` : undefined;
    const where = and(
      isNull(productsTable.deletedAt),
      searchTerm ? or(like(productsTable.name, searchTerm), like(productsTable.sku, searchTerm)) : undefined,
    );

    const offset = (params.page - 1) * params.pageSize;
    const [rows, [countRow]] = await Promise.all([
      db.select().from(productsTable).where(where).orderBy(desc(productsTable.createdAt)).limit(params.pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
    ]);

    return { items: rows.map(toResponse), total: Number(countRow.count) };
  }

  async create(input: CreateProductDto & { createdBy: string }): Promise<ProductResponse> {
    const id = crypto.randomUUID();
    await db.insert(productsTable).values({
      id,
      sku: input.sku,
      name: input.name,
      description: input.description ?? null,
      price: String(input.price),
      stock: input.stock ?? 0,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    });
    const created = await this.findById(id);
    if (!created) throw new Error('Failed to load created product');
    return created;
  }

  async update(id: string, patch: UpdateProductDto & { updatedBy: string }): Promise<ProductResponse | null> {
    const dbPatch: Record<string, unknown> = { updatedBy: patch.updatedBy, updatedAt: new Date() };
    if (patch.sku !== undefined) dbPatch.sku = patch.sku;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.price !== undefined) dbPatch.price = String(patch.price);
    if (patch.stock !== undefined) dbPatch.stock = patch.stock;

    await db.update(productsTable).set(dbPatch)
      .where(and(eq(productsTable.id, id), isNull(productsTable.deletedAt)));
    return this.findById(id);
  }

  async softDelete(id: string, updatedBy: string): Promise<boolean> {
    const result = await db.update(productsTable)
      .set({ deletedAt: new Date(), updatedBy })
      .where(and(eq(productsTable.id, id), isNull(productsTable.deletedAt)));
    return result[0].affectedRows > 0;
  }
}

export const productsRepository = new ProductsRepository();
```

### `products.service.ts`

```ts
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { paginate, type Paginated } from '@/shared/lib/pagination';
import { productsRepository } from './products.repository';
import type { CreateProductDto, UpdateProductDto, ProductResponse } from './products.types';

export class ProductsService {
  constructor(private readonly repo = productsRepository) {}

  async getById(id: string): Promise<ProductResponse> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Product');
    return found;
  }

  async list(params: { page: number; pageSize: number; search?: string }): Promise<Paginated<ProductResponse>> {
    const { items, total } = await this.repo.findMany(params);
    return paginate(items, total, params);
  }

  async create(input: CreateProductDto, userId: string): Promise<ProductResponse> {
    const existing = await this.repo.findBySku(input.sku);
    if (existing) throw new ConflictError(`Product with sku "${input.sku}" already exists`);
    return this.repo.create({ ...input, createdBy: userId });
  }

  async update(id: string, patch: UpdateProductDto, userId: string): Promise<ProductResponse> {
    if (patch.sku) {
      const existing = await this.repo.findBySku(patch.sku);
      if (existing && existing.id !== id) throw new ConflictError(`Product with sku "${patch.sku}" already exists`);
    }
    const updated = await this.repo.update(id, { ...patch, updatedBy: userId });
    if (!updated) throw new NotFoundError('Product');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const ok = await this.repo.softDelete(id, userId);
    if (!ok) throw new NotFoundError('Product');
  }
}

export const productsService = new ProductsService();
```

### `products.controller.ts`

```ts
import type { Context } from 'hono';
import { ok } from '@/shared/lib/response';
import { productsService } from './products.service';
import type { CreateProductDto, UpdateProductDto } from './products.types';

export const productsController = {
  list: async (c: Context) => {
    const q = c.get('query') as { page: number; pageSize: number; search?: string };
    return ok(c, await productsService.list(q));
  },
  getById: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    return ok(c, await productsService.getById(id));
  },
  create: async (c: Context) => {
    const body = c.get('json') as CreateProductDto;
    const user = c.get('user');
    return ok(c, await productsService.create(body, user.sub), 201);
  },
  update: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    const body = c.get('json') as UpdateProductDto;
    const user = c.get('user');
    return ok(c, await productsService.update(id, body, user.sub));
  },
  remove: async (c: Context) => {
    const { id } = c.get('param') as { id: string };
    const user = c.get('user');
    await productsService.remove(id, user.sub);
    return ok(c, { deleted: true });
  },
};
```

### `products.routes.ts` y `products.module.ts`

Calcados de la plantilla genérica reemplazando `<feature>` por `products` y `<Entity>` por `Product`. El JSDoc swagger en cada handler describe `Product`. Reusa `auth()` + `authorize('admin')` para mutaciones, `auth()` solo para lecturas.

Después: importar `productsModule` en `app.ts` con `app.route('/api/products', productsModule)`, re-exportar `products.schema.ts` en `db/schema.ts`, y correr `npm run db:generate`.
