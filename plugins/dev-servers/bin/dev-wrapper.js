// Intermedio de ▶ dev. El motor solo puede matar a este proceso (no al árbol), así que no es dueño
// de nada: lanza al guardián desacoplado, que es quien corre el script, y reenvía su salida.
// Si el motor lo mata, el sistema cierra la tubería de stdin del guardián y el guardián mata el árbol.
const { spawn } = require('child_process')
const path = require('path')

const guard = spawn(process.execPath, [path.join(__dirname, 'dev-guard.js'), ...process.argv.slice(2)], {
  detached: true,
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
})
guard.stdout.pipe(process.stdout)
guard.stderr.pipe(process.stderr)
guard.on('exit', (code) => process.exit(code ?? 1))
