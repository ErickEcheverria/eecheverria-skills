# Dev Servers

Un mod de Claude Code: un botón **▶ dev** en el pie que levanta, muestra y detiene el servidor de desarrollo de cada proyecto de la carpeta, sin abrir otra terminal ni copiar errores a mano.

```text
▶ Servidores dev · app-tratos-evo
● app-tratos-evo-frontend  ● http://localhost:4000 · 1 error
○ app-tratos-evo-service   ○ detenido
      ■ detener
      ↻ reiniciar
      ↗ abrir en Chrome
      ⚠ último error → prompt
      ▸ últimas líneas
```

- **Proyectos**: la carpeta donde se abrió Claude y cada subcarpeta directa con un script `dev` en su `package.json`. Nunca baja más de un nivel; ignora carpetas ocultas, `node_modules`, `vendor`, `dist`, `build`, `out`, `target`, `bin` y `obj`.
- **El botón** dice `▶ dev`, `● dev 1/2` mientras hay servidores corriendo, y agrega `✕` si alguno tuvo errores o terminó mal. `/dev` hace lo mismo desde el prompt. Solo aparece si la carpeta tiene algún proyecto.
- **Clic en un proyecto** lo elige; debajo salen sus acciones:
  - **levantar / detener / reiniciar**.
  - **abrir en Chrome**: la abre con Claude in Chrome, en su grupo de pestañas, y le deja a Claude una nota con la URL para que la validen juntos. En modo automático Claude Code no deja que un mod use Claude in Chrome (aunque lo pulses tú): entonces te deja el pedido escrito en el prompt; al enviarlo, Claude la abre.
  - **último error → prompt**: pone el error con su stack en la caja del prompt, sin enviarlo; tú decides qué pedirle a Claude.
  - **últimas líneas** de la salida del servidor.
- **Errores**: cuenta las líneas de error (`Error:`, `TypeError`, `npm ERR!`, `Unhandled…`) con las líneas de stack que las siguen; los avisos (`⚠ … deprecated`) y `0 errors` no cuentan.
- **Claude también puede usarlo** con su herramienta `dev`: `status`, `start` (espera la URL), `stop` y `open`. Ojo: levantar un servidor puede tener efectos; por ejemplo, un backend que al arrancar escribe en la base de datos.

## Cómo corre y cómo detiene

- **Corre el script tal cual** (`next dev -p 4000`), con `node_modules/.bin` en el PATH, como lo resuelve `npm run`, pero **sin pasar por el gestor de paquetes**: con pnpm 11, `pnpm run dev` puede ejecutar un `pnpm install` por su cuenta y reescribir `pnpm-workspace.yaml`. Si el proyecto no tiene `node_modules`, no arranca y lo dice: **el botón nunca instala nada**.
- **Detener mata el árbol completo** (`cmd → npm → node → vite/next y sus hijos`) y libera el puerto. Claude Code solo puede matar al proceso que lanzó, y en Windows Node solo mata a los hijos *directos* cuando su padre muere: sin más, `npm`, `node` y el servidor quedarían huérfanos con el puerto ocupado. Por eso el mod lanza un intermedio (`bin/dev-wrapper.js`) que deja a un guardián desacoplado (`bin/dev-guard.js`) como dueño del árbol. Cuando el intermedio muere, por la razón que sea, el sistema cierra la tubería del guardián y el guardián mata el árbol (`taskkill /T` en Windows, el grupo de procesos en Unix).
- **Los servidores viven lo que la sesión**: al cerrar Claude Code o recargar el mod se detienen solos, sin dejar procesos ni puertos ocupados.

Probado en Windows (Node 24, Next.js 16 con Turbopack): al detener, al recargar el mod y cuando el servidor cae solo. En macOS y Linux el guardián usa grupos de procesos, pero todavía no se ha probado ahí.

## Instalar

```bash
claude plugin marketplace add ErickEcheverria/eecheverria-skills
claude plugin install dev-servers@paloblanco
```

Lo mismo desde una sesión: `/plugin marketplace add …` y `/plugin install …`. Se activa en las sesiones que se abran después.

## Desarrollo

Desde la raíz del repo:

```bash
claude plugin validate ./plugins/dev-servers
claude plugin test ./plugins/dev-servers       # corre hooks/register.test.tsx contra el motor
claude --plugin-dir ./plugins/dev-servers       # una sesión con esta copia local cargada
```

El mod está en `hooks/register.tsx`; `types/index.d.ts` declara lo que guarda en `$.state`; `bin/` tiene el intermedio y el guardián, que corren con el `node` del sistema.
