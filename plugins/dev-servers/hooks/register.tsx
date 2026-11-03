import { atom, read, update } from 'claude-code'
import type { EngineInterface, FsEntry, HookStream, ProcessSpawnChunk, ProcessSpawnResult, Register, RenderNode } from 'claude-code'

import type { Message, Notice, Project, Segment } from '../types'

// Cada proyecto de la carpeta con script `dev`, por su ruta, y cómo va su servidor.
const projects = atom({ plugin: 'dev-servers', key: 'projects' } as const, {})
// Lo que muestra cada mensaje puesto en el chat, por su id. Cambia la etiqueta si cambian los campos de Message.
const messages = atom({ plugin: 'dev-servers', key: 'messages' } as const, {}, { shape: 'messages-1' })

// Carpetas donde nunca se busca un proyecto: dependencias y salida de build.
const SKIPPED = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', 'target', 'bin', 'obj'])
const SEPARATOR = ' · '
// Por debajo de estas columnas el botón del pie es solo el glifo.
const NARROW_COLUMNS = 100
const MESSAGES_KEPT = 20
const LINES_KEPT = 40
const LINES_SHOWN = 12
// Líneas de stack que se guardan junto a un error.
const STACK_LINES = 12
// Lo que se espera a que el servidor termine después de cerrar su stream.
const STOP_WAIT_MS = 5000
// Lo que la herramienta de Claude espera a que un servidor diga su URL.
const START_WAIT_MS = 20000
const ACTION_INDENT = 6

const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g
const URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\])(?::\d+)?/i
const PORT_PATTERN = /\b(?:port|puerto)\b\D{0,6}(\d{2,5})\b/i
// "Error:", "TypeError", "ReferenceError", "UnhandledPromiseRejection", "npm ERR!"... pero no "errors" ni avisos.
const ERROR_PATTERN = /\b\w*(?:error|exception)\b|\bunhandled|\berr!/i
const NOT_AN_ERROR = /\b0 errors?\b|\berrors?:\s*0\b/i

type Action = 'start' | 'stop' | 'restart' | 'open' | 'error' | 'lines'
type Running = { stream: HookStream<ProcessSpawnChunk, ProcessSpawnResult>; done: Promise<void>; isStopping: boolean }

// Los servidores vivos, por carpeta. Vive en el módulo: al recargarse, el motor mata cada intermedio y su
// guardián mata el árbol, así que empezar vacío es lo correcto.
const running = new Map<string, Running>()
// Distingue dos mensajes puestos en el mismo milisegundo.
let placed = 0

const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** El proyecto de `path` si su package.json tiene script `dev`. */
async function projectOf ($: EngineInterface, name: string, path: string): Promise<Project | undefined> {
  const text = await $.fs.read(`${path}/package.json`).catch(() => undefined)
  if (typeof text !== 'string') return undefined
  let scripts: unknown
  try {
    scripts = (JSON.parse(text) as { scripts?: unknown }).scripts
  } catch {
    return undefined
  }
  const command = (scripts as { dev?: unknown } | undefined)?.dev
  if (typeof command !== 'string' || command.trim() === '') return undefined
  return { name, path, command, status: 'stopped', url: '', lines: [], errors: 0, lastError: '', exitCode: null }
}

/** La carpeta de la sesión y cada subcarpeta directa que sea un proyecto con script `dev`. */
async function projectsIn ($: EngineInterface, root: string): Promise<Project[]> {
  const entries = await $.fs.list(root).catch((): FsEntry[] => [])
  const folders = entries
    .filter(entry => entry.kind === 'dir' && !entry.name.startsWith('.') && !SKIPPED.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name }) => ({ name, path: `${root}/${name}` }))
  const found = await Promise.all([{ name: baseName(root), path: root }, ...folders].map(({ name, path }) => projectOf($, name, path)))
  return found.filter((project): project is Project => project !== undefined)
}

/** Vuelve a buscar los proyectos sin perder el estado de los que siguen ahí ni de los que están corriendo. */
async function refresh ($: EngineInterface) {
  const found = await projectsIn($, await $.session.root())
  await update($, projects, all => {
    const kept = Object.values(all).filter(project => running.has(project.path) && !found.some(f => f.path === project.path))
    return Object.fromEntries([...found.map(project => all[project.path] ?? project), ...kept].map(project => [project.path, project]))
  })
}

async function patch ($: EngineInterface, path: string, fn: (project: Project) => Partial<Project>) {
  await update($, projects, all => {
    const project = all[path]
    return project ? { ...all, [path]: { ...project, ...fn(project) } } : all
  })
}

/** Lo que unas líneas nuevas de la salida cambian del proyecto: URL, errores y las últimas líneas. */
function absorb (project: Project, lines: string[], stackLeft: number) {
  let { url, errors, lastError } = project
  for (const line of lines) {
    if (!url) {
      const port = PORT_PATTERN.exec(line)?.[1]
      const found = URL_PATTERN.exec(line)?.[0] ?? (port ? `http://localhost:${port}` : '')
      url = found.replace(/0\.0\.0\.0|\[::1?\]|127\.0\.0\.1/, 'localhost')
    }
    if (ERROR_PATTERN.test(line) && !NOT_AN_ERROR.test(line)) {
      errors++
      lastError = line
      stackLeft = STACK_LINES
    } else if (stackLeft > 0 && /^\s+\S/.test(line)) {
      lastError += '\n' + line
      stackLeft--
    } else {
      stackLeft = 0
    }
  }
  const changes: Partial<Project> = { status: 'running', url, errors, lastError, lines: [...project.lines, ...lines].slice(-LINES_KEPT) }
  return { changes, stackLeft }
}

/** Lee la salida del servidor hasta que termina, y deja dicho cómo terminó. */
async function follow ($: EngineInterface, path: string, entry: Running) {
  let pending = ''
  let stackLeft = 0
  let exitCode: number | null = null
  try {
    for await (const { text } of entry.stream) {
      const parts = (pending + text.replace(ANSI, '')).split(/\r?\n/)
      pending = parts.pop() ?? ''
      const lines = parts.filter(line => line.trim() !== '')
      if (lines.length === 0) continue
      const project = (await read($, projects))[path]
      if (!project) continue
      const absorbed = absorb(project, lines, stackLeft)
      stackLeft = absorbed.stackLeft
      await patch($, path, () => absorbed.changes)
    }
    exitCode = (await entry.stream.result).code
  } catch (error) {
    if (!entry.isStopping) {
      await patch($, path, project => ({ lines: [...project.lines, `✕ ${messageOf(error)}`].slice(-LINES_KEPT) })).catch(() => {})
    }
  } finally {
    running.delete(path)
    // Si el módulo se está descargando, el estado ya no se puede escribir: no hay a quién avisarle.
    await patch($, path, () => (entry.isStopping ? { status: 'stopped', exitCode: null } : { status: 'exited', exitCode })).catch(() => {})
  }
}

async function start ($: EngineInterface, path: string): Promise<Notice> {
  const project = (await read($, projects))[path]
  if (!project) return { text: 'Ese proyecto ya no está en la carpeta.', isError: true }
  if (running.has(path)) return { text: `${project.name} ya está corriendo.`, isError: false }
  // El botón nunca instala nada: sin dependencias no arranca, y lo dice.
  if (!(await $.fs.exists(`${path}/node_modules`).catch(() => false))) {
    return { text: `${project.name} no tiene node_modules: instala sus dependencias primero (el botón no instala nada).`, isError: true }
  }
  await patch($, path, () => ({ status: 'starting', url: '', lines: [], errors: 0, lastError: '', exitCode: null }))
  const stream = $.process.spawn({
    argv: ['node', `${$.plugin.root}/bin/dev-wrapper.js`, project.command],
    cwd: path,
    // Sin colores, y sin que Vite o CRA abran su propio navegador: eso lo decide quien usa el botón.
    env: { FORCE_COLOR: '0', NO_COLOR: '1', BROWSER: 'none' }
  })
  const entry: Running = { stream, done: Promise.resolve(), isStopping: false }
  running.set(path, entry)
  entry.done = follow($, path, entry)
  return { text: `Levantando ${project.name} (${project.command})…`, isError: false }
}

async function stop ($: EngineInterface, path: string): Promise<Notice> {
  const name = (await read($, projects))[path]?.name ?? baseName(path)
  const entry = running.get(path)
  if (!entry) return { text: `${name} no está corriendo.`, isError: false }
  entry.isStopping = true
  // Cerrar el stream mata al intermedio; su guardián se entera y mata el árbol completo.
  void entry.stream.return(undefined as never).catch(() => {})
  const hasEnded = await Promise.race([entry.done.then(() => true), $.clock.sleep(STOP_WAIT_MS).then(() => false)])
  if (!hasEnded) return { text: `${name} se está deteniendo…`, isError: false }
  // El bucle que lee la salida ya lo marcó detenido, pero con el `$` con que se arrancó el servidor: quien
  // lee con este `$` (la respuesta de la herramienta de Claude) aún no lo ve. Se escribe también desde aquí.
  await patch($, path, () => ({ status: 'stopped', exitCode: null }))
  return { text: `${name} detenido.`, isError: false }
}

/** Abre la app en Chrome con Claude in Chrome, en su grupo de pestañas, y se lo dice a Claude para validarla. */
async function openInChrome ($: EngineInterface, path: string): Promise<Notice> {
  const project = (await read($, projects))[path]
  if (!project?.url) return { text: 'Todavía no se sabe en qué URL escucha.', isError: true }
  try {
    const result = await $.mcp.call('claude-in-chrome', 'navigate', { url: project.url })
    const said = result.content.map(block => ('text' in block && typeof block.text === 'string' ? block.text : '')).join(' ').trim()
    if (result.isError) return { text: `Chrome no la abrió: ${said.slice(0, 160)}`, isError: true }
    await tell($, `${project.name} corre en ${project.url} (${project.command}) y la abrí en Chrome, en el grupo de pestañas de Claude in Chrome, para que la validemos.`)
    return { text: `Abierta en Chrome: ${project.url}`, isError: false }
  } catch (error) {
    // En modo automático el clasificador rechaza la llamada que hace el mod, aunque la pulse el usuario: no es
    // una petición suya a Claude. Se deja en el prompt un borrador para pedírsela a Claude; al enviarlo, sí lo es.
    const isAutoMode = /auto mode/i.test(messageOf(error))
    const why = isAutoMode ? 'El modo automático no deja que el mod abra Chrome' : `No se pudo usar Claude in Chrome (${messageOf(error).slice(0, 120)})`
    const draft = `Abre ${project.url} en Chrome con Claude in Chrome y valida que ${project.name} cargue sin errores en la consola.`
    const filled = await $.prompt.fill({ text: draft, mode: 'replace' }).catch(() => undefined)
    if (filled?.isFilled) return { text: `${why}: te dejé el pedido en el prompt, envíalo para que Claude la abra.`, isError: false }
    const copied = await $.ui.copy({ text: project.url }).catch(() => undefined)
    return { text: `${why}. ${copied?.isCopied ? `Copié ${project.url} al portapapeles.` : `Ábrela tú: ${project.url}`}`, isError: true }
  }
}

/** Deja el último error en la caja del prompt, sin enviarlo: quien lo usa decide qué pedirle a Claude. */
async function errorToPrompt ($: EngineInterface, path: string): Promise<Notice> {
  const project = (await read($, projects))[path]
  if (!project?.lastError) return { text: 'No hay errores que pasar.', isError: false }
  const text = `Este error salió en el servidor dev de ${project.name} (${project.command}):\n\`\`\`\n${project.lastError}\n\`\`\`\n`
  const filled = await $.prompt.fill({ text, mode: 'append' })
  return filled.isFilled
    ? { text: 'El error quedó en el prompt: agrega qué quieres y envíalo.', isError: false }
    : { text: 'No se pudo escribir en el prompt.', isError: true }
}

/** Le deja una nota a Claude de lo que pasó, para que no siga con una idea vieja. */
async function tell ($: EngineInterface, text: string) {
  await $.session.append({ message: { type: 'user', content: [{ type: 'text', text: `[dev-servers] ${text}` }] } }).catch(() => {})
}

async function post ($: EngineInterface) {
  await refresh($)
  const root = await $.session.root()
  const first = Object.values(await read($, projects))[0]?.path ?? ''
  const id = `dev-${await $.clock.now()}-${placed++}`
  const message: Message = { root, selected: first, showLines: false, isBusy: false, notice: null }
  await update($, messages, all => Object.fromEntries([...Object.entries(all), [id, message]].slice(-MESSAGES_KEPT)))
  return $.ui.place({ id })
}

async function change ($: EngineInterface, id: string, fn: (message: Message) => Partial<Message>) {
  await update($, messages, all => {
    const message = all[id]
    return message ? { ...all, [id]: { ...message, ...fn(message) } } : all
  })
}

async function act ($: EngineInterface, id: string, action: Action) {
  const message = (await read($, messages))[id]
  if (!message || message.isBusy) return
  if (action === 'lines') return change($, id, now => ({ showLines: !now.showLines, notice: null }))
  const path = message.selected
  await change($, id, () => ({ isBusy: true, notice: null }))
  let notice: Notice
  try {
    if (action === 'start') notice = await start($, path)
    else if (action === 'stop') notice = await stop($, path)
    else if (action === 'restart') {
      await stop($, path)
      notice = await start($, path)
    } else if (action === 'open') notice = await openInChrome($, path)
    else notice = await errorToPrompt($, path)
  } catch (error) {
    notice = { text: messageOf(error), isError: true }
  }
  await change($, id, () => ({ isBusy: false, notice }))
}

function statusOf (project: Project): Segment {
  if (project.status === 'starting') return { text: '… arrancando', isDim: true }
  if (project.status === 'running') return { text: `● ${project.url || 'corriendo'}`, color: 'success' }
  if (project.status === 'exited') return { text: `✕ terminó (${project.exitCode ?? '?'})`, color: 'error' }
  return { text: '○ detenido', isDim: true }
}

/** Para la herramienta de Claude: una línea por proyecto. */
function describe (project: Project) {
  const errors = project.errors > 0 ? `${SEPARATOR}${plural(project.errors, 'error', 'errores')}` : ''
  return `${project.name} (${project.command}): ${statusOf(project).text}${errors}`
}

/** Si un dibujo de abajo no muestra nada: ni texto ni controles. */
function isBlank (node: RenderNode | undefined): boolean {
  if (node === undefined || node === null) return true
  if (typeof node === 'string') return node.trim() === ''
  if (node.type === 'engine') return true
  return (node.type === 'Box' || node.type === 'Text') && (node.children ?? []).every(isBlank)
}

export const register: Register = on => {
  placed = 0

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'dev', description: 'Muestra los servidores dev de los proyectos de la carpeta' })
    await $.tool.register({
      name: 'dev',
      description:
        'Servidores dev de los proyectos de la carpeta (el mod ▶ dev). action: "status" lista cada proyecto; ' +
        '"start" lo levanta y espera su URL; "stop" lo detiene con todo su árbol de procesos; "open" abre su URL en ' +
        'Chrome con Claude in Chrome. project: el nombre de la carpeta (opcional si hay uno solo).',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['status', 'start', 'stop', 'open'] },
          project: { type: 'string' }
        },
        required: ['action']
      }
    })
    // Lo que el módulo anterior tenía corriendo ya murió con él: se empieza de cero.
    const found = await projectsIn($, await $.session.root())
    await update($, projects, () => Object.fromEntries(found.map(project => [project.path, project])))
    return started
  })

  on('command.run', { command: 'dev' }, async $ => {
    const posted = await post($)
    return posted.isPlaced ? {} : { text: `No se pudieron mostrar los servidores: ${posted.reason}` }
  })

  // La herramienta de Claude: lo mismo que el botón, para que Claude también pueda levantar y validar.
  on('tool.call', { tool: 'mcp__dev-servers__dev' }, async ($, e) => {
    const input = e as unknown as { action?: string; project?: string }
    const all = Object.values(await read($, projects))
    const project = input.project ? all.find(p => p.name === input.project) : all.length === 1 ? all[0] : undefined
    const listed = all.length > 0 ? all.map(describe).join('\n') : 'No hay proyectos con script "dev" en la carpeta.'
    if (input.action === 'status') return { result: listed }
    if (!project) return { result: `Di cuál proyecto (project). Hay:\n${listed}` }
    let notice: Notice
    if (input.action === 'start') {
      notice = await start($, project.path)
      const deadline = (await $.clock.now()) + START_WAIT_MS
      while (!notice.isError && (await $.clock.now()) < deadline) {
        const now = (await read($, projects))[project.path]
        if (!now || now.url || now.status === 'exited') break
        await $.clock.sleep(250)
      }
    } else if (input.action === 'stop') notice = await stop($, project.path)
    else notice = await openInChrome($, project.path)
    const now = (await read($, projects))[project.path] ?? project
    // Si terminó solo o tuvo errores, Claude necesita ver por qué.
    const detail = now.status === 'exited' || now.errors > 0
      ? `\nÚltimo error:\n${now.lastError || '(ninguno)'}\nÚltimas líneas:\n${now.lines.slice(-8).join('\n')}`
      : ''
    return { result: `${notice.isError ? '✕ ' : ''}${notice.text}\n${describe(now)}${detail}` }
  }).catch(() => ({ result: '✕ El mod dev-servers falló al atender la llamada.' }))

  // El pie, junto al modo de permisos: lo de abajo y luego el botón. Nada si la carpeta no tiene proyectos.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const [all, beneath] = await Promise.all([read($, projects), next(e)])
    const list = Object.values(all)
    if (list.length === 0) return beneath
    const { Box, Button, Text } = $.ui.resolve(e)
    const hasBeneath = e.props.modes.length > 0 || !isBlank(beneath)
    const isNarrow = e.surface === 'terminal' && (e.viewport?.columns ?? Infinity) < NARROW_COLUMNS
    const up = list.filter(project => project.status === 'running' || project.status === 'starting').length
    const hasTrouble = list.some(project => project.errors > 0 || (project.status === 'exited' && project.exitCode !== 0))
    const label = up > 0 ? (isNarrow ? '●' : `● dev ${up}/${list.length}`) : isNarrow ? '▶' : '▶ dev'

    return (
      <Box flexDirection="row">
        {hasBeneath ? beneath : null}
        {hasBeneath ? <Text dimColor>{SEPARATOR}</Text> : null}
        <Button key="dev" plain onPress={() => void post($).catch(() => {})}>
          <Text color="claude">{label}</Text>
          {hasTrouble ? <Text color="error"> ✕</Text> : null}
        </Button>
      </Box>
    )
  })

  // Un mensaje: cada proyecto con su servidor (al pulsarlo se elige), y las acciones del elegido.
  // Se dibuja con el estado vivo, no con el del momento en que se puso.
  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== 'dev-servers') return next(e)
    const id = e.props.id
    const [all, message] = await Promise.all([read($, projects), read($, messages).then(m => m[id])])
    if (!message) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const texts = (segments: Segment[]) => segments.map(s => <Text color={s.color} bold={s.isBold} dimColor={s.isDim}>{s.text}</Text>)
    const line = (segments: Segment[]) => <Box flexDirection="row">{texts(segments)}</Box>
    const list = Object.values(all)
    const folder = baseName(message.root)
    const target = all[message.selected] ?? list[0]
    if (!target) return line([{ text: '▶ ', color: 'claude' }, { text: `No hay proyectos con script "dev" en ${folder} ni en sus subcarpetas.`, isDim: true }])

    const hasChoice = list.length > 1
    const width = Math.max(...list.map(project => project.name.length))
    const row = (project: Project): Segment[] => [
      hasChoice ? (project.path === target.path ? { text: '● ', color: 'claude' } : { text: '○ ', isDim: true }) : { text: '  ' },
      { text: project.name.padEnd(width), isBold: project.path === target.path },
      { text: '  ' },
      statusOf(project),
      ...(project.errors > 0 ? [{ text: SEPARATOR + plural(project.errors, 'error', 'errores'), color: 'error' }] : [])
    ]
    const action = (key: Action, glyph: string, label: string) => (
      <Button key={key} plain onPress={() => void act($, id, key).catch(() => {})}>
        {texts([{ text: ' '.repeat(ACTION_INDENT) + glyph + ' ', color: 'claude' }, { text: label, color: 'claude' }])}
      </Button>
    )
    const isUp = target.status === 'running' || target.status === 'starting'

    return (
      <Box flexDirection="column">
        {line([{ text: '▶ ', color: 'claude' }, { text: 'Servidores dev', isBold: true }, { text: SEPARATOR + folder, isDim: true }])}
        {list.map(project =>
          hasChoice
            ? <Button key={`p:${project.name}`} plain onPress={() => void change($, id, () => ({ selected: project.path, notice: null })).catch(() => {})}>{texts(row(project))}</Button>
            : line(row(project))
        )}
        {message.isBusy && line([{ text: ' '.repeat(ACTION_INDENT) + '… trabajando', isDim: true }])}
        {!message.isBusy && !isUp && action('start', '▶', `levantar ${target.name}`)}
        {!message.isBusy && isUp && action('stop', '■', 'detener')}
        {!message.isBusy && isUp && action('restart', '↻', 'reiniciar')}
        {!message.isBusy && target.status === 'running' && target.url !== '' && action('open', '↗', 'abrir en Chrome')}
        {!message.isBusy && target.lastError !== '' && action('error', '⚠', 'último error → prompt')}
        {target.lines.length > 0 && action('lines', message.showLines ? '▾' : '▸', 'últimas líneas')}
        {message.showLines && (
          <Box flexDirection="column" paddingLeft={ACTION_INDENT + 2}>
            {target.lines.slice(-LINES_SHOWN).map(text => <Text dimColor>{text}</Text>)}
          </Box>
        )}
        {message.notice && (
          <Box paddingLeft={ACTION_INDENT}>
            <Text color={message.notice.isError ? 'error' : 'success'}>{(message.notice.isError ? '✕ ' : '✓ ') + message.notice.text}</Text>
          </Box>
        )}
      </Box>
    )
  })
}
