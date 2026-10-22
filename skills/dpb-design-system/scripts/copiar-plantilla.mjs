// Copia assets/plantilla/ a la raíz de un proyecto sin pisar nada: crea lo que falta,
// salta lo idéntico y lista los conflictos para revisarlos a mano con diff.
// Uso: node scripts/copiar-plantilla.mjs <raíz-del-proyecto> [--dry-run]
import { existsSync, mkdirSync, readdirSync, readFileSync, copyFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const destino = args.find((arg) => !arg.startsWith('--'))

if (!destino) {
  console.error('Uso: node scripts/copiar-plantilla.mjs <raíz-del-proyecto> [--dry-run]')
  process.exit(1)
}
if (!existsSync(join(destino, 'package.json'))) {
  console.error(`No veo package.json en ${resolve(destino)}: ¿es la raíz del proyecto?`)
  process.exit(1)
}

const origen = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/plantilla')

const listar = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name)
    return entrada.isDirectory() ? listar(ruta) : [ruta]
  })

// CRLF vs LF no es un conflicto real: git normaliza el fin de línea según el SO.
const normalizar = (ruta) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')

const creados = []
const iguales = []
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
  } else {
    conflictos.push(rel)
  }
}

for (const rel of creados) console.log(`  + ${rel}`)
for (const rel of conflictos) console.log(`  ! ${rel}  (ya existe y difiere: compáralo antes de decidir)`)
console.log(
  `${dryRun ? '[dry-run] ' : ''}Creados: ${creados.length} · Iguales: ${iguales.length} · Conflictos: ${conflictos.length}`,
)
if (conflictos.length) process.exitCode = 2
