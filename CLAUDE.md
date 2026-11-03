# eecheverria-skills

Marketplace `paloblanco` de Claude Code. Este repo es la **fuente de verdad** de las skills de
eecheverria: cada máquina las recibe instalando el plugin, no clonando el repo (ver `README.md`).

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `.claude-plugin/marketplace.json` | Catálogo del marketplace: lista `pb-skills`, `git-branches` y `dev-servers`, cada uno con su versión |
| `.claude-plugin/plugin.json` | Manifiesto de `pb-skills` (el plugin es la raíz del repo) |
| `skills/<skill>/SKILL.md` | Una carpeta por skill, con `references/`, `scripts/` o `assets/` si los usa |
| `agents/*.md` | Agentes revisores de contexto fresco (`revisor-adversarial`, `revisor-seguridad`) |
| `plugins/git-branches/` | Plugin aparte: un mod de Claude Code (`hooks/register.tsx`) con sus tests |
| `plugins/dev-servers/` | Plugin aparte: el mod ▶ dev, con sus tests y `bin/` (intermedio y guardián que matan el árbol de procesos) |

Todo está en español: skills, agentes, commits y documentación.

## Reglas que muerden

1. **Sube la versión en los dos manifiestos en cada cambio**: `version` de `.claude-plugin/plugin.json`
   y la de la entrada `pb-skills` en `marketplace.json`. Si no cambia, quien ya tiene el plugin no
   recibe la actualización. Cada plugin de `plugins/` lleva su propia versión (su `plugin.json` y su entrada).
2. **`.gitignore` es una lista blanca** (`/*` y luego `!…`). Un archivo o carpeta nueva en la raíz
   necesita su `!` o queda fuera del repo sin avisar.
3. **Edita en este clon, nunca en `~/.claude/plugins/cache/…`**: Claude Code sobrescribe esa copia en la
   siguiente actualización.
4. **Las skills son portables**: las usan otras personas en otras máquinas. Nada de referencias a
   memorias locales, rutas de una máquina ni datos de una sesión; si una regla importa, va escrita en
   la skill.

## Convenciones de una skill

- `name` del frontmatter = nombre de la carpeta.
- `description` en español: primero el caso de uso, luego las frases que la disparan ("Actívate
  SIEMPRE que…") y con qué skills se complementa. Usa `[placeholder]` y no `<placeholder>`: Claude
  Code muestra `<` y `>` como `&lt;` y `&gt;`.
- Largo de la `description`: Claude Code la corta a 1,536 caracteres y el estándar Agent Skills
  (claude.ai, API) pide 1024 como máximo. Además, el listado de skills tiene un presupuesto del 1% del
  contexto; cuando se llena, las skills **menos usadas** se quedan sin descripción y dejan de
  activarse solas. Las descripciones cortas benefician a todas.
- Sección `## Skill viva — no te auto-edites` justo después de la introducción (copia el texto de
  cualquier skill existente).
- Entre skills se citan por nombre en backticks (`eecheverria-security`); los agentes, como
  `pb-skills:revisor-seguridad`.
- `allowed-tools` solo preaprueba herramientas durante el turno en que se invoca la skill; no
  restringe nada.

## Agentes

Un `.md` en `agents/` con `name`, `description` y solo las `tools` que necesita. En un plugin se
ignoran `hooks`, `mcpServers` y `permissionMode`, así que `tools` es el único candado real. Para
precargar una skill, nómbrala con namespace (`skills: [pb-skills:eecheverria-security]`); un nombre
equivocado se omite sin avisar.

## Al agregar o quitar una skill

Actualiza también:

- la tabla "Base + delega" de `skills/eecheverria-senior-dev/SKILL.md`,
- las tablas y el diagrama mermaid de `README.md`,
- la `description` de `pb-skills` en `marketplace.json`,
- y la versión (regla 1).

## Comandos

```bash
claude plugin validate .                       # manifiestos y frontmatter de pb-skills
claude plugin validate ./plugins/git-branches  # igual con ./plugins/dev-servers
claude plugin test ./plugins/git-branches      # tests del mod (hooks/register.test.tsx); igual con dev-servers
claude --plugin-dir .                          # sesión con esta copia local de pb-skills
```

Avisos de `validate` que son esperados:

- Faltan LICENSE e icono: es un requisito del directorio público de plugins y no aplica a este
  marketplace privado.
- "CLAUDE.md at the plugin root is not loaded as project context": este archivo es para trabajar en el
  repo, no para quien instala el plugin.

## Git

Rama corta desde `main` y PR. Conventional commits en español (`feat(write-user-story): …`); la subida
de versión va en su propio commit (`chore(plugin): sube a 1.7.2`).
