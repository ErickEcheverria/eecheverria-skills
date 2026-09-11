---
name: eecheverria-security
description: Capa de SEGURIDAD security-first para apps web (agnóstica de stack, con ejemplos en el stack real del usuario: Hono + Drizzle + Joi + JWT). Endurece código contra vulnerabilidades tratando todo input externo como hostil. Cubre threat modeling (STRIDE, fronteras de confianza, abuse cases), sistema de tres niveles (Siempre / Preguntar primero / Nunca), OWASP Top 10, validación por esquema en fronteras, subida de archivos, higiene de dependencias (supply-chain), rate limiting, manejo de secretos y seguridad de features con LLM (OWASP LLM Top 10). Actívate SIEMPRE que el usuario diga o pienses frases como "¿esto es seguro?", "revisa la seguridad de este endpoint", "cómo protejo esto", "valida este input", "manejo de secretos/tokens", "esto es vulnerable a X", "asegura este upload", "seguridad del agente/LLM", o cuando trabaje con input de usuario, auth, almacenamiento de datos sensibles, integraciones externas, webhooks o features con LLM. Complementa a eecheverria-senior-dev (disciplina de trabajo) y a eecheverria-backend-hono-drizzle (que DELEGA aquí la parte de seguridad). Si hay cualquier duda de seguridad, actívala.
---

# Seguridad y Hardening (eecheverria)

Desarrollo **security-first** para apps web. Trata cada input externo como hostil, cada secreto como sagrado y cada chequeo de autorización como obligatorio. La seguridad no es una fase: es una restricción sobre cada línea que toca datos de usuario, autenticación o sistemas externos.

Es una capa transversal. `eecheverria-backend-hono-drizzle` **delega aquí** la parte de seguridad; la semántica de errores y el "validar en fronteras" se coordinan con `eecheverria-api-design`; y el tratamiento de "input externo / doc web como no confiable" se relaciona con `eecheverria-source-driven` y `eecheverria-doubt-driven`.

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo `eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- Construir cualquier cosa que acepte input de usuario.
- Implementar autenticación o autorización.
- Almacenar o transmitir datos sensibles.
- Integrar con APIs o servicios externos.
- Agregar subida de archivos, webhooks o callbacks.
- Manejar datos de pago o PII.
- Construir features que llaman a un LLM (chatbots, agentes, RAG).

## Proceso: primero el threat model

Los controles puestos sin threat model son adivinanzas. Antes de endurecer, dedica cinco minutos a pensar como atacante:

1. **Mapea las fronteras de confianza.** ¿Dónde cruza data no confiable hacia tu sistema? Requests HTTP, campos de formulario, uploads, webhooks, APIs de terceros, colas de mensajes y **el output del LLM**. Cada frontera es superficie de ataque.
2. **Nombra los activos.** ¿Qué vale la pena robar o romper? Credenciales, PII, datos de pago, acciones de admin, movimiento de dinero.
3. **Corre STRIDE sobre cada frontera** — una lente rápida, no una ceremonia:

| Amenaza | Pregunta | Mitigación típica |
|---|---|---|
| **S**poofing (suplantación) | ¿Pueden hacerse pasar por un usuario/servicio? | Autenticación, verificación de firmas |
| **T**ampering (manipulación) | ¿Se puede alterar la data en tránsito o en reposo? | Chequeos de integridad, queries parametrizadas, HTTPS |
| **R**epudiation (repudio) | ¿Se puede negar una acción después? | Audit logging de eventos de seguridad |
| **I**nformation disclosure (fuga) | ¿Puede filtrarse data? | Cifrado, allowlist de campos, errores genéricos |
| **D**enial of service | ¿Se puede saturar? | Rate limiting, límites de tamaño, timeouts |
| **E**levation of privilege | ¿Puede un usuario ganar permisos que no le tocan? | Chequeos de autorización, mínimo privilegio |

4. **Escribe abuse cases junto a los use cases.** Para cada feature pregunta "¿cómo abusaría de esto?" — y haz de eso tu primer test.

Si no puedes nombrar las fronteras de confianza de una feature, no estás listo para asegurarla. Esto es OWASP **A04: Diseño Inseguro** — la mayoría de las brechas nacen en el diseño, no en el código.

## Sistema de tres niveles

### Siempre (sin excepciones)

- **Valida todo input externo** en la frontera del sistema (rutas Hono, middlewares de validación).
- **Parametriza todas las queries** — nunca concatenes input en SQL. Drizzle parametriza por defecto; no lo sabotees con `sql.raw`.
- **Codifica el output** para prevenir XSS (usa el auto-escaping del framework, no lo saltes).
- **Usa HTTPS** en toda comunicación externa.
- **Hashea passwords** con bcrypt/scrypt/argon2 (nunca en texto plano).
- **Setea security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **Firma y verifica los JWT** con un secreto fuerte desde el entorno; expira los tokens.
- **Corre el audit nativo del gestor de paquetes** contra el lockfile commiteado antes de cada release.

### Preguntar primero (requiere aprobación humana)

- Agregar nuevos flujos de auth o cambiar la lógica de auth.
- Almacenar nuevas categorías de datos sensibles (PII, datos de pago).
- Agregar integraciones con servicios externos.
- Cambiar la configuración de CORS.
- Agregar handlers de subida de archivos.
- Modificar el rate limiting o throttling.
- Otorgar permisos o roles elevados.

### Nunca

- **Nunca commitees secretos** (API keys, passwords, tokens).
- **Nunca loguees datos sensibles** (passwords, tokens, número completo de tarjeta).
- **Nunca confíes en la validación del cliente** como frontera de seguridad.
- **Nunca desactives security headers** por comodidad.
- **Nunca uses `eval()` ni `innerHTML`** con data del usuario.
- **Nunca guardes tokens de auth en storage accesible por el cliente** (`localStorage`) sin entender el riesgo de XSS.
- **Nunca expongas stack traces** ni detalles internos de error al usuario.

## Envelope de errores del backend

Todos los ejemplos usan el envelope estándar del stack. Las respuestas de error mantienen esta forma para calzar con `eecheverria-api-design`:

```typescript
// { success, data, error: { code, message, details } }
type Envelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string; details?: unknown } };

// Códigos usados aquí: FORBIDDEN (403), VALIDATION_ERROR (422), UNAUTHORIZED (401), NOT_FOUND (404)
```

## Patrones de prevención OWASP Top 10

Son patrones de prevención, no un ranking.

### Inyección (SQL, NoSQL, comando OS)

```typescript
// MAL: inyección SQL por concatenación
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// BIEN: Drizzle parametriza por defecto (usa placeholders internamente)
const user = await db.select().from(users).where(eq(users.id, userId));

// BIEN: si necesitas SQL crudo, usa el tagged template (parametriza), NO sql.raw
const rows = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
```

### Autenticación (JWT con `hono/jwt`)

```typescript
import { sign, verify } from 'hono/jwt';
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 12;
// hashear al registrar; comparar al hacer login
const passwordHash = await hash(plaintext, SALT_ROUNDS);
const isValid = await compare(plaintext, passwordHash);

// emitir un token de vida corta, firmado con el secreto del entorno
const token = await sign(
  { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 }, // 1h
  process.env.JWT_SECRET!, // nunca hardcodeado
);
```

```typescript
// middleware de auth: extrae el bearer token, verifica y setea el usuario en el Context
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const authenticate = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const fail = () =>
    c.json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Token inválido o ausente' } }, 401);
  if (!token) return fail();
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set('user', { id: payload.sub as string, role: payload.role as string });
  } catch {
    return fail();
  }
  await next();
});
```

Bearer token es lo estándar del stack. Como alternativa válida, una cookie `httpOnly + secure + sameSite` evita exponer el token a JavaScript (mitiga robo por XSS) a cambio de manejar CSRF — elígela conscientemente, no por default.

### Cross-Site Scripting (XSS)

```typescript
// MAL: renderizar input del usuario como HTML
element.innerHTML = userInput;

// BIEN: usar el auto-escaping del framework (React escapa por defecto)
return <div>{userInput}</div>;

// Si DEBES renderizar HTML, sanitiza primero
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### Control de acceso roto

Autenticación (¿quién eres?) no es autorización (¿puedes hacer esto?). Verifica siempre la propiedad del recurso, no solo que haya sesión.

```typescript
// controller Hono: chequear que el usuario autenticado sea dueño del recurso
tasks.patch('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const task = await taskService.findById(c.req.param('id'));

  // 'no encontrado' primero: evita el crash de task.ownerId cuando el id no existe. Nota: devolver
  // 403 cuando el recurso existe pero no es tuyo REVELA que existe; en superficies sensibles conviene
  // devolver 404 tanto para inexistente como para ajeno, para no filtrar existencia.
  if (!task) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tarea no encontrada' } },
      404,
    );
  }

  if (task.ownerId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'No autorizado para modificar esta tarea' } },
      403,
    );
  }

  const updated = await taskService.update(task.id, await c.req.json());
  return c.json({ success: true, data: updated, error: null }, 200);
});
```

### Misconfiguración de seguridad

```typescript
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';

const app = new Hono();

// security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
  },
}));

// CORS: restringido a orígenes conocidos desde el entorno, nunca '*' con credentials
app.use('/api/*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
}));
```

### Exposición de datos sensibles

```typescript
// Nunca devuelvas campos sensibles en la respuesta de la API
function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash, resetToken, ...publicFields } = user;
  return publicFields; // el resto queda fuera del envelope
}

// Secretos desde el entorno, con fail-fast si faltan
const apiKey = process.env.STRIPE_API_KEY;
if (!apiKey) throw new Error('STRIPE_API_KEY no configurada');
```

### Server-Side Request Forgery (SSRF)

Cada vez que el servidor hace fetch de una URL influida por el usuario — webhooks, "importar desde URL", proxies de imagen, previews de link — un atacante puede apuntarla a servicios internos (metadata del cloud, `localhost`, IPs privadas).

```typescript
// MAL: hacer fetch de lo que sea que el usuario pase
await fetch(body.webhookUrl);

// BIEN: allowlist de esquema + host, rechazar si CUALQUIER IP resuelta es privada, prohibir redirects
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const ALLOWED_HOSTS = new Set(['hooks.example.com']);

async function assertSafeUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('solo https');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('host no permitido');
  // resolver TODOS los registros; una sola IP privada/reservada falla el chequeo
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.some((a) => ipaddr.parse(a.address).range() !== 'unicast')) {
    throw new Error('IP privada/reservada');
  }
  return url;
}

await fetch(await assertSafeUrl(body.webhookUrl), { redirect: 'error' });
```

El chequeo `range() !== 'unicast'` cubre loopback, link-local `169.254.169.254` (metadata del cloud, el objetivo SSRF #1), privadas y unique-local en IPv4 e IPv6.

**Cuidado — sigue habiendo un hueco TOCTOU** (time-of-check to time-of-use). `fetch` vuelve a resolver DNS después del chequeo, así que un atacante con un registro de TTL corto puede reapuntar (DNS rebinding) a una IP interna entre la validación y la conexión. Para superficies de alto riesgo: resuelve una vez y conéctate a la IP fijada, o pon un agente de filtrado delante (`request-filtering-agent`).

## Validación en las fronteras (Joi)

Valida en la frontera del sistema, antes de que la data toque la lógica de negocio. El stack usa **Joi**. Esto coordina con `eecheverria-api-design`.

```typescript
import Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim().required(),
  description: Joi.string().max(2000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.string().isoDate().optional(),
});
```

```typescript
// middleware de validación genérico: falla con el envelope y código VALIDATION_ERROR (422)
import { createMiddleware } from 'hono/factory';
import type Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) =>
  createMiddleware(async (c, next) => {
    // si el body no es JSON válido, no revientes con 500: trátalo como vacío y deja que Joi
    // responda 422 con el envelope (input malformado es justo lo que manda un atacante)
    const body = await c.req.json().catch(() => ({}));
    // abortEarly: false junta todos los errores; stripUnknown descarta campos no declarados
    const { value, error } = schema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ path: d.path, message: d.message }));
      return c.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Input inválido', details } },
        422,
      );
    }
    c.set('validatedBody', value); // ya tipado y saneado
    await next();
  });
```

`stripUnknown: true` es defensa real: evita mass assignment (que el cliente inyecte campos como `role` o `isAdmin` que no declaraste).

## Seguridad de subida de archivos

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: { mimetype: string; size: number }) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError('Tipo de archivo no permitido');
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError('Archivo demasiado grande (máx 5MB)');
  }
  // No confíes en la extensión ni en el mimetype declarado: si es crítico, verifica los magic bytes.
  // Guarda con un nombre generado (no el del usuario) y fuera del webroot / en storage aparte.
}
```

## Higiene de dependencias (supply-chain)

Los audits reportan advisories conocidos; no prueban que un paquete sea confiable ni que el código vulnerable sea alcanzable. Triaje:

```
El audit nativo reporta una vulnerabilidad
├── Severidad: critical o high
│   ├── ¿El código vulnerable es alcanzable en runtime/build/test/deploy?
│   │   ├── SÍ  --> Arregla ya (actualiza, parchea o reemplaza)
│   │   └── NO (confirmado sin uso) --> Arregla pronto, no bloquea
│   └── ¿Hay fix disponible?
│       ├── SÍ  --> Actualiza a la versión parcheada
│       └── NO  --> Busca workaround, considera reemplazar, o allowlist con fecha de revisión
├── Severidad: moderate
│   ├── ¿Alcanzable en producción? --> Arregla en el siguiente ciclo de release
│   └── ¿Solo dev? --> Arregla cuando convenga, trackea en backlog
└── Severidad: low
    └── Trackea y arregla en las actualizaciones regulares
```

Reglas de supply-chain (OWASP **A06** / **LLM03**):

- **Encuentra la frontera de instalación y el gestor real.** Corrobora `packageManager`, el lockfile y CI; detente si hay lockfiles en competencia. Pinea la versión del gestor. No asumas npm.
- **Bloquea los scripts de dependencias antes de la primera ejecución.** Bootstrapea con scripts deshabilitados, inspecciona el script pendiente, aprueba solo el mínimo, y verifica con un install limpio y congelado (frozen/immutable). Nunca apruebes scripts en bloque.
- **Nunca corras remediación forzada automática** (`npm audit fix --force` o equivalente). Previsualiza, lee changelogs y testea cada upgrade.
- **Verifica firmas y provenance** donde se soporte (`npm audit signatures`, `pnpm audit signatures`).
- **Revisa dependencias nuevas y diffs de lockfile juntos** — ownership, mantenimiento, edad del release, grafo transitivo y typosquats (`cross-env` vs `crossenv`).

## Rate limiting

```typescript
import { rateLimiter } from 'hono-rate-limiter';

// La clave del rate limit debe ser una identidad que el cliente NO pueda falsificar.
// `x-forwarded-for` lo setea el propio cliente: confía en él SOLO si estás detrás de un proxy/
// balanceador conocido que lo sobreescribe (y toma la primera IP, no toda la cadena). Si no hay
// proxy de confianza, usa la IP real del socket según el runtime — de lo contrario el atacante
// rota el header y evade el límite (el control que aquí protege contra fuerza bruta).
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const clientKey = (c) =>
  (TRUST_PROXY ? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() : c.env?.remoteAddr) ?? 'anon';

// límite general de la API
app.use('/api/*', rateLimiter({ windowMs: 15 * 60 * 1000, limit: 100, keyGenerator: clientKey }));

// límite más estricto en auth: frena fuerza bruta y credential stuffing (10 intentos / 15 min)
app.use('/api/auth/*', rateLimiter({ windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: clientKey }));
```

## Manejo de secretos

```
Archivos .env:
  ├── .env.example  → SÍ se commitea (plantilla con placeholders)
  ├── .env          → NO se commitea (secretos reales)
  └── .env.local    → NO se commitea (overrides locales)

.gitignore debe incluir:
  .env
  .env.local
  .env.*.local
  *.pem
  *.key
```

```bash
# Chequea antes de commitear (se alinea con eecheverria-git-workflow)
git diff --cached | grep -i "password\|secret\|api_key\|token"
```

**Si un secreto llega a commitearse, rótalo.** Borrar la línea o reescribir el historial no basta: asume que está comprometido desde que toca un remoto. Primero revoca y reemite la key, después purga el historial.

## Seguridad de features con LLM

Si la app llama a un LLM — chatbots, resúmenes, agentes, RAG — hereda una superficie de ataque nueva. Es relevante porque el usuario construye agentes y skills. Mapéala al [OWASP Top 10 para LLM (2025)](https://genai.owasp.org/llm-top-10/):

- **Trata todo output del modelo como input no confiable (LLM05).** Nunca pases output del LLM directo a `eval`, SQL, un shell, `innerHTML` o un path de archivo. Valídalo y codifícalo como cualquier input crudo. Esto conecta con `eecheverria-doubt-driven`.
- **Asume que los prompts se pueden secuestrar (LLM01: Prompt Injection).** Texto no confiable en la ventana de contexto — un mensaje de usuario, una página web fetcheada, un PDF — puede llevar instrucciones. El system prompt NO es una frontera de seguridad; aplica los permisos en código, no en el prompt. Trata todo doc externo como no confiable (se relaciona con `eecheverria-source-driven`).
- **Mantén secretos y datos de otros usuarios fuera de los prompts (LLM02 / LLM07).** Todo lo que esté en el contexto puede ser repetido de vuelta.
- **Acota los permisos de tools y agentes (LLM06: Excessive Agency).** Alcance mínimo, confirmación humana para acciones destructivas o irreversibles, y valida cada argumento de tool.
- **Acota el consumo (LLM10).** Límites de tokens, rate y profundidad de loop/recursión para que un input malicioso no dispare costo ni cuelgue el sistema.
- **Aísla la data de retrieval (LLM08).** En RAG, trata el vector store como frontera de confianza: particiona embeddings por tenant y valida documentos antes de indexar.

```typescript
// MAL: confiar en el output del modelo como comando o como markup
const sql = await llm.generate(`Escribe SQL para: ${userQuestion}`);
await db.execute(sql);                                 // ejecución de query arbitraria
container.innerHTML = await llm.reply(userMessage);    // XSS almacenado, vía el modelo

// BIEN: el output del modelo es DATA — parsea defensivo, valida (Joi), luego codifica
let intent;
try {
  intent = commandSchema.validate(JSON.parse(await llm.replyJson(userMessage)));
  if (intent.error) throw intent.error;
} catch {
  throw new ValidationError('output del modelo inesperado'); // falló JSON.parse o el esquema
}
await runAllowlistedAction(intent.value.action, intent.value.params);
container.textContent = await llm.reply(userMessage);  // textContent, no innerHTML
```

## Checklist de revisión de seguridad

```markdown
### Autenticación
- [ ] Passwords hasheados con bcrypt/scrypt/argon2 (salt rounds ≥ 12)
- [ ] JWT firmado con secreto fuerte desde el entorno; tokens con expiración
- [ ] Login con rate limiting
- [ ] Tokens de reset de password expiran

### Autorización
- [ ] Cada endpoint chequea permisos del usuario
- [ ] Los usuarios solo acceden a sus propios recursos (propiedad, no solo sesión)
- [ ] Acciones de admin verifican rol admin

### Input
- [ ] Todo input validado en la frontera (Joi + stripUnknown)
- [ ] Queries parametrizadas (Drizzle; sin sql.raw con input)
- [ ] Output HTML codificado/escapado
- [ ] Fetches de URL server-side con allowlist (sin SSRF a servicios internos)

### Datos
- [ ] Sin secretos en código ni control de versiones
- [ ] Campos sensibles excluidos de las respuestas de la API
- [ ] PII cifrada en reposo (si aplica)

### Infraestructura
- [ ] Security headers configurados (CSP, HSTS, etc.)
- [ ] CORS restringido a orígenes conocidos (sin '*' con credentials)
- [ ] Dependencias auditadas
- [ ] Los mensajes de error no exponen internos (usar el envelope)

### Supply chain
- [ ] Un solo lockfile autoritativo commiteado; CI usa install congelado
- [ ] Audit nativo triado por alcanzabilidad; scripts de install bloqueados salvo aprobación
- [ ] Dependencias nuevas revisadas (ownership, provenance, edad, grafo transitivo)

### LLM (si se usa)
- [ ] Output del modelo tratado como no confiable (sin eval/SQL/innerHTML/shell)
- [ ] Secretos y datos de otros usuarios fuera de los prompts
- [ ] Permisos de tools/agentes acotados; acciones destructivas piden confirmación
```

Para correr los chequeos automatizados (audit, tests, typecheck), usa los comandos de test del proyecto.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Es una herramienta interna, la seguridad no importa" | Las internas también se comprometen. El atacante busca el eslabón débil. |
| "La seguridad la agregamos después" | Retrofitear seguridad cuesta 10x. Agrégala ahora. |
| "Nadie intentaría explotar esto" | Los scanners automáticos lo encuentran. La seguridad por oscuridad no es seguridad. |
| "El framework maneja la seguridad" | Los frameworks dan herramientas, no garantías. Hay que usarlas bien. |
| "Es solo un prototipo" | Los prototipos llegan a producción. Hábitos de seguridad desde el día uno. |
| "Es solo output del LLM, es solo texto" | Ese "texto" puede ser un SQL, un script tag o un comando de shell. |
| "El audit pasó, la dependencia es segura" | Los audits matchean advisories conocidos; no detectan un paquete recién malicioso ni hacen seguros los scripts sin revisar. |

## Red flags

- Input de usuario directo a queries, comandos de shell o render de HTML.
- Secretos en el código o en el historial de commits.
- Endpoints sin chequeo de autenticación o autorización.
- CORS ausente o con wildcard (`*`) junto con credentials.
- Sin rate limiting en endpoints de auth.
- Stack traces o errores internos expuestos al usuario (en vez del envelope).
- Dependencias con vulnerabilidades critical conocidas, lockfiles en competencia o scripts aprobados en bloque.
- El servidor hace fetch de URLs del usuario sin allowlist (SSRF).
- Output del LLM pasado a una query, el DOM, un shell o `eval`.
- Secretos, PII o el system prompt completo dentro de la ventana de contexto del LLM.

## Verificación

Después de implementar código sensible a seguridad:

- [ ] El audit nativo no tiene findings critical/high alcanzables sin mitigar; CI preserva el lockfile y bloquea scripts sin revisar.
- [ ] Sin secretos en el código ni en el historial de git.
- [ ] Todo input validado en las fronteras del sistema.
- [ ] Autenticación y autorización chequeadas en cada endpoint protegido.
- [ ] Security headers presentes en la respuesta.
- [ ] Las respuestas de error no exponen detalles internos (usan el envelope).
- [ ] Rate limiting activo en endpoints de auth.
- [ ] Fetches de URL server-side validados contra allowlist (sin SSRF).
- [ ] Output del LLM validado y codificado antes de usarse (si hay features de IA).
