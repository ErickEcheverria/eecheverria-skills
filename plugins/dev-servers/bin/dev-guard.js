// Guardián de ▶ dev: corre el script y es dueño de su árbol de procesos.
// Vive desacoplado del intermedio. Se entera de que el intermedio murió porque el sistema cierra
// la tubería de su stdin, sin importar cómo murió, y entonces mata el árbol completo.
// (Node solo mata a los hijos DIRECTOS cuando el padre muere en Windows; npm, cmd y vite quedarían huérfanos.)
const { spawn, execSync } = require('child_process')
const path = require('path')

const command = process.argv.slice(2).join(' ')
const isWindows = process.platform === 'win32'

// Corre el script tal cual, con los binarios del proyecto en el PATH (como lo resuelve `npm run`), pero sin
// pasar por el gestor de paquetes: `pnpm run` puede instalar dependencias y reescribir pnpm-workspace.yaml.
const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') || 'PATH'
const env = { ...process.env, [pathKey]: path.join(process.cwd(), 'node_modules', '.bin') + path.delimiter + (process.env[pathKey] || '') }

// En Unix el hijo encabeza su propio grupo para poder matar el árbol con process.kill(-pid).
const child = spawn(command, { shell: true, env, windowsHide: true, detached: !isWindows, stdio: ['ignore', 'pipe', 'pipe'] })

// Si el intermedio ya no está, escribir en la tubería falla: se ignora y se espera al cierre de stdin.
const relay = (from, to) => from.on('data', (data) => { try { to.write(data) } catch {} })
relay(child.stdout, process.stdout)
relay(child.stderr, process.stderr)
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})

let isKilled = false
const killTree = () => {
  if (isKilled) return
  isKilled = true
  try {
    if (isWindows) execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore', windowsHide: true })
    else process.kill(-child.pid, 'SIGTERM')
  } catch {
    // el árbol ya había terminado
  }
  process.exit(0)
}

process.stdin.on('end', killTree)
process.stdin.on('close', killTree)
process.stdin.on('error', killTree)
process.stdin.resume()

child.on('exit', (code) => process.exit(code ?? 1))
