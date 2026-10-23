// Copia assets/plantilla/ a la raíz de un proyecto sin pisar nada: crea lo que falta,
// salta lo idéntico y lista los conflictos para revisarlos a mano con diff. Las costuras (lo que cada
// app edita) nunca cuentan como conflicto: si ya existen, son del proyecto y no se tocan.
// Uso: node scripts/copiar-plantilla.mjs <raíz-del-proyecto> [--dry-run]
import { existsSync, mkdirSync, readdirSync, readFileSync, copyFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const posicionales = args.filter((arg) => !arg.startsWith('-'))
const destino = posicionales[0]

// Una bandera mal escrita («--dryrun») no puede caer en la copia real: se rechaza todo lo desconocido.
const desconocidas = args.filter((arg) => arg.startsWith('-') && arg !== '--dry-run')
if (desconocidas.length) {
  console.error(`Opción desconocida: ${desconocidas.join(', ')}. La única es --dry-run.`)
  process.exit(1)
}

// Dos posicionales suelen ser una ruta con espacios sin comillas, partida en dos.
if (posicionales.length > 1) {
  console.error(`Sobran argumentos: ${posicionales.slice(1).join(' ')}. ¿La ruta tiene espacios? Ponla entre comillas.`)
  process.exit(1)
}
if (!destino) {
  console.error('Uso: node scripts/copiar-plantilla.mjs <raíz-del-proyecto> [--dry-run]')
  process.exit(1)
}
if (!existsSync(join(destino, 'package.json'))) {
  console.error(`No veo package.json en ${resolve(destino)}: ¿es la raíz del proyecto?`)
  process.exit(1)
}

// Las plantillas importan el catálogo de @desarrollospaloblanco/ui: sin él, lo copiado no compila. El
// dry-run sí se permite, para ver los conflictos antes de decidir la adopción.
const pkg = JSON.parse(readFileSync(join(destino, 'package.json'), 'utf8'))
const conPaquete = Boolean(pkg.dependencies?.['@desarrollospaloblanco/ui'] || pkg.devDependencies?.['@desarrollospaloblanco/ui'])
if (!conPaquete) {
  console[dryRun ? 'warn' : 'error']('El proyecto no declara @desarrollospaloblanco/ui: instálalo antes de copiar (SKILL.md, paso 2).')
  if (!dryRun) process.exit(1)
}
// El modelo anterior copiaba el catálogo a src/components/ y ponía la marca en brand-dpb.css: esas apps
// se migran primero (SKILL.md, «Migrar una app con el catálogo copiado»).
if (existsSync(join(destino, 'src/styles/brand-dpb.css')) || existsSync(join(destino, 'src/components/base'))) {
  console.warn('Aviso: el proyecto tiene el catálogo copiado (src/components/base o src/styles/brand-dpb.css). Migra antes de actualizar piezas.')
}

const origen = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/plantilla')

const listar = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name)
    return entrada.isDirectory() ? listar(ruta) : [ruta]
  })

// CRLF vs LF no es un conflicto real: git normaliza el fin de línea según el SO.
const normalizar = (ruta) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')

// Las que cada app edita a propósito (SKILL.md, paso 5). Que difieran es lo esperado: reemplazarlas
// borraría la configuración de la app (y en `use-cuenta.ts`, su conexión a la auth).
const COSTURAS = new Set([
  "src/features/shell/shell.config.ts",
  "src/features/shell/nav-items.ts",
  "src/features/shell/use-cuenta.ts",
])

const creados = []
const iguales = []
const costuras = []
const conflictos = []

for (const archivo of listar(origen).sort()) {
  const rel = relative(origen, archivo).replaceAll('\\', '/')
  const dest = join(destino, rel)

  if (!existsSync(dest)) {
    if (!dryRun) {
      mkdirSync(dirname(dest), { recursive: true })
      copyFileSync(archivo, dest)
    }
    creados.push(rel)
  } else if (normalizar(archivo) === normalizar(dest)) {
    iguales.push(rel)
  } else if (COSTURAS.has(rel)) {
    costuras.push(rel)
  } else {
    conflictos.push(rel)
  }
}

for (const rel of creados) console.log(`  + ${rel}`)
for (const rel of costuras) console.log(`  = ${rel}  (costura del proyecto: no se toca; si la plantilla le agregó campos, súmalos a mano)`)
for (const rel of conflictos) console.log(`  ! ${rel}  (ya existe y difiere: compáralo antes de decidir)`)
console.log(
  `${dryRun ? '[dry-run] Se crearían' : 'Creados'}: ${creados.length} · Iguales: ${iguales.length} · Costuras propias: ${costuras.length} · Conflictos: ${conflictos.length}`,
)
if (conflictos.length) process.exitCode = 2
