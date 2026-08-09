---
name: eecheverria-observability
description: Instrumenta el código para poder OPERAR y diagnosticar en producción (Hono + Drizzle en el backend, React en el frontend). Tesis — la instrumentación se escribe JUNTO con la feature, no después, igual que los tests. Cubre logging estructurado con pino y correlation IDs, métricas RED/USE con prom-client, tracing con OpenTelemetry, alerting sobre síntomas, y health checks (/health liveness + readiness). Actívate SIEMPRE que el usuario diga frases como "agrega logs a esto", "cómo monitoreo esto", "métricas de este endpoint", "no sé qué pasa en producción", "agrega trazas", "configura alertas", "health check", "structured logging" o "correlation id", o cuando construya cualquier feature que correrá en producción. Complementa a eecheverria-senior-dev (disciplina de trabajo) y a las skills de stack (eecheverria-backend-hono-drizzle, eecheverria-frontend-react). Si vas a construir algo que correrá en producción, instruméntalo — actívala.
---

# eecheverria-observability

## Resumen

**Código que no puedes observar es código que no puedes operar.** Observabilidad es poder responder "¿qué está haciendo el sistema y por qué?" desde afuera, usando la telemetría que el código emite. La instrumentación NO es un agregado post-lanzamiento: se escribe junto con la feature, igual que los tests. Si una feature sale a producción sin telemetría, el primer bug reportado se convierte en arqueología en vez de en una query.

El porqué: en el momento en que algo falla en producción, ya no puedes agregar los logs que te faltaban — solo tienes lo que emitiste antes. Instrumentar mientras construyes cuesta cinco minutos; instrumentar después de un incidente cuesta el incidente.

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo `eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- Construyes cualquier feature que correrá en producción.
- Agregas un servicio, endpoint, job en background o integración externa nuevos.
- Un incidente de producción tardó demasiado en diagnosticarse ("no supimos qué pasó").
- Configuras o revisas reglas de alerting.
- Revisas un PR que agrega I/O, reintentos, colas o llamadas entre servicios.

**Cuándo NO usarla:**
- Estás depurando una falla que ocurre AHORA mismo — eso es depuración reactiva; esta skill es lo que hace esa depuración rápida la próxima vez, porque dejó rastro.
- Ya identificaste lentitud medida y quieres arreglarla — la OPTIMIZACIÓN se delega a `eecheverria-performance` (que mide → arregla → verifica). Esta skill produce las señales; aquella las consume.

## Proceso

El flujo es siempre el mismo, y termina verificando la telemetría misma:

```
1. PREGUNTA  → Define "qué es funcionar" con las preguntas de on-call
2. ELIGE     → Escoge la señal correcta para cada pregunta
3. IMPLEMENTA→ Logging / métricas / tracing según corresponda
4. VERIFICA  → Confirma que la telemetría realmente responde las preguntas
```

### Paso 1: Define "funcionar" ANTES de instrumentar

Telemetría sin pregunta es ruido. Antes de agregar nada, escribe 2–4 preguntas que un ingeniero de on-call se hará sobre esta feature:

```
FEATURE: reintento de pago en checkout
PREGUNTAS QUE HARÁ ON-CALL:
1. ¿Qué fracción de pagos pasa al primer intento vs. tras reintentar?
2. Cuando un pago falla definitivamente, ¿por qué? (error del proveedor? timeout? validación?)
3. ¿El proveedor de pagos está más lento de lo normal?
→ Cada señal de abajo debe ayudar a responder una de estas.
```

Si no puedes nombrar las preguntas, no estás listo para instrumentar: vas a loguear todo y no aprender nada.

### Paso 2: Elige la señal correcta para cada pregunta

| Señal | Responde | Perfil de costo | Ejemplo |
|---|---|---|---|
| **Log estructurado** | "¿Qué pasó en este caso concreto?" | Por evento; crece con el tráfico | `payment_failed` con el código de error del proveedor |
| **Métrica** | "¿Con qué frecuencia / qué tan rápido, en agregado?" | Fijo por serie; barato de consultar | p99 de latencia de las llamadas al proveedor |
| **Traza** | "¿Dónde se fue el tiempo entre servicios?" | Por request; normalmente muestreado | Un checkout lento, desglosado por salto |

Regla mnemónica: las **métricas** te dicen **que** algo está mal, las **trazas** te dicen **dónde**, los **logs** te dicen **por qué**.

### Paso 3a: Logging estructurado (pino sobre Hono)

Loguea eventos, no prosa. Cada línea es un objeto JSON con un nombre de evento estable y campos machine-readable. Hono trae un `logger()` nativo (útil para el request básico), pero para logging estructurado usa **pino**.

```ts
// MAL: interpolación de strings — no consultable, inconsistente
logger.info(`Pago ${id} falló para user ${userId} tras ${n} reintentos`);

// BIEN: nombre de evento estable + campos estructurados
logger.warn({
  event: 'payment_failed',   // nombre estable → puedes filtrar por él siempre
  paymentId: id,
  provider: 'stripe',
  errorCode: err.code,
  attempt: n,
}, 'pago falló');
```

**Niveles de log — úsalos consistentemente:**

| Nivel | Significado | Acción de on-call |
|---|---|---|
| `error` | Invariante roto; alguien puede tener que actuar | Investigar |
| `warn` | Degradado pero manejado (reintento OK, se usó fallback) | Vigilar tendencia |
| `info` | Evento de negocio significativo (orden creada, job terminado) | Ninguna |
| `debug` | Detalle diagnóstico | Apagado en producción por defecto |

**Los correlation IDs son OBLIGATORIOS.** Genera (o acepta) un request ID en la FRONTERA del sistema y adjúntalo a cada línea de log, span y llamada saliente. Sin él no puedes reconstruir un solo request entre logs entremezclados. En Hono va como middleware, usando `c.set`/`c.var` y el header `x-request-id`:

```ts
import { createMiddleware } from 'hono/factory';
import pino from 'pino';

const logger = pino();

// Middleware de Hono: request ID en la frontera + logger hijo por request
export const requestContext = createMiddleware(async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId', requestId);
  // logger hijo: todo lo que loguee este request lleva el requestId sin repetirlo
  c.set('log', logger.child({ requestId }));
  c.header('x-request-id', requestId); // devuélvelo para poder correlacionar desde el cliente
  await next();
});

// En un handler: el log ya viene correlacionado
app.get('/api/users/:id', (c) => {
  c.var.log.info({ event: 'user_fetch', userId: c.req.param('id') }, 'buscando usuario');
  // ...
});
```

Propaga el `requestId` como header `x-request-id` en TODA llamada saliente (a otros servicios, a APIs externas): así una traza cruza fronteras.

**NUNCA loguees secretos, tokens, contraseñas ni PII completa.** Los pipelines de telemetría son una vía clásica de fuga de datos; esta regla se coordina con `eecheverria-security`. Usa una **allowlist** de campos — no loguees el body entero de un request:

```ts
// MAL: loguea el body completo → arrastra password, tarjeta, token
c.var.log.info({ event: 'login_attempt', body: await c.req.json() });

// BIEN: allowlist explícita de campos seguros
c.var.log.info({ event: 'login_attempt', email_domain: domain, ip: c.req.header('x-forwarded-for') });
```

pino soporta `redact` para censurar rutas concretas (`password`, `authorization`) como red de seguridad — pero la allowlist es la defensa principal.

### Paso 3b: Métricas — RED por endpoint y dependencia, USE por recurso

Para servicios manejados por requests, instrumenta **RED** en cada endpoint y cada dependencia externa: **R**ate (req/s), **E**rrors (tasa de fallo), **D**uration (histograma de latencia, no promedio). Para recursos (colas, pools, hosts) usa **USE**: **U**tilización, **S**aturación, **E**rrores. Puedes usar `prom-client` o el API de métricas de OpenTelemetry — las reglas de cardinalidad y percentiles son idénticas.

```ts
import { Histogram } from 'prom-client';

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP',
  labelNames: ['method', 'route', 'status_class'], // '2xx', no '200'
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// Middleware de Hono: el label `route` = PATRÓN de ruta, no la URL concreta
app.use('*', async (c, next) => {
  const end = httpDuration.startTimer();
  await next();
  end({
    method: c.req.method,
    route: c.req.routePath,                    // '/api/users/:id', NO '/api/users/42'
    status_class: `${Math.floor(c.res.status / 100)}xx`,
  });
});
```

**La cardinalidad es el modo de falla.** Cada combinación única de labels es una serie temporal separada. Los labels deben venir de conjuntos pequeños y fijos (patrón de ruta, clase de status, nombre del proveedor). NUNCA uses user IDs, URLs crudas, emails o mensajes de error como label: eso hace explotar el backend de métricas y pertenece a logs y trazas.

```
OK como label:     route="/api/users/:id"   status_class="5xx"   provider="stripe"
NUNCA como label:  user_id, email, request_id, URL completa, texto del mensaje de error
```

**Instrumenta la duración de las queries Drizzle como dependencia externa** — la BD es tu dependencia más frecuente y su latencia es lo primero que preguntará on-call:

```ts
const dbDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duración de queries a la BD',
  labelNames: ['operation'],  // 'users.findMany' — conjunto acotado, nunca el SQL con valores
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

async function timedQuery<T>(operation: string, run: () => Promise<T>): Promise<T> {
  const end = dbDuration.startTimer({ operation });
  try {
    return await run();
  } finally {
    end();
  }
}

// Uso
const users = await timedQuery('users.findMany', () => db.query.users.findMany());
```

**Percentiles siempre, promedios nunca:** un promedio esconde al 1% de usuarios que la está pasando pésimo. Usa histogramas y lee **p50/p95/p99**.

### Paso 3c: Tracing distribuido con OpenTelemetry

Usa OpenTelemetry — es el estándar neutral de proveedor, y la auto-instrumentación cubre HTTP y clientes de BD comunes con casi cero código:

```ts
// tracing.ts — DEBE importarse antes que cualquier otra cosa (arriba del entrypoint)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'panel-admin-api',
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

Agrega spans manuales SOLO alrededor de unidades de trabajo internas significativas (`applyDiscounts`, `chargeProvider`) y adjunta los atributos por los que on-call filtrará. Propaga el contexto en TODA frontera async — headers HTTP, metadata de mensajes de cola — o la traza muere en el hueco. Muestrea head-based a tasa baja por defecto; conserva el 100% de los errores si tu backend soporta tail sampling. (Si dudas de la API exacta de tu versión de OTel/SDK, verifica con `eecheverria-source-driven`.)

### Frontend (React) — brevemente

El grueso de la observabilidad de estos proyectos es backend, pero el cliente también emite señales que el servidor no ve:

- **Errores de cliente:** captura excepciones no manejadas y envíalas a tu backend/servicio de errores con el `requestId` de la última llamada, para cruzarlas con los logs del servidor.
- **Web Vitals (LCP/INP/CLS):** son la telemetría de experiencia real del usuario. Repórtalos como RUM. El detalle de umbrales y cómo actuar sobre ellos vive en `eecheverria-performance`.

## Health checks (endpoint `/health`)

Todo servicio administrativo necesita un `/health`. Distingue dos preguntas distintas — confundirlas provoca reinicios en cascada:

- **Liveness** — "¿el proceso está vivo?" Si falla, el orquestador reinicia el pod. NO debe tocar dependencias: una BD caída no debe reiniciar tu app.
- **Readiness** — "¿puedo atender tráfico AHORA?" Si falla, el balanceador deja de mandarle requests (pero NO reinicia). Aquí SÍ verificas dependencias con un ping ligero.

```ts
import { sql } from 'drizzle-orm';

// Liveness: barato, sin dependencias. Responde si el event loop respira.
app.get('/health/live', (c) => c.json({ status: 'ok' }));

// Readiness: verifica dependencias con un ping LIGERO (no una query real de negocio)
app.get('/health/ready', async (c) => {
  try {
    // Ping mínimo a la BD vía Drizzle — SELECT 1, nada más
    await db.execute(sql`select 1`);
    return c.json({ status: 'ok', db: 'up' });
  } catch (err) {
    c.var.log.error({ event: 'readiness_failed', err: String(err) }, 'readiness falló');
    return c.json({ status: 'degraded', db: 'down' }, 503); // 503 → sácame del balanceador
  }
});
```

Por qué el ping ligero: si readiness corre una query pesada, el propio health check carga la BD y puede tumbar el servicio que intenta proteger. Un `select 1` confirma conectividad y pool sin costo.

## Alerting — sobre SÍNTOMAS que sienten los usuarios

Alerta sobre **síntomas que el usuario siente**, no sobre causas:

```
SÍNTOMA (merece page):              CAUSA (dashboard, no page):
tasa de error > 1% por 5 min        CPU al 85%
p99 de latencia > 2s                un pod reinició
edad de la cola > 10 min            disco al 70%
```

Las alertas sobre causas suenan cuando nada está mal y se pierden fallas que no predijiste. Las alertas sobre síntomas suenan exactamente cuando el usuario está sufriendo, sin importar la causa.

Reglas para cada alerta que crees:

1. **Debe ser accionable.** Si la respuesta es "ignórala, se auto-resuelve", borra la alerta.
2. **Enlaza a un runbook** — aunque sean tres líneas: qué significa, primera query a correr, ruta de escalación.
3. **Tiene umbral y duración** justificados por el SLO o por datos históricos, no por una corazonada.
4. **Solo dos severidades:** **page** (afecta al usuario, actúa ya) y **ticket** (degradación, actúa esta semana). Una tercera se vuelve ruido que entrena a la gente a ignorar todo.

## Verifica la telemetría misma

La instrumentación es código; puede estar mal. Antes de dar el trabajo por terminado, dispara los caminos y mira la salida real:

- Fuerza un error en staging → encuéntralo en los logs por `requestId`, confirma que los campos están estructurados (no `[object Object]`).
- Manda tráfico de prueba → confirma que las series de métricas aparecen con los labels esperados y valores sensatos.
- Sigue un request entre servicios en la UI de tracing → sin spans rotos.
- Dispara cada alerta nueva una vez (baja el umbral temporalmente) → confirma que llega al canal correcto y que el link del runbook funciona.

Para correr la suite que valida la correctness, usa los comandos de test del proyecto.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Agrego logging después de que funcione" | "Después" se vuelve "después del primer incidente", el momento más caro para descubrir que estás ciego. Instrumenta mientras construyes. |
| "Más logs = más observabilidad" | Ruido sin estructura hace los incidentes más lentos, no más rápidos. Tres eventos consultables ganan a trescientas líneas de prosa. |
| "console.log basta por ahora" | Salida sin estructura no se filtra, ni correlaciona, ni alerta. El logger estructurado cuesta cinco minutos una vez. |
| "Ya miramos los dashboards cuando algo rompa" | Un dashboard armado sin preguntas te muestra todo menos la respuesta. Parte de las preguntas de on-call. |
| "Alertamos todo lo importante y afinamos luego" | Un pager ruidoso entrena a ignorarlo. El afinado nunca llega; la page real perdida sí. |
| "User ID como label facilita depurar" | También hace caer tu backend de métricas. La alta cardinalidad va en logs y trazas. |
| "Tracing es sobrado para dos servicios" | Dos servicios ya implican preguntas de latencia entre ellos que los logs no responden. La auto-instrumentación lo hace trivial. |

## Red flags

- Un PR de feature con reintentos, colas o llamadas externas y CERO telemetría nueva.
- Líneas de log armadas por interpolación en vez de campos estructurados.
- Sin correlation/request ID — cada línea de log es huérfana.
- Métricas con labels de user ID, URL cruda o texto de error (bomba de cardinalidad).
- Latencia como promedio, sin percentiles.
- Alertas que suenan a diario y se reconocen sin acción.
- Alertas sobre causas (CPU, memoria) paginando humanos mientras la tasa de error de cara al usuario no se monitorea.
- Secretos, tokens o bodies completos apareciendo en logs.
- `/health/ready` que corre una query pesada y termina cargando la BD que debía cuidar.
- "Funciona en mi máquina" como única evidencia de que una feature de producción está sana.

## Verificación

Después de instrumentar una feature, confirma:

- [ ] Las preguntas de on-call de esta feature están escritas, y cada señal mapea a una.
- [ ] Toda la salida de log es estructurada (JSON), con nombres de evento estables y un correlation ID en cada línea (middleware de Hono + `logger.child`).
- [ ] Ningún secreto, token ni PII sin censurar en ningún log (revisa la salida real; usa allowlist).
- [ ] Existen métricas RED en cada endpoint nuevo y cada dependencia externa (incluida la duración de queries Drizzle), con labels acotados.
- [ ] El label `route` es el patrón de Hono (`/api/users/:id`), nunca la URL con el valor concreto.
- [ ] La latencia es un histograma; p95/p99 son consultables (no promedios).
- [ ] Un request se puede seguir de punta a punta en la UI de tracing sin spans rotos; el contexto se propaga en las fronteras async.
- [ ] Existe `/health` con liveness (sin dependencias) y readiness (ping ligero a la BD vía Drizzle, 503 si falla).
- [ ] Cada alerta nueva es sobre síntomas, tiene link a runbook, dos severidades, y se disparó una vez de prueba.
- [ ] Una falla inducida en staging se localizó solo con telemetría, sin leer el código fuente.

## Cómo encaja con las demás skills

- **`eecheverria-senior-dev`** — capa base de disciplina; esta skill la complementa aplicando "instrumenta mientras construyes" en cada feature.
- **`eecheverria-backend-hono-drizzle`** / **`eecheverria-frontend-react`** — las skills de stack; aquí vive el "cómo" de la telemetría en Hono/Drizzle y las señales de cliente en React.
- **`eecheverria-performance`** — cuando la telemetría revele lentitud, la optimización (medir → arreglar → verificar) se delega ahí. Esta skill produce las señales; aquella las consume.
- **`eecheverria-security`** — la regla de no loguear secretos/PII se coordina con ella.
- **`eecheverria-doubt-driven`** — los correlation IDs facilitan el diagnóstico y la revisión adversarial de decisiones de riesgo.
