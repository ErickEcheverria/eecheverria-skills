---
name: eecheverria-clean-code
description: >-
  Principios de código limpio y simplificación de código para eecheverria, agnósticos de stack:
  reducir complejidad sin cambiar el comportamiento, mejorar legibilidad, eliminar redundancia y
  dejar el código como lo firmaría un senior en code review. Actívate SIEMPRE que el usuario pida
  refactorizar, simplificar, "limpiar", "ordenar" o "dejar más legible" código, o diga frases como
  "esto está muy enredado", "hazlo más limpio", "quita la duplicación", "reduce la complejidad",
  "esta función está gigante", "refactoriza esto sin romper nada", "aplica clean code", "esto tiene
  mucho anidamiento", "renombra para que se entienda", o cuando en un code review se marquen problemas
  de legibilidad, nombres, duplicación o código muerto. Es la capa de CALIDAD transversal que
  complementa a las skills de stack (React, Hono/Drizzle) y al modo de trabajo senior. Si
  dudas entre activarla ante una tarea de refactor o limpieza de código, actívala.
---

# Código Limpio y Simplificación — eecheverria

> Inspirada en el plugin oficial *Claude Code Simplifier*. Adaptada como una skill agnóstica de stack,
> orientada al **proceso**, para el modo de trabajo senior de eecheverria.

Simplificar y limpiar código = **reducir complejidad preservando el comportamiento exacto**. La meta no
es menos líneas — es código más fácil de **leer, entender, modificar y depurar**. Toda simplificación
pasa una prueba simple: *"¿un compañero nuevo entendería esto más rápido que el original?"*. Si la
respuesta es no, no es una simplificación: es ruido.

Es la **capa de calidad transversal**: aplica sobre cualquier stack. El *cómo trabajas* lo pone
`eecheverria-senior-dev`; el *patrón concreto* de cada stack lo ponen las skills de React o
Hono/Drizzle; esta skill pone el **criterio de limpieza** que atraviesa a todas.

## Skill viva — no te auto-edites

Documento vivo del usuario Erick Echeverría (personal `erickecheverria77@outlook.com`; trabajo `eecheverria@paloblanco.com`). Si detectas algo que mejoraría la skill
(`SKILL.md` y `references/`), **propónselo y pregúntale antes de editarla**. Aplicar la skill al código
del usuario es tu trabajo normal y no requiere preguntar.

## Cuándo usarla

- Después de que un feature funciona y los tests pasan, pero la implementación se siente más pesada de
  lo necesario.
- En code review, cuando se marca legibilidad o complejidad.
- Cuando aparece anidamiento profundo, funciones largas o nombres confusos.
- Al refactorizar código escrito bajo presión de tiempo.
- Al consolidar lógica relacionada que quedó dispersa entre archivos.
- Después de un merge que introdujo duplicación o inconsistencia.

**Cuándo NO usarla:**

- El código ya está limpio y legible — no simplifiques por deporte.
- Todavía no entiendes qué hace el código — **comprende antes de simplificar**.
- El código es crítico en rendimiento y la versión "más simple" sería medible más lenta.
- Vas a reescribir el módulo entero — simplificar código desechable es tiempo perdido.

## Los cinco principios

### 1. Preserva el comportamiento exacto

No cambies *qué* hace el código, solo *cómo* lo expresa. Entradas, salidas, efectos secundarios, manejo
de errores y casos borde deben quedar idénticos. Si no estás seguro de que una simplificación preserva
el comportamiento, no la hagas. Antes de cada cambio pregúntate:

- ¿Produce la misma salida para toda entrada?
- ¿Mantiene el mismo comportamiento ante errores?
- ¿Preserva los mismos efectos secundarios y su orden?
- ¿Pasan los tests existentes **sin modificarlos**?

### 2. Sigue las convenciones del proyecto

Simplificar es hacer el código más **consistente con el codebase**, no imponer preferencias externas.
Antes de tocar: lee el `CLAUDE.md` / convenciones del proyecto, mira cómo el código vecino resuelve
patrones similares, y respeta el estilo del proyecto para orden de imports, forma de declarar
funciones, naming, manejo de errores y profundidad de tipado. Una simplificación que rompe la
consistencia del proyecto no es simplificación: es *churn* (ruido en el historial).

### 3. Claridad sobre astucia

El código explícito le gana al compacto cuando el compacto obliga a una pausa mental para entenderlo.

```typescript
// POCO CLARO: cadena densa de ternarios
const label = isNew ? 'New' : isUpdated ? 'Updated' : isArchived ? 'Archived' : 'Active';

// CLARO: mapeo legible con retornos tempranos
function getStatusLabel(item: Item): string {
  if (item.isNew) return 'New';
  if (item.isUpdated) return 'Updated';
  if (item.isArchived) return 'Archived';
  return 'Active';
}
```

```typescript
// POCO CLARO: reduce encadenado con lógica inline
const result = items.reduce((acc, item) => ({
  ...acc,
  [item.id]: { ...acc[item.id], count: (acc[item.id]?.count ?? 0) + 1 },
}), {});

// CLARO: paso intermedio con nombre
const countById = new Map<string, number>();
for (const item of items) {
  countById.set(item.id, (countById.get(item.id) ?? 0) + 1);
}
```

### 4. Mantén el equilibrio (no sobre-simplifiques)

Simplificar tiene un modo de fallo: pasarse. Ojo con estas trampas:

- **Inlinear de más** — quitar un helper que le daba nombre a un concepto vuelve el call site más
  difícil de leer, no más fácil.
- **Combinar lógica no relacionada** — dos funciones simples fundidas en una compleja no es más simple.
- **Quitar abstracción "innecesaria"** — algunas abstracciones existen por extensibilidad o
  testabilidad, no por complejidad accidental.
- **Optimizar por número de líneas** — menos líneas no es la meta; la comprensión más rápida sí.

### 5. Acota al alcance de lo que cambió

Por defecto, simplifica el código **recién modificado**. Evita *drive-by refactors* de código no
relacionado salvo que el usuario pida ampliar el alcance explícitamente. Simplificar fuera de alcance
ensucia el diff y arriesga regresiones en código que no pretendías tocar.

## El proceso de simplificación

### Paso 1: Entiende antes de tocar (la Cerca de Chesterton)

Antes de cambiar o borrar algo, entiende **por qué existe**. Es la Cerca de Chesterton: si ves una cerca
cruzando un camino y no entiendes por qué está, no la derribes — primero entiende la razón, luego decide
si sigue aplicando. Antes de simplificar, responde:

- ¿Cuál es la responsabilidad de este código?
- ¿Quién lo llama? ¿Qué llama él?
- ¿Cuáles son los casos borde y las rutas de error?
- ¿Hay tests que definan el comportamiento esperado?
- ¿Por qué pudo haberse escrito así? (¿Rendimiento? ¿Restricción de plataforma? ¿Razón histórica?)
- `git blame`: ¿cuál fue el contexto original de este código?

Si no puedes responder esto, **no estás listo para simplificar**. Lee más contexto primero.

### Paso 2: Identifica oportunidades

Cada patrón de abajo es una señal concreta, no un olor vago:

**Complejidad estructural**

| Patrón | Señal | Simplificación |
|---|---|---|
| Anidamiento profundo (3+ niveles) | Cuesta seguir el flujo | Guard clauses o extraer a helpers |
| Funciones largas (50+ líneas) | Múltiples responsabilidades | Partir en funciones enfocadas y bien nombradas |
| Ternarios anidados | Requiere pila mental para parsear | if/else, switch, u objeto de lookup |
| Flags booleanos de parámetro | `doThing(true, false, true)` | Objeto de opciones o funciones separadas |
| Condicionales repetidos | Mismo `if` en varios lugares | Extraer a un predicado con nombre |

**Nombres y legibilidad**

| Patrón | Señal | Simplificación |
|---|---|---|
| Nombres genéricos | `data`, `result`, `temp`, `val` | Renombrar por su contenido: `userProfile`, `validationErrors` |
| Abreviaturas | `usr`, `cfg`, `btn`, `evt` | Palabras completas salvo abreviatura universal (`id`, `url`, `api`) |
| Nombres engañosos | Un `get` que además muta estado | Renombrar a lo que realmente hace |
| Comentarios que dicen el "qué" | `// incrementa contador` sobre `count++` | Bórralo — el código ya es claro |
| Comentarios que dicen el "por qué" | `// Reintenta porque la API falla bajo carga` | Consérvalos — cargan intención que el código no expresa |

**Redundancia**

| Patrón | Señal | Simplificación |
|---|---|---|
| Lógica duplicada | Mismas 5+ líneas en varios lugares | Extraer a función compartida |
| Código muerto | Ramas inalcanzables, variables sin uso, bloques comentados | Eliminar (tras confirmar que está muerto) |
| Abstracciones inútiles | Wrapper que no aporta valor | Inlinear el wrapper, llamar directo |
| Patrones sobre-diseñados | Factory-de-factory, strategy con una sola strategy | Reemplazar por el enfoque directo simple |
| Asserts de tipo redundantes | Castear a un tipo ya inferido | Quitar el assert |

### Paso 3: Aplica cambios incrementalmente

Un cambio a la vez. Corre los tests después de cada uno. **Separa los cambios de refactor de los de
feature o bugfix** — un PR que refactoriza *y* agrega feature son dos PRs; sepáralos. Por cada
simplificación: hazla → corre los tests → si pasan, sigue (o commitea); si fallan, revierte y
reconsidera. No batchees varias simplificaciones en un cambio sin probar: si algo se rompe, necesitas
saber cuál lo causó.

**La regla de las 500:** si un refactor tocaría más de ~500 líneas, invierte en automatización
(codemods, scripts, transformaciones AST) en vez de hacerlo a mano. A esa escala el trabajo manual es
propenso a error y agotador de revisar.

### Paso 4: Verifica el resultado

Al terminar, da un paso atrás y evalúa el conjunto: ¿la versión simplificada es genuinamente más fácil
de entender? ¿Introdujiste patrones inconsistentes con el codebase? ¿El diff quedó limpio y revisable?
¿Un compañero aprobaría este cambio? Si la versión "simplificada" es más difícil de entender o revisar,
**revierte**. No todo intento de simplificación tiene éxito, y está bien.

## Guía por lenguaje

### TypeScript / JavaScript

```typescript
// SIMPLIFICA: wrapper async innecesario
async function getUser(id: string): Promise<User> { return await userService.findById(id); }
// →
function getUser(id: string): Promise<User> { return userService.findById(id); }

// SIMPLIFICA: asignación condicional verbosa
let displayName: string;
if (user.nickname) { displayName = user.nickname; } else { displayName = user.fullName; }
// →
const displayName = user.nickname || user.fullName;

// SIMPLIFICA: construcción manual de arreglo
const activeUsers: User[] = [];
for (const user of users) { if (user.isActive) activeUsers.push(user); }
// →
const activeUsers = users.filter((user) => user.isActive);

// SIMPLIFICA: retorno booleano redundante
function isValid(input: string): boolean {
  if (input.length > 0 && input.length < 100) return true;
  return false;
}
// →
function isValid(input: string): boolean {
  return input.length > 0 && input.length < 100;
}
```

### Python

```python
# SIMPLIFICA: construcción verbosa de diccionario
result = {}
for item in items:
    result[item.id] = item.name
# →
result = {item.id: item.name for item in items}

# SIMPLIFICA: condicionales anidados con retorno temprano (guard clauses)
def process(data):
    if data is not None:
        if data.is_valid():
            if data.has_permission():
                return do_work(data)
            else:
                raise PermissionError("No permission")
        else:
            raise ValueError("Invalid data")
    else:
        raise TypeError("Data is None")
# →
def process(data):
    if data is None:
        raise TypeError("Data is None")
    if not data.is_valid():
        raise ValueError("Invalid data")
    if not data.has_permission():
        raise PermissionError("No permission")
    return do_work(data)
```

### Componentes (React)

El mismo criterio aplica en JSX y componentes: extrae variables con nombre en vez de expresiones densas
en el markup, y saca a un hook o a un `useMemo` la lógica que la vista no debería cargar. El *prop
drilling* a través de componentes intermedios es una señal — pero refactorizarlo (context, composición,
un store) es una decisión de diseño: **márcala y coméntala, no la refactorices en automático**.

## Racionalizaciones comunes (y la realidad)

| Racionalización | Realidad |
|---|---|
| "Funciona, mejor no lo toco" | Código que funciona pero cuesta leer, costará arreglar cuando se rompa. Limpiar ahora ahorra tiempo en cada cambio futuro. |
| "Menos líneas siempre es más simple" | Un ternario anidado de 1 línea no es más simple que un if/else de 5. La simplicidad es velocidad de comprensión, no conteo de líneas. |
| "Ya de paso simplifico este otro código" | Simplificar fuera de alcance ensucia el diff y arriesga regresiones donde no pretendías tocar. Mantén el foco. |
| "Los tipos ya lo autodocumentan" | Los tipos documentan estructura, no intención. Un buen nombre explica el *por qué* mejor que una firma explica el *qué*. |
| "Esta abstracción quizá sirva después" | No conserves abstracciones especulativas. Si no se usa ahora, es complejidad sin valor. Quítala y reagrégala cuando haga falta. |
| "El autor original tendría una razón" | Quizá. Revisa `git blame` — Cerca de Chesterton. Pero la complejidad acumulada a menudo no tiene razón: es residuo de iterar bajo presión. |
| "Refactorizo mientras agrego el feature" | Separa refactor de feature. Los cambios mezclados son más difíciles de revisar, revertir y entender en el historial. |

## Red flags (señales de que algo va mal)

- Una simplificación que **obliga a modificar los tests** para que pasen → probablemente cambiaste el
  comportamiento.
- Código "simplificado" más largo y más difícil de seguir que el original.
- Renombrar cosas según tu preferencia y no según las convenciones del proyecto.
- Quitar manejo de errores "porque ensucia".
- Simplificar código que no entiendes del todo.
- Batchear muchas simplificaciones en un solo commit gigante e irrevisable.
- Refactorizar código fuera del alcance de la tarea sin que te lo pidan.

## Reportar hallazgos por severidad

Cuando revises código (propio o ajeno) y produzcas una lista de mejoras, **clasifica cada hallazgo por
severidad** y **empieza por lo que importa**. Un muro de nits al mismo nivel que un bug real hace que lo
crítico se pierda y agota a quien revisa.

| Severidad | Qué es | Qué esperar |
|---|---|---|
| **Crítico** | Rompe correctness, seguridad o datos | Bloquea: se arregla antes de mergear |
| **Necesario** | Debe cambiar para cumplir el estándar del proyecto | Se corrige en este cambio |
| **Nit** | Detalle menor de estilo/claridad | Opcional, a criterio del autor |
| **Opcional** | Sugerencia de mejora, no obligatoria | Tómalo o déjalo |
| **FYI** | Contexto o aprendizaje, sin acción | Solo informativo |

Etiqueta cada punto con su severidad y ordena de mayor a menor; separa lo que **bloquea** de lo que es
preferencia, para que el autor sepa qué es negociable. (Para juzgar a fondo una decisión de diseño de
alto riesgo, `eecheverria-doubt-driven`; para revisar el diff automáticamente, el comando `/code-review`.)

## Verificación (antes de decir "listo")

- [ ] Todos los tests existentes pasan **sin modificarlos**.
- [ ] El build compila sin nuevos warnings.
- [ ] Linter/formatter pasan (sin regresiones de estilo).
- [ ] Cada simplificación es un cambio incremental y revisable.
- [ ] El diff está limpio — sin cambios no relacionados mezclados.
- [ ] El código simplificado sigue las convenciones del proyecto (`CLAUDE.md` o equivalente).
- [ ] No se quitó ni debilitó ningún manejo de errores.
- [ ] No quedó código muerto (imports sin uso, ramas inalcanzables).
- [ ] Un compañero (o un agente revisor) aprobaría el cambio como una mejora neta.
