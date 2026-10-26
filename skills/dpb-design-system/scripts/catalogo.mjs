// Lee el catálogo de @desarrollospaloblanco/ui que usa un proyecto, sin cargarlo entero al contexto.
// Uso: node scripts/catalogo.mjs <raíz-del-proyecto> [indice [texto] | ver <ruta-o-nombre> [--dts] | version]
//   indice   (por defecto) una línea por componente: su ruta de import, lo que exporta y cuántos ejemplos trae
//   ver      el detalle de uno: import, props y ejemplos del catálogo ai/; con --dts (o sin ai/), sus tipos .d.ts
//   version  la versión instalada contra la última publicada, y si el proyecto la baja del registry correcto
//
// Las fuentes son del paquete instalado, así que describen ESA versión. El índice sale de los .d.ts, que tienen
// todo lo que se exporta. El detalle prefiere ai/components.json (desde la 0.3.0): trae las props heredadas de
// React Aria, que los .d.ts no muestran, y ejemplos de uso sacados de Storybook.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const PAQUETE = '@desarrollospaloblanco/ui'
const REGISTRY = 'https://npm.pkg.github.com'
// Sin esta bandera, fuera de un proyecto configurado npm buscaría el paquete en npmjs.com.
const SCOPE = `--@desarrollospaloblanco:registry=${REGISTRY}`

const [raiz, accion = 'indice', ...argumentos] = process.argv.slice(2)
const ACCIONES = new Set(['indice', 'ver', 'version'])
const soloDts = argumentos.includes('--dts')
const resto = argumentos.filter((arg) => arg !== '--dts')

if (!raiz || !ACCIONES.has(accion)) {
  console.error('Uso: node scripts/catalogo.mjs <raíz-del-proyecto> [indice [texto] | ver <ruta-o-nombre> [--dts] | version]')
  console.error('Si la ruta tiene espacios, ponla entre comillas.')
  process.exit(1)
}
if (!existsSync(raiz)) {
  console.error(`No existe ${resolve(raiz)}.`)
  process.exit(1)
}

const leerJson = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : null)

// Las piezas son constantes (no hay entrada del usuario), así que armar el comando como texto es seguro y
// evita el aviso de Node por pasar argumentos con `shell: true`. El shell hace falta para npm.cmd en Windows.
const npm = (comando, cwd) => spawnSync(`npm ${comando}`, { cwd, shell: true, encoding: 'utf8' })

// Traduce el fallo de npm a la acción que lo arregla. Nunca se muestra ni se lee el token.
const diagnosticar = (salida) => {
  if (/E401|E403|ENEEDAUTH/.test(salida))
    return 'npm.pkg.github.com rechazó la autenticación: falta el token en el ~/.npmrc del usuario, venció, no tiene read:packages o falta autorizarlo para el SSO de la organización.'
  if (/E404/.test(salida))
    return /registry\.npmjs\.org/.test(salida)
      ? 'npm buscó el paquete en npmjs.com: falta la línea del scope en el .npmrc del proyecto.'
      : 'El token es válido pero no ve el paquete: pide acceso a un administrador de desarrollospaloblanco o autoriza el token para SSO.'
  if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN/.test(salida)) return 'Sin conexión con npm.pkg.github.com.'
  return `npm falló: ${salida.trim().split('\n').slice(-3).join(' ')}`
}

const declarado = (pkg) => Boolean(pkg?.dependencies?.[PAQUETE] || pkg?.devDependencies?.[PAQUETE])

// Orden de resolución: 1) el paquete instalado en el proyecto, que es la versión exacta de su lockfile;
// 2) si el proyecto ni siquiera lo declara, @latest bajado a una carpeta temporal, avisando;
// 3) si tampoco se puede bajar, se detiene: sin catálogo no se inventan componentes.
const resolverPaquete = () => {
  const instalado = join(raiz, 'node_modules', '@desarrollospaloblanco', 'ui')
  if (existsSync(join(instalado, 'package.json'))) return { dir: instalado, origen: 'instalado' }

  if (declarado(leerJson(join(raiz, 'package.json')))) {
    console.error(`${PAQUETE} está en package.json pero no en node_modules: corre «npm install» en el proyecto.`)
    process.exit(1)
  }

  const temporal = join(tmpdir(), 'dpb-ui-latest')
  rmSync(temporal, { recursive: true, force: true })
  mkdirSync(temporal, { recursive: true })
  const pack = npm(`pack ${PAQUETE}@latest --json ${SCOPE}`, temporal)
  if (pack.status !== 0) {
    console.error(`El proyecto no tiene ${PAQUETE} y no pude bajar @latest.`)
    console.error(diagnosticar(`${pack.stdout}\n${pack.stderr}`))
    console.error('Detente aquí: sin el catálogo del paquete no se escriben componentes a mano ni se traen del CLI.')
    process.exit(1)
  }
  // Nombre relativo y cwd, nunca una ruta con «C:»: el tar de GNU la tomaría por un host remoto.
  const { filename } = JSON.parse(pack.stdout)[0]
  const tar = spawnSync('tar', ['-xzf', filename], { cwd: temporal, encoding: 'utf8' })
  if (tar.status !== 0) {
    console.error(`No pude descomprimir ${join(temporal, filename)}: ${tar.stderr}`)
    process.exit(1)
  }
  const dir = join(temporal, 'package')
  const { version } = leerJson(join(dir, 'package.json'))
  console.error(`Aviso: el proyecto no tiene ${PAQUETE}; leo @latest (${version}), que puede no ser la versión que instale.`)
  return { dir, origen: 'latest' }
}

const listar = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
        const ruta = join(dir, entrada.name)
        return entrada.isDirectory() ? listar(ruta) : [ruta]
      })
    : []

// Nombres que un .d.ts exporta como valor (componentes, hooks, funciones). Los tipos se ven con «ver».
const exportados = (texto) => {
  const nombres = []
  for (const [, nombre] of texto.matchAll(/^export declare (?:const|function|class) (\w+)/gm)) nombres.push(nombre)
  for (const [, lista] of texto.matchAll(/^export \{([^}]*)\}/gm)) {
    for (const parte of lista.split(',')) {
      const limpio = parte.trim()
      if (!limpio || limpio.startsWith('type ')) continue
      nombres.push(limpio.split(/\s+as\s+/).pop())
    }
  }
  return [...new Set(nombres)]
}

// En components/ solo cuentan los componentes y hooks: `styles` y otras constantes internas son ruido.
const esPublico = (seccion, nombre) => seccion !== 'components' || /^[A-Z]|^use[A-Z]/.test(nombre)

// Todos los .d.ts, también los de solo tipos (`badge-types`): el índice los omite, pero «ver» los encuentra.
const catalogo = (dir) =>
  ['components', 'hooks', 'utils'].flatMap((seccion) =>
    listar(join(dir, 'dist', seccion))
      .filter((archivo) => archivo.endsWith('.d.ts'))
      .map((archivo) => {
        const ruta = `${seccion}/${relative(join(dir, 'dist', seccion), archivo).replaceAll('\\', '/').replace(/\.d\.ts$/, '')}`
        const nombres = exportados(readFileSync(archivo, 'utf8')).filter((nombre) => esPublico(seccion, nombre))
        return { ruta, archivo, nombres }
      })
      .sort((a, b) => a.ruta.localeCompare(b.ruta)),
  )

// Las rutas de los tipos que un .d.ts importa de otros archivos del paquete, para seguirlas con «ver».
const importados = (ruta, texto) =>
  [...new Set([...texto.matchAll(/from "(\.{1,2}\/[^"]+?)(?:\.js)?"/g)].map(([, rel]) => rel))].map((rel) => {
    const partes = ruta.split('/').slice(0, -1)
    for (const parte of rel.split('/')) {
      if (parte === '..') partes.pop()
      else if (parte !== '.') partes.push(parte)
    }
    return partes.join('/').replace(/^components\//, '')
  })

// El catálogo ai/components.json por ruta de import. Una ruta puede tener varios componentes (`Badge` y
// `BadgeWithDot` viven en badges.tsx), y cada uno se queda con los ejemplos que lo renderizan a él.
const cargarAi = (dir) => {
  const archivo = join(dir, 'ai', 'components.json')
  if (!existsSync(archivo)) return null
  const porRuta = new Map()
  for (const componente of Object.values(leerJson(archivo).components ?? {})) {
    for (const pieza of [componente, ...(componente.subcomponents ?? [])]) {
      const ejemplos = (componente.stories ?? []).filter(({ snippet }) => new RegExp(`<${pieza.name}[\\s/>.]`).test(snippet))
      porRuta.set(pieza.route, [...(porRuta.get(pieza.route) ?? []), { ...pieza, ejemplos }])
    }
  }
  return porRuta
}

const primeraLinea = (texto) => texto.split('\n')[0].trim()
const recortar = (texto, largo) => (texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto)

// Una línea por prop: «nombre?: tipo = defecto — descripción». Sin «?» es obligatoria.
const imprimirPieza = ({ import: linea, description, props = {}, ejemplos }) => {
  console.log(`\n${linea}`)
  if (description) console.log(`// ${primeraLinea(description)}`)
  console.log('Props (con las heredadas de React Aria):')
  for (const prop of Object.values(props)) {
    const defecto = prop.defaultValue != null ? ` = ${prop.defaultValue}` : ''
    const ayuda = prop.description ? ` — ${recortar(primeraLinea(prop.description), 100)}` : ''
    console.log(`  ${prop.name}${prop.required ? '' : '?'}: ${recortar(prop.type ?? 'unknown', 90)}${defecto}${ayuda}`)
  }
  if (!ejemplos.length) return
  console.log('Ejemplos:')
  for (const { name, snippet } of ejemplos) console.log(`  // ${name}\n${snippet.replace(/^/gm, '  ')}`)
}

const indice = ({ dir }) => {
  const { version } = leerJson(join(dir, 'package.json'))
  const ai = cargarAi(dir)
  const filtro = resto.join(' ').toLowerCase()
  const entradas = catalogo(dir).filter(({ nombres }) => nombres.length).filter(
    ({ ruta, nombres }) => !filtro || ruta.toLowerCase().includes(filtro) || nombres.some((n) => n.toLowerCase().includes(filtro)),
  )
  console.log(`${PAQUETE}@${version} · import desde "${PAQUETE}/<ruta>" · detalle: «ver <ruta>»`)
  console.log(ai ? 'Con catálogo ai/: «ver» trae props (con las heredadas) y ejemplos.' : 'Sin catálogo ai/ (antes de la 0.3.0): «ver» muestra los tipos .d.ts.')
  for (const { ruta, nombres } of entradas) {
    const ejemplos = (ai?.get(ruta) ?? []).reduce((total, pieza) => total + pieza.ejemplos.length, 0)
    console.log(`${ruta}  ${nombres.join(', ')}${ejemplos ? `  · ${ejemplos} ${ejemplos === 1 ? 'ejemplo' : 'ejemplos'}` : ''}`)
  }
  if (!entradas.length) console.log(`Nada coincide con «${filtro}». Si el componente no existe, se propone al equipo del design system.`)
}

const ver = ({ dir }) => {
  const pedido = resto.join(' ').trim()
  if (!pedido) {
    console.error('Falta qué ver: una ruta («base/buttons/button») o un nombre exportado («Button»).')
    process.exit(1)
  }
  const entradas = catalogo(dir)
  // Acepta la ruta con o sin el prefijo del paquete y de components/, o el nombre exportado.
  const ruta = pedido.replace(`${PAQUETE}/`, '').replace(/^\/+/, '')
  // Por ruta, cualquier .d.ts (también los de solo tipos); por nombre, lo que exporta como valor.
  const candidatas = pedido.includes('/')
    ? entradas.filter((e) => e.ruta === ruta || e.ruta === `components/${ruta}`)
    : entradas.filter((e) => e.nombres.includes(pedido))

  if (candidatas.length !== 1) {
    const ultimo = ruta.split('/').pop().toLowerCase()
    const parecidas = candidatas.length
      ? candidatas
      : entradas.filter((e) => e.ruta.toLowerCase().includes(ultimo) || e.nombres.some((n) => n.toLowerCase().includes(ultimo)))
    console.error(candidatas.length ? `«${pedido}» se exporta desde varias rutas; elige una:` : `No encuentro «${pedido}».`)
    for (const e of parecidas.slice(0, 15)) console.error(`  ${e.ruta}  ${e.nombres.join(', ')}`)
    process.exit(1)
  }

  const [{ ruta: elegida, archivo, nombres }] = candidatas
  const { version } = leerJson(join(dir, 'package.json'))

  // Con catálogo ai/, su detalle; pedido por nombre, solo ese componente de la ruta.
  const piezas = soloDts ? [] : (cargarAi(dir)?.get(elegida) ?? [])
  const mostrar = pedido.includes('/') ? piezas : piezas.filter((pieza) => pieza.name === pedido)
  if (mostrar.length) {
    console.log(`// ${PAQUETE}@${version} · ${elegida} · catálogo ai/ (los tipos: «ver ${elegida.replace(/^components\//, '')} --dts»)`)
    for (const pieza of mostrar) imprimirPieza(pieza)
    return
  }

  const texto = readFileSync(archivo, 'utf8')
  console.log(`// ${PAQUETE}@${version} · ${elegida}`)
  console.log(
    nombres.length
      ? `import { ${nombres.join(', ')} } from "${PAQUETE}/${elegida}";\n`
      : `// Solo exporta tipos: import type { … } from "${PAQUETE}/${elegida}";\n`,
  )
  console.log(texto)
  // Las props heredadas (`extends Aria…Props`) son las de react-aria-components: no salen aquí, y el
  // typecheck las confirma. Los tipos de otros archivos del paquete sí se pueden seguir.
  const otros = importados(elegida, texto)
  if (otros.length) console.log(`// Tipos de otros archivos del paquete: ${otros.map((r) => `«ver ${r}»`).join(', ')}`)
}

const compararVersiones = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('-')[0].split('.').map(Number))
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

const version = () => {
  const instalado = leerJson(join(raiz, 'node_modules', '@desarrollospaloblanco', 'ui', 'package.json'))
  const pkg = leerJson(join(raiz, 'package.json'))
  if (!instalado) {
    console.log(declarado(pkg) ? `${PAQUETE} está declarado pero no instalado: corre «npm install».` : `El proyecto no usa ${PAQUETE}.`)
    return
  }
  const rango = pkg?.dependencies?.[PAQUETE] ?? pkg?.devDependencies?.[PAQUETE] ?? '(no declarado)'
  console.log(`Instalada: ${instalado.version} · rango en package.json: ${rango}`)

  // Sin la línea del scope, npm resolvería el nombre en npmjs.com, donde cualquiera puede publicar uno igual.
  const npmrc = existsSync(join(raiz, '.npmrc')) ? readFileSync(join(raiz, '.npmrc'), 'utf8') : ''
  const lineaScope = new RegExp(`^\\s*@desarrollospaloblanco:registry\\s*=\\s*${REGISTRY.replaceAll('.', '\\.')}/?\\s*$`, 'm')
  if (!lineaScope.test(npmrc))
    console.log(`Aviso: el .npmrc del proyecto no tiene «@desarrollospaloblanco:registry=${REGISTRY}».`)

  const resuelto = leerJson(join(raiz, 'package-lock.json'))?.packages?.['node_modules/@desarrollospaloblanco/ui']?.resolved
  if (resuelto && !resuelto.startsWith(REGISTRY))
    console.log(`Aviso: package-lock.json lo resuelve desde ${resuelto}, no desde ${REGISTRY}.`)

  const vista = npm(`view ${PAQUETE} version --json ${SCOPE}`, raiz)
  if (vista.status !== 0) {
    console.log(`No pude consultar la última versión. ${diagnosticar(`${vista.stdout}\n${vista.stderr}`)}`)
    return
  }
  const ultima = JSON.parse(vista.stdout)
  const diferencia = compararVersiones(ultima, instalado.version)
  if (diferencia <= 0) {
    console.log(`Al día: ${ultima} es la última.`)
    return
  }
  // En 0.x cada minor puede romper (y npm update no la toma); en 1.x+, cada major.
  const [maI, miI] = instalado.version.split('.').map(Number)
  const [maU, miU] = ultima.split('.').map(Number)
  const rompe = maU !== maI || (maI === 0 && miU !== miI)
  console.log(
    rompe
      ? `Hay una versión nueva que puede romper: ${ultima}. Lee su CHANGELOG antes y, si el usuario decide, «npm install ${PAQUETE}@^${ultima}» y luego typecheck y build.`
      : `Hay una corrección: ${ultima}. Entra en el rango: «npm update ${PAQUETE}», y luego typecheck y build.`,
  )
}

if (accion === 'version') version()
else (accion === 'ver' ? ver : indice)(resolverPaquete())
