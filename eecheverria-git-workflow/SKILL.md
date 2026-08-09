---
name: eecheverria-git-workflow
description: >-
  Disciplina de git en el día a día para eecheverria, agnóstica de stack: commits atómicos y
  frecuentes, mensajes descriptivos (conventional commits), ramas de vida corta (trunk-based),
  separar refactor de feature, tamaño de cambio revisable, worktrees para trabajo paralelo, higiene
  pre-commit (no filtrar secretos, tests/lint/typecheck) y git como red de seguridad y herramienta de
  depuración. Actívate SIEMPRE que el usuario vaya a commitear, ramificar, resolver conflictos,
  organizar trabajo en git, o diga frases como "haz commit de esto", "cómo divido este cambio", "crea
  una rama para", "mensaje de commit", "esto quedó muy grande para un PR", "resume los cambios",
  "prepara el commit", "usa worktrees", o cuando trabaje en varios features en paralelo. Es la capa de
  DISCIPLINA de control de versiones que complementa al modo de trabajo senior y a la skill de código
  limpio. Si dudas entre activarla ante cualquier operación de git o al preparar un cambio, actívala.
---

# Git Workflow — eecheverria

Git es tu **red de seguridad**. Trata los commits como *save points*, las ramas como *sandboxes* y el
historial como **documentación**. Con un agente generando código rápido, un control de versiones
disciplinado es lo que mantiene los cambios manejables, revisables y reversibles.

Es una **capa de disciplina transversal**: aplica sobre cualquier stack. El *cómo trabajas* lo pone
`eecheverria-senior-dev`; el *criterio de limpieza* lo pone `eecheverria-clean-code`; esta skill pone
la **higiene de git** que atraviesa a todas. (Esta skill cubre el flujo del día a día; versionado
formal —SemVer, tags, changelog— queda fuera de alcance por decisión del usuario.)

## Skill viva — no te auto-edites

Documento vivo del usuario (eecheverria@paloblanco.com). Si detectas algo que mejoraría la skill,
**propónselo y pregúntale antes de editarla**. Aplicarla al trabajo del usuario es tu tarea normal y no
requiere preguntar.

## Cuándo usarla

Prácticamente siempre que toques git: al preparar un commit, ramificar, dividir un cambio, resolver
conflictos, u organizar trabajo paralelo. Todo cambio de código pasa por git.

## Trunk-based: `main` siempre desplegable

Mantén `main` siempre en estado desplegable. Trabaja en **ramas de feature de vida corta** que se
mergean en 1-3 días. Las ramas largas son un costo oculto: divergen, generan conflictos y retrasan la
integración.

```
main ──●──●──●──●──●──●──●──●──  (siempre desplegable)
        ╲      ╱  ╲    ╱
         ●──●─╱    ●──╱    ← ramas de feature de vida corta (1-3 días)
```

- **Las ramas de desarrollo largas son deuda.** Cada día que vive una rama acumula riesgo de merge.
- **Feature flags > ramas largas.** Prefiere desplegar trabajo incompleto detrás de un flag antes que
  mantenerlo semanas en una rama.
- **Ramas de release son aceptables** solo cuando necesitas estabilizar mientras `main` sigue avanzando.

## Los principios del commit

### 1. Commit temprano y seguido

Cada incremento exitoso lleva su propio commit. No acumules cambios grandes sin commitear.

```
Patrón de trabajo:
  Implementa una rebanada → Prueba → Verifica → Commit → Siguiente rebanada

No esto:
  Implementa todo → Ojalá funcione → Commit gigante
```

Los commits son *save points*: si el siguiente cambio rompe algo, vuelves al último estado bueno al
instante (`git reset --hard HEAD`).

### 2. Commits atómicos

Cada commit hace **una sola cosa lógica**:

```bash
# Bien: cada commit es autocontenido
a1b2c3d feat: add task creation endpoint with validation
d4e5f6g feat: add task creation form component
h7i8j9k feat: connect form to API and add loading state
m1n2o3p test: add task creation tests (unit + integration)

# Mal: todo mezclado
x1y2z3a add task feature, fix sidebar, update deps, refactor utils
```

### 3. Mensajes descriptivos (conventional commits)

El mensaje explica el **por qué**, no lo que ya es obvio en el diff.

```
<tipo>: <descripción corta en imperativo>

<cuerpo opcional explicando el porqué, no el qué>
```

```
# Bien: explica la intención
feat: add email validation to registration endpoint

Evita que formatos de email inválidos lleguen a la base de datos.
Valida con Joi a nivel del route handler, consistente con el patrón
de validación existente en el módulo de auth.

# Mal: describe lo evidente
update auth.ts
```

**Tipos:** `feat` (nueva funcionalidad) · `fix` (bug) · `refactor` (cambio que no arregla bug ni agrega
feature) · `test` · `docs` · `chore` (tooling, dependencias, config).

> Nota de idioma: el código va en inglés y los comentarios en español (convención de eecheverria). El
> mensaje de commit puede ir en español; el **tipo** y el asunto corto en inglés imperativo mantienen la
> consistencia del historial. Sigue la convención que ya use el proyecto (revisa `git log`).

### 4. Separa los concerns

No combines cambios de formato con cambios de comportamiento, ni refactors con features. Cada tipo de
cambio es su propio commit —e idealmente su propio PR:

```bash
# Bien: concerns separados
git commit -m "refactor: extract validation logic to shared utility"
git commit -m "feat: add phone number validation to registration"

# Mal: concerns mezclados
git commit -m "refactor validation and add phone number field"
```

Esto conecta directo con `eecheverria-clean-code`: **separar refactor de feature** hace cada cambio más
fácil de revisar, revertir y entender en el historial. Limpiezas menores (renombrar una variable)
pueden ir en el commit del feature a criterio del revisor.

### 5. Dimensiona tus cambios

```
~100 líneas   → fácil de revisar, fácil de revertir
~300 líneas   → aceptable para un solo cambio lógico
~1000 líneas  → divídelo en cambios más pequeños
```

Si un cambio crece demasiado, pártelo por capas o por rebanadas verticales antes de enviarlo, no
después.

## Ramas

```
main (siempre desplegable)
  ├── feature/task-creation    ← un feature por rama
  ├── feature/user-settings    ← trabajo en paralelo
  └── fix/duplicate-tasks      ← bug fixes
```

- Ramifica desde `main` (o la rama por defecto del equipo).
- Mantén las ramas cortas (merge en 1-3 días) y **bórralas después del merge**.
- Nomenclatura: `feature/<desc>`, `fix/<desc>`, `chore/<desc>`, `refactor/<desc>`
  (p. ej. `feature/task-creation`, `fix/duplicate-tasks`).

## Worktrees para trabajo paralelo

Para correr varias ramas a la vez (útil cuando un agente trabaja en paralelo) sin andar cambiando de
rama:

```bash
git worktree add ../project-feature-a feature/task-creation
git worktree add ../project-feature-b feature/user-settings
# cada worktree es un directorio con su propia rama; el trabajo queda aislado
git worktree remove ../project-feature-a   # al terminar
```

Beneficios: varios frentes a la vez sin `checkout`, cada experimento aislado, y si uno falla borras el
worktree sin perder nada.

## El patrón save point

```
El agente empieza a trabajar
    ├── Hace un cambio
    │   ├── ¿Test pasa? → Commit → Continúa
    │   └── ¿Test falla? → Revierte al último commit → Investiga
    └── Feature completo → los commits forman un historial limpio
```

Nunca pierdes más de un incremento de trabajo. Si el agente se descarrila, `git reset --hard HEAD` te
regresa al último estado bueno.

## Resumen de cambios (change summary)

Después de cualquier modificación relevante, entrega un resumen estructurado. Facilita la revisión,
documenta la disciplina de alcance y saca a la luz cambios no intencionados:

```
CAMBIOS REALIZADOS:
- src/modules/tasks/tasks.routes.ts: agregado middleware de validación al POST
- src/modules/tasks/tasks.validation.ts: agregado esquema Joi TaskCreate

LO QUE NO TOQUÉ (a propósito):
- src/modules/auth/*: tiene un gap de validación similar, pero está fuera de alcance
- shared/middlewares/error.ts: el formato de error podría mejorar (otra tarea)

POSIBLES PREOCUPACIONES:
- El esquema Joi es estricto (rechaza campos extra). Confirmar que es lo deseado.
```

La sección **"LO QUE NO TOQUÉ"** es la más valiosa: demuestra disciplina de alcance y que no te fuiste a
una remodelación no solicitada.

## Higiene pre-commit

Antes de cada commit:

```bash
git diff --staged                                          # 1. revisa qué vas a commitear
git diff --staged | grep -iE "password|secret|api_key|token"  # 2. sin secretos
npm test                                                   # 3. tests
npm run lint                                               # 4. lint
npx tsc --noEmit                                           # 5. typecheck (proyectos TS strict)
```

Ajusta los comandos a los scripts reales del proyecto (revisa `package.json` / `CLAUDE.md`). Si el
proyecto usa `lint-staged` + `husky`, deja que el hook haga el trabajo — no lo dupliques a mano.

## `.gitignore` y archivos generados

- **Ten un `.gitignore`** desde el primer commit. Cubre al menos: `node_modules/`, `dist/`, `.env`,
  `.env.local`, `*.pem`, y salidas de build (`.next/`, `coverage/`).
- **Commitea archivos generados solo si el proyecto los espera** (p. ej. `package-lock.json`, o las
  migraciones de Drizzle en `db/migrations/`).
- **No commitees** salida de build, archivos de entorno (`.env`) ni config personal del IDE.

## Git para depurar

```bash
git bisect start && git bisect bad HEAD && git bisect good <commit-bueno>  # aísla qué commit rompió algo
git log --oneline -20                    # historial reciente
git diff HEAD~5..HEAD -- src/            # qué cambió en un rango
git blame src/services/task.ts           # quién tocó cada línea (contexto, no culpa)
git log --grep="validation" --oneline    # busca en mensajes de commit
```

## Racionalizaciones comunes (y la realidad)

| Racionalización | Realidad |
|---|---|
| "Commiteo cuando termine el feature" | Un commit gigante es imposible de revisar, depurar o revertir. Commitea cada rebanada. |
| "El mensaje da igual" | Los mensajes son documentación. El tú del futuro (y el agente) necesitan saber qué cambió y por qué. |
| "Ya lo squasheo después" | El squash destruye la narrativa del desarrollo. Prefiere commits incrementales limpios desde el inicio. |
| "Las ramas son overhead" | Las ramas cortas son gratis y evitan choques. El problema son las largas — mergea en 1-3 días. |
| "Ya divido este cambio después" | Los cambios grandes son más difíciles de revisar y más riesgosos de desplegar. Divide antes de enviar, no después. |
| "No necesito `.gitignore`" | Hasta que se commitea un `.env` con secretos de producción. Configúralo de inmediato. |

## Red flags

- Cambios grandes sin commitear acumulándose.
- Mensajes tipo "fix", "update", "misc".
- Cambios de formato mezclados con cambios de comportamiento.
- Proyecto sin `.gitignore`.
- Commitear `node_modules/`, `.env` o artefactos de build.
- Ramas largas que divergen mucho de `main`.
- `push --force` a ramas compartidas.

## Verificación (antes de cada commit)

- [ ] El commit hace una sola cosa lógica.
- [ ] El mensaje explica el porqué y sigue la convención de tipos.
- [ ] Los tests pasan antes de commitear.
- [ ] No hay secretos en el diff.
- [ ] No hay cambios solo-de-formato mezclados con comportamiento.
- [ ] El `.gitignore` cubre las exclusiones estándar.
