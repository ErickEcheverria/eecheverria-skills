---
name: eecheverria-performance
description: Optimiza el rendimiento con DISCIPLINA DE MEDICIÓN para eecheverria — proceso MEASURE → IDENTIFY → FIX → VERIFY → GUARD que rechaza la optimización prematura ("mide antes de optimizar"). Cubre Core Web Vitals (LCP/INP/CLS con umbrales), árbol de decisión "¿qué está lento?", tablas síntoma→causa (frontend y backend), fixes de anti-patrones (N+1 en Drizzle, paginación, imágenes con picture/srcset, re-renders en React, bundle/code splitting, caching), el paso VERIFY ("neutral = revertir"), un ledger de intentos y performance budget en CI. Actívate SIEMPRE que el usuario diga frases como "esto está lento", "optimiza esta query", "por qué tarda tanto", "mejora el rendimiento", "el bundle pesa mucho", "se re-renderiza de más", "tengo un N+1", "mide el performance", o cuando existan requisitos de rendimiento o sospechas de regresión. Complementa a eecheverria-senior-dev (disciplina de trabajo) y a las skills de stack (eecheverria-frontend-react, eecheverria-backend-hono-drizzle, eecheverria-api-design, eecheverria-source-driven). Ante cualquier problema o duda de rendimiento, actívala — pero mide primero.
---

# eecheverria-performance

## Resumen

**Mide antes de optimizar.** El trabajo de rendimiento sin medición es adivinar — y adivinar lleva a optimización prematura que agrega complejidad sin mejorar lo que importa. Perfila primero, identifica el cuello de botella real, arréglalo, y vuelve a medir. Optimiza SOLO lo que las mediciones demuestran que importa.

El porqué: código que conservas, lo mantienes para siempre. Una "optimización" neutral te cobra mantenimiento eterno y no te devolvió nada. Por eso la medición no es opcional: es lo que separa una mejora real de complejidad acumulada.

## Skill viva — no te auto-edites

Documento vivo del usuario (eecheverria@paloblanco.com). Si detectas algo que mejoraría la skill, propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no requiere preguntar.

## Cuándo usarla

- Existen requisitos de rendimiento en la spec (presupuestos de carga, SLAs de respuesta).
- Usuarios o monitoreo reportan lentitud.
- Los Core Web Vitals están por debajo de los umbrales.
- Sospechas que un cambio introdujo una regresión.
- Construyes features que manejan grandes volúmenes de datos o alto tráfico.

**Cuándo NO usarla:** no optimices antes de tener evidencia de un problema. La optimización prematura agrega complejidad que cuesta más que el rendimiento que gana. Esto refuerza la disciplina de alcance de `eecheverria-senior-dev`: no expandas el trabajo por corazonadas.

## Objetivos de Core Web Vitals

| Métrica | Bueno | Mejorable | Pobre |
|--------|------|-----------|-------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## El flujo de optimización

```
1. MEASURE  → Establece una línea base con datos reales
2. IDENTIFY → Encuentra el cuello de botella real (no el asumido)
3. FIX      → Ataca ese cuello de botella específico
4. VERIFY   → Vuelve a medir; conserva o revierte
5. GUARD    → Agrega monitoreo o tests para prevenir regresión
```

### Paso 1: MEASURE (medir)

Dos enfoques complementarios — usa ambos:

- **Sintético (Lighthouse, pestaña Performance de DevTools):** condiciones controladas, reproducible. Ideal para detección de regresiones en CI y aislar problemas específicos.
- **RUM (librería web-vitals, CrUX):** datos de usuarios reales en condiciones reales. Necesario para validar que un fix realmente mejoró la experiencia.

**Frontend:**
```ts
// Sintético: Lighthouse en Chrome DevTools (o CI)
// DevTools → pestaña Performance → Grabar

// RUM: librería web-vitals en el código
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

**Backend (Hono + Drizzle):**
```ts
// Timing simple alrededor de la query
console.time('db-query');
const result = await db.query.tasks.findMany();
console.timeEnd('db-query');

// Middleware de Hono para medir latencia por request
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  console.log(`${c.req.method} ${c.req.path} — ${(performance.now() - start).toFixed(1)}ms`);
});
```

### Dónde empezar a medir

Usa el síntoma para decidir qué medir primero:

```
¿Qué está lento?
├── Primera carga de página
│   ├── ¿Bundle grande? --> Mide el tamaño del bundle, revisa code splitting
│   ├── ¿Respuesta lenta del servidor? --> Mide TTFB en la cascada de red de DevTools
│   │   ├── ¿DNS largo? --> Agrega dns-prefetch / preconnect a orígenes conocidos
│   │   ├── ¿TCP/TLS largo? --> Habilita HTTP/2, revisa deploy en edge, keep-alive
│   │   └── ¿Espera (servidor) larga? --> Perfila backend, revisa queries y caching
│   └── ¿Recursos que bloquean el render? --> Revisa CSS/JS bloqueante en la cascada
├── La interacción se siente lenta
│   ├── ¿UI se congela al hacer clic? --> Perfila el main thread, busca long tasks (>50ms)
│   ├── ¿Lag al escribir en un input? --> Revisa re-renders, costo de componentes controlados
│   └── ¿Jank en animaciones? --> Revisa layout thrashing, reflows forzados
├── Página después de navegar
│   ├── ¿Cargando datos? --> Mide tiempos de respuesta de la API, busca cascadas
│   └── ¿Render en cliente? --> Perfila tiempo de render, busca N+1 de fetches
└── Backend / API
    ├── ¿Un endpoint lento? --> Perfila queries de la BD, revisa índices
    ├── ¿Todos los endpoints lentos? --> Revisa pool de conexiones, memoria, CPU
    └── ¿Lentitud intermitente? --> Revisa contención de locks, GC, deps externas
```

### Paso 2: IDENTIFY (identificar el cuello de botella)

Verifica, no asumas — no adivines la causa. Cuellos de botella comunes por categoría:

**Frontend:**

| Síntoma | Causa probable | Investigación |
|---------|---------------|---------------|
| LCP lento | Imágenes grandes, recursos bloqueantes, servidor lento | Cascada de red, tamaño de imágenes |
| CLS alto | Imágenes sin dimensiones, contenido tardío, saltos de fuente | Atribución de layout shift |
| INP pobre | JS pesado en el main thread, updates grandes de DOM | Long tasks en el trace de Performance |
| Carga inicial lenta | Bundle grande, muchas requests | Tamaño del bundle, code splitting |

**Backend:**

| Síntoma | Causa probable | Investigación |
|---------|---------------|---------------|
| Respuestas lentas de la API | N+1, índices faltantes, queries no optimizadas | Log de queries de la BD |
| Crecimiento de memoria | Referencias filtradas, cachés sin límite, payloads grandes | Snapshot del heap |
| Picos de CPU | Cómputo síncrono pesado, backtracking de regex | Perfilado de CPU |
| Latencia alta | Falta de caching, cómputo redundante, saltos de red | Trazar la request por el stack |

### Paso 3: FIX (arreglar anti-patrones comunes)

#### N+1 queries (backend — Drizzle)

Ver `eecheverria-backend-hono-drizzle` para el patrón de queries del stack.

```ts
// MAL: N+1 — una query por cada task para traer su owner
const tasks = await db.query.tasks.findMany();
for (const task of tasks) {
  task.owner = await db.query.users.findFirst({
    where: eq(users.id, task.ownerId),
  });
}

// BIEN: una sola query con relational query (`with`) — Drizzle resuelve el join
const tasks = await db.query.tasks.findMany({
  with: { owner: true },
});
```

#### Fetching sin límite → paginación

Para el diseño del contrato de paginación (offset vs. cursor, forma de la respuesta), ver `eecheverria-api-design`.

```ts
// MAL: traer todos los registros
const allTasks = await db.query.tasks.findMany();

// BIEN: paginación por offset (páginas numeradas)
const pageSize = 20;
const tasks = await db.query.tasks.findMany({
  limit: pageSize,
  offset: (page - 1) * pageSize,
  orderBy: (t, { desc }) => [desc(t.createdAt)],
});

// MEJOR para listas grandes: paginación por cursor (estable, sin saltos)
// El cursor es el último id/fecha visto; evita el costo creciente del offset.
const tasks = await db.query.tasks.findMany({
  where: cursor ? lt(schema.tasks.createdAt, cursor) : undefined,
  limit: pageSize,
  orderBy: (t, { desc }) => [desc(t.createdAt)],
});
const nextCursor = tasks.at(-1)?.createdAt ?? null;
```

#### Imágenes sin optimizar (frontend)

```html
<!-- MAL: sin dimensiones, sin optimización de formato -->
<img src="/hero.jpg" />

<!-- BIEN: imagen hero/LCP — art direction + resolution switching, alta prioridad -->
<!--
  Dos técnicas combinadas:
  - Art direction (media): distinto recorte/composición por breakpoint
  - Resolution switching (srcset + sizes): tamaño de archivo correcto por densidad
-->
<picture>
  <!-- Mobile: recorte vertical -->
  <source
    media="(max-width: 767px)"
    srcset="/hero-mobile-400.avif 400w, /hero-mobile-800.avif 800w"
    sizes="100vw" width="800" height="1000" type="image/avif" />
  <!-- Desktop: recorte apaisado -->
  <source
    srcset="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
    sizes="(max-width: 1200px) 100vw, 1200px"
    width="1200" height="600" type="image/avif" />
  <img src="/hero-desktop.jpg" width="1200" height="600"
       fetchpriority="high" alt="Descripción del hero" />
</picture>

<!-- BIEN: imagen bajo el fold — lazy + decodificación async -->
<img src="/content.webp" width="800" height="400"
     loading="lazy" decoding="async" alt="Descripción del contenido" />
```

Siempre declara `width`/`height` (o `aspect-ratio` en Tailwind, p. ej. `aspect-video`) para reservar el espacio y evitar CLS.

#### Re-renders innecesarios (React)

Coordina esto con `eecheverria-frontend-react` (arquitectura de componentes y estado).

```tsx
// MAL: crea un objeto nuevo en cada render, forzando re-render de los hijos
function TaskList() {
  return <TaskFilters options={{ sortBy: 'date', order: 'desc' }} />;
}

// BIEN: referencia estable fuera del componente
const DEFAULT_OPTIONS = { sortBy: 'date', order: 'desc' } as const;
function TaskList() {
  return <TaskFilters options={DEFAULT_OPTIONS} />;
}

// React.memo para componentes con render costoso
const TaskItem = React.memo(function TaskItem({ task }: Props) {
  return <div>{/* render costoso */}</div>;
});

// useMemo para cómputos costosos
function TaskStats({ tasks }: Props) {
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  return <div>{stats.completed} / {stats.total}</div>;
}
```

Nota: el compilador de React moderno (React Compiler) memoiza automáticamente y reduce la necesidad de `memo`/`useMemo`/`useCallback` manuales — pero el principio sigue: no crees referencias nuevas innecesarias. Si dudas de la API en tu versión de React, verifica con `eecheverria-source-driven`.

#### Bundle grande → code splitting

```ts
// Los bundlers modernos (Vite, webpack 5+) hacen tree-shaking de imports nombrados
// automáticamente si la dep es ESM y marca `sideEffects: false`. Perfila antes de
// tocar estilos de import — las ganancias reales vienen de dividir y cargar diferido.

// BIEN: import dinámico para features pesadas y poco usadas
const ChartLibrary = lazy(() => import('./ChartLibrary'));

// BIEN: code splitting por ruta envuelto en Suspense
const SettingsPage = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <SettingsPage />
    </Suspense>
  );
}
```

#### Falta de caching (backend)

Para la capa de queries y dónde vive el caching en Hono/Drizzle, ver `eecheverria-backend-hono-drizzle`.

```ts
// LENTO: consultar la BD en cada request para datos que casi no cambian
// RÁPIDO: cachear datos leídos con frecuencia y modificados raramente
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let cachedConfig: AppConfig | null = null;
let cacheExpiry = 0;

async function getAppConfig(): Promise<AppConfig> {
  if (cachedConfig && Date.now() < cacheExpiry) return cachedConfig;
  cachedConfig = await db.query.config.findFirst();
  cacheExpiry = Date.now() + CACHE_TTL;
  return cachedConfig;
}

// Cache-Control para respuestas de API (Hono)
c.header('Cache-Control', 'public, max-age=300'); // 5 minutos
```

Cuidado: no caches nada que deba estar fresco. Un caché sobre datos que cambian es un bug de correctness disfrazado de mejora.

### Paso 4: VERIFY (conservar o revertir)

Un fix es una hipótesis hasta que vuelves a medir. Este paso decide si sobrevive, y es el que los equipos se saltan.

**Vuelve a medir igual que la línea base:** mismo comando, mismas condiciones, mismo presupuesto fijo (wall-clock, número de muestras o de requests). Una base con caché frío contra un resultado con caché caliente mide el caché, no tu cambio.

**Cambia una cosa a la vez.** Tres optimizaciones juntas producen un solo número y no puedes atribuirlo. Si deben ir juntas, mide cada una en aislamiento primero.

**Gana por encima del ruido, no solo de la media.** Repite la medición y compara el delta contra la varianza entre corridas. Una ganancia de 3% dentro de ±5% de varianza no es ganancia: es otra muestra.

Luego decide, estrictamente:

| Resultado vs. base | Acción |
|---|---|
| Cruza el umbral, tests en verde | **Conservar.** Commitea con los números antes/después en el mensaje. |
| Dentro del ruido (sin cambio medible) | **Revertir.** |
| Peor | **Revertir.** |
| Mejoró, pero un test se puso rojo | **Revertir.** Una regresión disfrazada de victoria. |

**"Neutral" es revertir, no conservar.** El cambio ya está escrito, tirarlo se siente un desperdicio, así que aterriza sin medir y el código acumula complejidad que nunca compró nada. Código que conservas, lo mantienes para siempre. Que se pague solo.

**La correctness gatea la métrica.** La suite queda verde *y* el número se mueve. Una "optimización" que gana quitando trabajo que el producto necesitaba (saltarse una validación, cachear algo que debía estar fresco, quitar un `await` que sostenía algo) es una regresión, no una victoria.

#### Registra cada intento, incluidos los revertidos

El trabajo revertido no deja rastro en git — por eso la misma idea muerta se reintenta el próximo trimestre. Lleva un ledger corto para que una idea descartada siga descartada:

| Idea | Base → Resultado | Veredicto | Por qué |
|---|---|---|---|
| Memoizar el componente de fila | INP 240ms → 235ms | revertida | Dentro del ruido (±15ms). Las filas no eran el cuello. |
| Virtualizar la lista | INP 240ms → 90ms | conservada | Desaparecieron los long tasks del trace. |
| Preconnect al origen de la API | LCP 2.8s → 2.8s | revertida | Ya era mismo origen. |

Una sección en la descripción del PR o un `PERF.md` en el repo sirven. Lo importante es que la próxima persona (o el próximo agente) lo lea antes de proponer un experimento, y no re-corra uno que ya falló.

### Paso 5: GUARD (proteger contra regresiones)

## Performance budget

Fija presupuestos y aplícalos:

```
Bundle JavaScript: < 200KB gzip (carga inicial)
CSS: < 50KB gzip
Imágenes: < 200KB por imagen (sobre el fold)
Fuentes: < 100KB total
Respuesta de API: < 200ms (p95)
Time to Interactive: < 3.5s en 4G
Puntaje Lighthouse Performance: ≥ 90
```

**Aplicar en CI:**
```bash
# Chequeo de tamaño de bundle
npx bundlesize --config bundlesize.config.json

# Lighthouse CI
npx lhci autorun
```

Para correr la suite de tests que valida la correctness, usa los comandos de test del proyecto.

## Checklist de anti-patrones (inline)

- [ ] ¿Hay N+1? Reemplázalo por relational query con `with` en Drizzle.
- [ ] ¿Endpoints de lista sin `limit`/paginación? Agrega offset o cursor.
- [ ] ¿Imágenes sin `width`/`height`, `loading="lazy"` o `srcset`? Corrige para evitar CLS.
- [ ] ¿Referencias nuevas en cada render (objetos/arrays/funciones inline como props)? Estabilízalas.
- [ ] ¿Features pesadas cargadas en el bundle inicial? Divide con `lazy` + `Suspense`.
- [ ] ¿Datos leídos mucho y cambiados poco sin caché? Cachea con TTL (y no caches lo que debe estar fresco).
- [ ] ¿Falta `Cache-Control` en assets estáticos y respuestas cacheables?
- [ ] ¿Índices faltantes en columnas de filtros/joins frecuentes?

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Lo optimizamos después" | La deuda de rendimiento se compone. Arregla anti-patrones obvios ya; difiere micro-optimizaciones. |
| "En mi máquina va rápido" | Tu máquina no es la del usuario. Perfila en hardware y red representativos. |
| "Esta optimización es obvia" | Si no mediste, no sabes. Perfila primero. |
| "El usuario no nota 100ms" | La investigación muestra que 100ms afectan conversión. Se nota más de lo que crees. |
| "El framework maneja el rendimiento" | Previene algunos problemas, pero no arregla N+1 ni bundles enormes. |
| "No ayudó mucho, pero no estorba" | Un cambio neutral es un revert. Pagas mantenimiento y no ganaste nada. |
| "Ya lo escribimos, mejor lo dejamos" | Costo hundido. La medición no sabe cuánto tardaste en escribirlo. |
| "La mejora es obvia, no hace falta re-medir" | Entonces re-medir es barato y lo prueba. Las victorias sin medir son cómo aterriza la complejidad neutral. |

## Red flags

- Optimización sin datos de perfilado que la justifiquen.
- Patrones N+1 en el fetching de datos.
- Endpoints de lista sin paginación.
- Imágenes sin dimensiones, lazy loading o tamaños responsive.
- Bundle creciendo sin revisión.
- Sin monitoreo de rendimiento en producción.
- `React.memo` y `useMemo` por todos lados (abusar es tan malo como no usarlos).
- Optimizaciones conservadas sin una re-medición que las justifique.
- Varias optimizaciones metidas en una sola medición: ningún cambio se puede atribuir.
- Una "victoria" que requirió cambiar, saltar o borrar un test.
- El mismo intento fallido repetido porque nadie registró el primero.

## Verificación

Después de cualquier cambio de rendimiento:

- [ ] Existen mediciones antes y después (números específicos).
- [ ] El resultado se midió igual que la base (mismo comando, mismas condiciones).
- [ ] La mejora supera la varianza entre corridas, no solo la media.
- [ ] Los cambios que no superaron la base se revirtieron, no se dejaron como neutrales.
- [ ] Los intentos están registrados, conservados y revertidos por igual, para no re-correr una idea muerta.
- [ ] El cuello de botella específico está identificado y atacado.
- [ ] Los Core Web Vitals están dentro de umbrales "Bueno".
- [ ] El tamaño del bundle no creció significativamente.
- [ ] No hay N+1 en el nuevo código de fetching.
- [ ] El performance budget pasa en CI (si está configurado).
- [ ] Los tests existentes siguen en verde (la optimización no rompió comportamiento).
