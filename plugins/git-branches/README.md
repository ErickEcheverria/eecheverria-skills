# Git Branches

Un mod de Claude Code: un botón **⎇ branches** en el pie, al lado del modo de permisos, que muestra como mensaje en el chat en qué rama está cada proyecto git de la carpeta.

```text
⎇ Ramas actuales · tienda
○ tienda-api  PROJ-42  ✓ · limpio
● tienda-web  develop  ↑1 · 2 cambios
  ▾ all branches · tienda-web
    Locales (2)
    ● develop          ↑1      1h  Pantalla de login
      feature/carrito  ✕ gone  2d  Carrito nuevo
    Remotas (1)
      origin/develop           3h  Versión 1.2
```

- **Proyectos**: la carpeta donde se abrió Claude, si es un repositorio, y cada subcarpeta directa que tenga el suyo. Nunca baja más de un nivel; ignora carpetas ocultas, `node_modules`, `vendor`, `dist`, `build`, `out`, `target`, `bin` y `obj`.
- De cada proyecto, la rama actual: adelante/atrás (↑ ↓) de su upstream, `✕ gone` si el upstream ya no existe, y sus cambios sin commitear.
- Clic en un proyecto lo selecciona (●). Clic en **all branches** despliega todas las ramas del seleccionado, locales y remotas; otro clic las pliega. Con la lista abierta, elegir otro proyecto muestra las suyas.
- Clic en una rama de la lista abre sus acciones debajo:

  ```text
      ▸ release/1.4      ↓4      1d  Merge de sprint
          ⇄ cambiar a esta rama
          ↓ pull · solo avance rápido
  ```

  - **cambiar a esta rama**: solo si el proyecto no tiene cambios sin commitear (si los tiene, avisa y no hace nada). Una rama remota (`origin/hotfix`) se trae como local siguiéndola (`git switch -c hotfix --track origin/hotfix`).
  - **pull**: también solo si el proyecto no tiene cambios sin commitear, y solo avance rápido: nunca crea un merge. La rama actual con `git pull --ff-only`; otra rama local con `git fetch origin <rama>:<rama>`, sin cambiarte de rama. Solo para ramas locales con upstream.
  - El resultado se ve debajo (✓ o ✕ con el motivo de git), y el mensaje se actualiza con la rama y los cambios nuevos del proyecto.
  - Tras cambiar de rama, o un pull que trajo commits a la rama actual, Claude recibe una nota de lo que pasó, para que no siga trabajando con los archivos de antes.
- Cada mensaje guarda lo que mostró en su momento; el siguiente clic en el botón publica uno nuevo, al día.
- El mensaje es solo para ti: Claude no lo lee, así que no gasta contexto.
- El botón solo aparece si la carpeta tiene algún proyecto git; `/branches` hace lo mismo desde el prompt.

Los comandos de git que lanza el mod corren con los hooks del repositorio desactivados (así lo hace Claude Code): un `post-checkout` de husky, por ejemplo, no se ejecuta al cambiar de rama desde aquí.

## Instalar

```bash
claude plugin marketplace add ErickEcheverria/eecheverria-skills
claude plugin install git-branches@paloblanco
```

Lo mismo desde una sesión: `/plugin marketplace add …` y `/plugin install …`. Se activa en las sesiones que se abran después.

## Desarrollo

Desde la raíz del repo:

```bash
claude plugin validate ./plugins/git-branches
claude plugin test ./plugins/git-branches       # corre hooks/register.test.tsx contra el motor
claude --plugin-dir ./plugins/git-branches       # una sesión con esta copia local cargada
```

Todo el mod está en `hooks/register.tsx`; `types/index.d.ts` declara lo que guarda en `$.state`.
