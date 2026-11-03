import { expect, mock, test } from 'claude-code/testing'
import type { FsEntry, On } from 'claude-code'

const ROOT = 'C:/proyectos/tratos'
const WEB = `${ROOT}/tratos-web`
const API = `${ROOT}/tratos-api`

const SESSION = { cwd: ROOT, surface: 'terminal', isInteractive: true } as const
// The person typed `/dev` in a wide fullscreen terminal.
const RUN = { command: 'dev', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const FOOTER = { plugin: 'dev-servers', component: 'SessionMode', requestId: 'footer', props: { modes: [] } } as const
const message = (id: string, surface: 'terminal' | 'desktop' = 'terminal') =>
  ({ plugin: 'dev-servers', component: 'Placed', requestId: id, surface, props: { id, plugin: 'dev-servers' } } as const)

// What a folder lists, its package.json, whether it has node_modules, and what its dev server writes when started.
type Folder = { entries?: string[]; packageJson?: string; hasModules?: boolean; output?: string[]; exitCode?: number }

/** A frontend with dependencies, an API without them, and folders that are no project. */
function tratos (): Record<string, Folder> {
  return {
    [ROOT]: { entries: ['tratos-web', 'tratos-api', 'docs', 'node_modules', '.vscode'] },
    [WEB]: {
      packageJson: JSON.stringify({ scripts: { dev: 'next dev -p 4000', build: 'next build' } }),
      hasModules: true,
      output: ['▲ Next.js 16.1.6 (Turbopack)\n', '- Local:         http://localhost:4000\n- Network:       http://192.168.1.5:4000\n', '✓ Ready in 1.2s\n']
    },
    [API]: { packageJson: JSON.stringify({ scripts: { dev: 'tsx watch src/index.ts' } }), hasModules: false },
    [`${ROOT}/docs`]: { packageJson: JSON.stringify({ scripts: { build: 'vitepress build' } }) }
  }
}

/** A server the plugin started: what it ran, where, and whether its stream was closed. */
type Server = { argv: readonly string[]; cwd: string; isClosed: boolean }

/** Stands for the folder, the processes and the engine beneath the plugin. */
function engine (on: On, folders: Record<string, Folder>, servers: Server[] = [], placed: string[] = []) {
  // The engine hands fs paths on in the platform's spelling: backslashes on Windows.
  const slashed = (path: string) => path.replace(/\\/g, '/')
  on('fs.list', (_, e) => ({
    value: (folders[slashed(e.path)]?.entries ?? []).map((name): FsEntry => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false }))
  }))
  on('fs.read', (_, e) => {
    const folder = folders[slashed(e.path).replace(/\/package\.json$/, '')]
    return folder?.packageJson ? { value: folder.packageJson } : { deny: `ENOENT: ${e.path}` }
  })
  on('fs.exists', (_, e) => {
    const path = slashed(e.path)
    return { value: path.endsWith('/node_modules') && folders[path.replace(/\/node_modules$/, '')]?.hasModules === true }
  })
  // A dev server: writes its output, then runs until its stream is closed (or exits with `exitCode`).
  on('process.spawn', async function * (_, e, next) {
    const folder = folders[slashed(e.cwd ?? '')]
    const server: Server = { argv: e.argv, cwd: slashed(e.cwd ?? ''), isClosed: false }
    servers.push(server)
    try {
      for (const text of folder?.output ?? []) yield { stream: 'stdout' as const, text }
      if (folder?.exitCode !== undefined) return { value: { code: folder.exitCode, signal: null } }
      await new Promise<void>(resolve => next.signal.addEventListener('abort', () => resolve()))
      return { value: { code: null, signal: 'SIGTERM' } }
    } finally {
      server.isClosed = true
    }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: ROOT }))
  const clock = mock.clock(on, { now: Date.parse('2026-11-03T12:00:00Z') })
  on('command.register', () => ({ value: { command: 'dev' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__dev-servers__dev' } }))
  on('ui.place', (_, e) => {
    placed.push(e.id)
    return { value: { isPlaced: true, requestId: e.id } }
  })
  // The engine's own footer: the permission mode's label.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>auto mode on</Text>
  })
  return clock
}

test('the footer button lists the projects with a dev script, and skips the folders that are not', async ($, on) => {
  const placed: string[] = []
  engine(on, tratos(), [], placed)
  await $.session.start(SESSION)
  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect((await footer.find({ key: 'dev' }))?.text).toBe('▶ dev')
  await footer.press({ key: 'dev' })
  await footer.unmount()
  expect(placed.length).toBe(1)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(message(placed[0]!, surface))
    expect(await ui.find({ type: 'Text', text: /Servidores dev/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /tratos-web/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /tratos-api/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /docs|node_modules|vscode/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('a folder without projects shows no button', async ($, on) => {
  engine(on, { [ROOT]: { entries: ['docs'] }, [`${ROOT}/docs`]: {} })
  await $.session.start(SESSION)
  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect(await footer.find({ key: 'dev' })).toBeUndefined()
  expect(await footer.find({ type: 'Text', text: /auto mode on/ })).toBeDefined()
  await footer.unmount()
})

test('starting a project runs its dev script through the wrapper and shows where it listens', async ($, on) => {
  const placed: string[] = []
  const servers: Server[] = []
  engine(on, tratos(), servers, placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'p:tratos-web' })
  await ui.press({ key: 'start' })
  expect(servers.length).toBe(1)
  expect(servers[0]!.argv[0]).toBe('node')
  expect(servers[0]!.argv[1]).toMatch(/[\\/]bin[\\/]dev-wrapper\.js$/)
  expect(servers[0]!.argv[2]).toBe('next dev -p 4000')
  expect(servers[0]!.cwd).toBe(WEB)
  expect(await ui.find({ type: 'Text', text: /● http:\/\/localhost:4000/ })).toBeDefined()
  expect(await ui.find({ key: 'stop' })).toBeDefined()

  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect((await footer.find({ key: 'dev' }))?.text).toBe('● dev 1/2')
  await footer.unmount()
  await ui.press({ key: 'stop' })
  await ui.unmount()
})

test('stopping closes the server stream, which is what kills its whole tree', async ($, on) => {
  const placed: string[] = []
  const servers: Server[] = []
  engine(on, tratos(), servers, placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'p:tratos-web' })
  await ui.press({ key: 'start' })
  await ui.press({ key: 'stop' })
  expect(servers[0]!.isClosed).toBe(true)
  expect(await ui.find({ type: 'Text', text: /✓ tratos-web detenido/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /○ detenido/ })).toBeDefined()
  expect(await ui.find({ key: 'start' })).toBeDefined()
  await ui.unmount()
})

test('a project without node_modules is not started: the button never installs anything', async ($, on) => {
  const placed: string[] = []
  const servers: Server[] = []
  engine(on, tratos(), servers, placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'p:tratos-api' })
  await ui.press({ key: 'start' })
  expect(servers.length).toBe(0)
  expect(await ui.find({ type: 'Text', text: /✕ tratos-api no tiene node_modules/ })).toBeDefined()
  await ui.unmount()
})

test('errors are counted with their stack, warnings are not, and the last one goes to the prompt', async ($, on) => {
  const placed: string[] = []
  const servers: Server[] = []
  const prompts: string[] = []
  const folders = tratos()
  folders[WEB]!.output = [
    '- Local:         http://localhost:4000\n',
    '⚠ The "middleware" file convention is deprecated.\n',
    'Found 0 errors.\n',
    'TypeError: Cannot read properties of undefined (reading \'id\')\n    at Page (app/tratos/page.tsx:12:7)\n',
    '    at render (node_modules/next/dist/server.js:3:1)\n',
    '✓ Compiled in 300ms\n'
  ]
  engine(on, folders, servers, placed)
  on('prompt.fill', (_, e) => {
    prompts.push(e.text)
    return { isFilled: true }
  })
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'p:tratos-web' })
  await ui.press({ key: 'start' })
  expect(await ui.find({ type: 'Text', text: /1 error$/ })).toBeDefined()
  await ui.press({ key: 'error' })
  expect(prompts[0]).toMatch(/TypeError: Cannot read properties of undefined/)
  expect(prompts[0]).toMatch(/at Page \(app\/tratos\/page\.tsx:12:7\)/)
  expect(prompts[0]).toMatch(/at render/)
  expect(prompts[0]).not.toMatch(/Compiled|deprecated/)

  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect((await footer.find({ key: 'dev' }))?.text).toBe('● dev 1/2 ✕')
  await footer.unmount()
  await ui.press({ key: 'stop' })
  await ui.unmount()
})

test('a server that exits on its own shows how it ended', async ($, on) => {
  const placed: string[] = []
  const folders = tratos()
  folders[WEB]!.output = ['Error: Cannot find module \'next\'\n']
  folders[WEB]!.exitCode = 1
  engine(on, folders, [], placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'p:tratos-web' })
  await ui.press({ key: 'start' })
  expect(await ui.find({ type: 'Text', text: /✕ terminó \(1\)/ })).toBeDefined()
  expect(await ui.find({ key: 'start' })).toBeDefined()
  await ui.unmount()
})

test('"open in Chrome" opens the URL and tells Claude; under auto mode it drafts the request in the prompt', async ($, on) => {
  const placed: string[] = []
  const prompts: string[] = []
  let isAutoMode = false
  engine(on, tratos(), [], placed)
  on('mcp.call', (_, e) => isAutoMode
    ? { deny: `$.mcp.call(${e.server}, ${e.tool}) refused: The server-side auto mode classifier gave no verdict` }
    : { value: { content: [{ type: 'text', text: 'Navigated' }], isError: false } })
  on('prompt.fill', (_, e) => {
    prompts.push(e.text)
    return { isFilled: true }
  })
  const session = mock.session(on)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))
  await ui.press({ key: 'p:tratos-web' })
  await ui.press({ key: 'start' })

  await ui.press({ key: 'open' })
  expect(await ui.find({ type: 'Text', text: /✓ Abierta en Chrome: http:\/\/localhost:4000/ })).toBeDefined()
  expect(JSON.stringify(session.appended().at(-1)?.message.content)).toMatch(/tratos-web corre en http:\/\/localhost:4000/)

  isAutoMode = true
  await ui.press({ key: 'open' })
  expect(prompts.at(-1)).toMatch(/^Abre http:\/\/localhost:4000 en Chrome con Claude in Chrome/)
  expect(await ui.find({ type: 'Text', text: /El modo automático no deja que el mod abra Chrome: te dejé el pedido en el prompt/ })).toBeDefined()
  await ui.press({ key: 'stop' })
  await ui.unmount()
})

test('Claude can list, start and stop the servers with its tool', async ($, on) => {
  const servers: Server[] = []
  const clock = engine(on, tratos(), servers)
  await $.session.start(SESSION)
  const text = (answer: unknown) => String((answer as { result?: unknown }).result)
  // The tool waits for the URL on the clock: move it on until the call answers.
  const settled = async (call: Promise<unknown>) => {
    let answer: unknown
    let isDone = false
    void call.then(value => { answer = value; isDone = true })
    for (let i = 0; i < 100 && !isDone; i++) await clock.advance(250)
    return answer
  }

  const listed = text(await $.tool.call({ tool: 'mcp__dev-servers__dev', action: 'status' }))
  expect(listed).toMatch(/tratos-api \(tsx watch src\/index\.ts\): ○ detenido/)
  expect(listed).toMatch(/tratos-web \(next dev -p 4000\): ○ detenido/)

  const unnamed = text(await $.tool.call({ tool: 'mcp__dev-servers__dev', action: 'start' }))
  expect(unnamed).toMatch(/Di cuál proyecto/)
  expect(servers.length).toBe(0)

  const started = text(await settled($.tool.call({ tool: 'mcp__dev-servers__dev', action: 'start', project: 'tratos-web' })))
  expect(started).toMatch(/tratos-web \(next dev -p 4000\): ● http:\/\/localhost:4000/)

  const stopped = text(await $.tool.call({ tool: 'mcp__dev-servers__dev', action: 'stop', project: 'tratos-web' }))
  expect(stopped).toMatch(/tratos-web detenido/)
  // The status line of that same answer already says it stopped, not the state from before.
  expect(stopped).toMatch(/tratos-web \(next dev -p 4000\): ○ detenido/)
  expect(servers[0]!.isClosed).toBe(true)
})
