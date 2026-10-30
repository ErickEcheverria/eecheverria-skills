import { expect, mock, test } from 'claude-code/testing'
import type { FsEntry, On } from 'claude-code'

const FOOTER = {
  plugin: 'git-branches',
  component: 'SessionMode',
  requestId: 'footer',
  props: { modes: [] }
} as const

// The person typed `/branches` in a wide fullscreen terminal.
const RUN = {
  command: 'branches',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 160 }
} as const

const SESSION = { cwd: 'C:/proyectos/tienda', surface: 'terminal', isInteractive: true } as const

const ROOT = 'C:/proyectos/tienda'
const SERVICE = `${ROOT}/tienda-api`
const WEB = `${ROOT}/tienda-web`

const NOW = Date.parse('2026-10-30T12:00:00Z')
const HOURS_AGO = (hours: number) => String(Math.floor((NOW - hours * 3600000) / 1000))
const ref = (...fields: string[]) => fields.join('\x1f')
// A for-each-ref line of a local branch tracking origin, and of a remote one.
const local = (isCurrent: boolean, name: string, track: string, hours: number, subject: string) =>
  ref(isCurrent ? '*' : ' ', `refs/heads/${name}`, name, '', `origin/${name}`, track, 'origin', `refs/heads/${name}`, HOURS_AGO(hours), '', subject)
const remote = (name: string, hours: number, subject: string, symref = '') =>
  ref(' ', `refs/remotes/origin/${name}`, `origin/${name}`, name, '', '', '', '', HOURS_AGO(hours), symref, subject)

type Answer = { exitCode: number; stdout?: string; stderr?: string }
// What git answers in a folder, by the start of its subcommand line, what the folder lists, and how
// it answers a command that changes it (`act`, asked first).
type Folder = { git: Record<string, string>; entries?: string[]; act?: (args: string) => Answer | undefined }

/** The shop: no repository itself, a clean backend and a frontend with changes right under it, and folders that are no project. */
function shop (): Record<string, Folder> {
  return {
    [ROOT]: { git: {}, entries: ['tienda-api', 'tienda-web', 'docs', 'node_modules', '.vscode'] },
    [SERVICE]: {
      git: {
        'status --porcelain=v1 --branch': '## PROJ-42...origin/PROJ-42\n',
        'for-each-ref': [
          local(true, 'PROJ-42', '', 2, 'Validación de pagos'),
          local(false, 'release/1.4', 'behind 4', 30, 'Merge de sprint'),
          remote('PROJ-42', 2, 'Validación de pagos'),
          remote('hotfix', 40, 'Corrige el login')
        ].join('\n') + '\n'
      }
    },
    [WEB]: {
      git: {
        'status --porcelain=v1 --branch': '## develop...origin/develop [ahead 1]\n M src/App.tsx\n?? notas.md\n',
        'for-each-ref': [
          local(true, 'develop', 'ahead 1', 1, 'Pantalla de login'),
          local(false, 'feature/carrito', 'gone', 50, 'Carrito nuevo'),
          remote('HEAD', 3, 'x', 'refs/remotes/origin/develop'),
          remote('develop', 3, 'Versión 1.2')
        ].join('\n') + '\n'
      }
    },
    [`${ROOT}/docs`]: { git: {} }
  }
}

/** Stands for git, the folder and the engine beneath the plugin; what it places lands in `placed`, each git line it runs in `ran`. */
function engine (on: On, folders: Record<string, Folder>, placed: string[] = [], ran: string[] = []) {
  on('process.run', (_, e) => {
    const folder = folders[e.init?.cwd ?? '']
    const args = e.argv.slice(2).join(' ') // after `git --no-optional-locks`
    ran.push(args)
    const key = Object.keys(folder?.git ?? {}).find(prefix => args.startsWith(prefix))
    const answer = folder?.act?.(args) ?? (key ? { exitCode: 0, stdout: folder?.git[key] } : { exitCode: 128 })
    return { value: { exitCode: answer.exitCode, stdout: answer.stdout ?? '', stderr: answer.stderr ?? '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  // The engine hands fs paths on in the platform's spelling: backslashes on Windows.
  const slashed = (path: string) => path.replace(/\\/g, '/')
  on('fs.list', (_, e) => ({
    value: (folders[slashed(e.path)]?.entries ?? []).map((name): FsEntry => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false }))
  }))
  on('fs.exists', (_, e) => {
    const path = slashed(e.path)
    const folder = folders[path.replace(/\/\.git$/, '')]
    return { value: path.endsWith('/.git') && folder !== undefined && Object.keys(folder.git).length > 0 }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: ROOT }))
  on('clock.now', () => ({ value: NOW }))
  on('command.register', () => ({ value: { command: 'branches' } }))
  on('ui.place', (_, e) => {
    placed.push(e.id)
    return { value: { isPlaced: true, requestId: e.id } }
  })
  // The engine's own footer: the permission mode's label.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>auto mode on</Text>
  })
}

/** The message row the plugin placed under `id`, as the transcript draws it. */
const message = (id: string, surface: 'terminal' | 'desktop' | 'vscode' | 'mobile' = 'terminal') => ({
  plugin: 'git-branches',
  component: 'Placed',
  requestId: id,
  surface,
  props: { id, plugin: 'git-branches' }
} as const)

test('the footer button posts each project with its branch, on every surface', async ($, on) => {
  const placed: string[] = []
  engine(on, shop(), placed)
  await $.session.start(SESSION)
  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })

  expect((await footer.find({ key: 'branches' }))?.text).toBe('⎇ branches')
  await footer.press({ key: 'branches' })
  await footer.unmount()
  expect(placed.length).toBe(1)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount(message(placed[0]!, surface))
    expect(await ui.find({ type: 'Text', text: /Ramas actuales/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /tienda-api/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /tienda-web/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^PROJ-42/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^develop/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /↑1/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /2 cambios/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /docs|node_modules|vscode/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('"all branches" lists every branch of the selected project, and closes again', async ($, on) => {
  const placed: string[] = []
  engine(on, shop(), placed)
  await $.command.run(RUN)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount(message(placed[0]!, surface))
    expect(await ui.find({ type: 'Text', text: /release\/1\.4/ })).toBeUndefined()
    await ui.press({ key: 'all' })
    expect(await ui.find({ type: 'Text', text: /Locales \(2\)/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Remotas \(2\)/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /release\/1\.4/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /↓4/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Carrito nuevo/ })).toBeUndefined()
    await ui.press({ key: 'all' })
    expect(await ui.find({ type: 'Text', text: /release\/1\.4/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('pressing another project while the list is open lists its branches', async ($, on) => {
  const placed: string[] = []
  engine(on, shop(), placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'all' })
  await ui.press({ key: 'repo-1' })
  expect((await ui.find({ key: 'all' }))?.text).toMatch(/all branches · tienda-web/)
  expect(await ui.find({ type: 'Text', text: /✕ gone/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Remotas \(1\)/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /release\/1\.4/ })).toBeUndefined()
  await ui.unmount()
})

test('a branch shows what can be done with it: the checked-out one only pulls, a remote one only switches', async ($, on) => {
  const placed: string[] = []
  engine(on, shop(), placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))
  await ui.press({ key: 'all' })

  await ui.press({ key: 'branch:release/1.4' })
  expect((await ui.find({ key: 'switch' }))?.text).toMatch(/cambiar a esta rama/)
  expect((await ui.find({ key: 'pull' }))?.text).toMatch(/pull/)

  await ui.press({ key: 'branch:PROJ-42' })
  expect(await ui.find({ key: 'switch' })).toBeUndefined()
  expect(await ui.find({ key: 'pull' })).toBeDefined()

  await ui.press({ key: 'branch:origin/hotfix' })
  expect(await ui.find({ key: 'switch' })).toBeDefined()
  expect(await ui.find({ key: 'pull' })).toBeUndefined()

  // A second press on the picked branch hides its actions.
  await ui.press({ key: 'branch:origin/hotfix' })
  expect(await ui.find({ key: 'switch' })).toBeUndefined()
  await ui.unmount()
})

test('switching a clean project checks the branch out, shows it, and tells Claude', async ($, on) => {
  const placed: string[] = []
  const ran: string[] = []
  const folders = shop()
  folders[SERVICE]!.act = args => {
    if (args !== 'switch release/1.4') return undefined
    folders[SERVICE]!.git['status --porcelain=v1 --branch'] = '## release/1.4...origin/release/1.4 [behind 4]\n'
    return { exitCode: 0 }
  }
  engine(on, folders, placed, ran)
  const session = mock.session(on)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'all' })
  await ui.press({ key: 'branch:release/1.4' })
  await ui.press({ key: 'switch' })
  expect(ran).toContain('switch release/1.4')
  expect(await ui.find({ type: 'Text', text: /✓ tienda-api ahora está en release\/1\.4/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^release\/1\.4\s*$/ })).toBeDefined() // the project's row
  const note = JSON.stringify(session.appended().at(-1)?.message.content)
  expect(note).toMatch(/de la rama PROJ-42 a release\/1\.4/)
  await ui.unmount()
})

test('a project with uncommitted changes is not switched', async ($, on) => {
  const placed: string[] = []
  const ran: string[] = []
  engine(on, shop(), placed, ran)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'repo-1' })
  await ui.press({ key: 'all' })
  await ui.press({ key: 'branch:feature/carrito' })
  expect((await ui.find({ key: 'switch' }))?.text).toMatch(/requiere el proyecto sin cambios/)
  await ui.press({ key: 'switch' })
  expect(ran.some(args => args.startsWith('switch'))).toBe(false)
  expect(await ui.find({ type: 'Text', text: /✕ No se cambió de rama: tienda-web tiene 2 cambios sin commitear/ })).toBeDefined()
  await ui.unmount()
})

test('a project with uncommitted changes is not pulled', async ($, on) => {
  const placed: string[] = []
  const ran: string[] = []
  engine(on, shop(), placed, ran)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'repo-1' })
  await ui.press({ key: 'all' })
  await ui.press({ key: 'branch:develop' })
  expect((await ui.find({ key: 'pull' }))?.text).toMatch(/requiere el proyecto sin cambios/)
  await ui.press({ key: 'pull' })
  expect(ran.some(args => args.startsWith('pull') || args.startsWith('fetch'))).toBe(false)
  expect(await ui.find({ type: 'Text', text: /✕ No se hizo pull: tienda-web tiene 2 cambios sin commitear/ })).toBeDefined()
  await ui.unmount()
})

test('a remote branch is checked out as a local one tracking it', async ($, on) => {
  const placed: string[] = []
  const ran: string[] = []
  const folders = shop()
  folders[SERVICE]!.act = args => (args.startsWith('switch') ? { exitCode: 0 } : undefined)
  engine(on, folders, placed, ran)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  await ui.press({ key: 'all' })
  await ui.press({ key: 'branch:origin/hotfix' })
  await ui.press({ key: 'switch' })
  expect(ran).toContain('switch -c hotfix --track origin/hotfix')
  await ui.unmount()
})

test('pull: the checked-out branch with pull --ff-only, another with a fetch into it, a failure saying why', async ($, on) => {
  const placed: string[] = []
  const ran: string[] = []
  const folders = shop()
  const tips: Record<string, string> = { 'PROJ-42': 'aaa', 'release/1.4': 'bbb' }
  let pullAnswer: Answer = { exitCode: 0 }
  folders[SERVICE]!.act = args => {
    const tip = /^rev-parse refs\/heads\/(.+)$/.exec(args)?.[1]
    if (tip) return { exitCode: 0, stdout: `${tips[tip]}\n` }
    if (args === 'pull --ff-only') {
      if (pullAnswer.exitCode === 0) tips['PROJ-42'] = 'ccc'
      return pullAnswer
    }
    if (args.startsWith('fetch')) return { exitCode: 0 }
    return undefined
  }
  engine(on, folders, placed, ran)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))
  await ui.press({ key: 'all' })

  await ui.press({ key: 'branch:PROJ-42' })
  await ui.press({ key: 'pull' })
  expect(ran).toContain('pull --ff-only')
  expect(await ui.find({ type: 'Text', text: /✓ PROJ-42 actualizada desde origin\/PROJ-42/ })).toBeDefined()

  await ui.press({ key: 'branch:release/1.4' })
  await ui.press({ key: 'pull' })
  expect(ran).toContain('fetch origin refs/heads/release/1.4:refs/heads/release/1.4')
  expect(await ui.find({ type: 'Text', text: /✓ release\/1\.4 ya estaba al día/ })).toBeDefined()

  pullAnswer = { exitCode: 128, stderr: 'hint: Diverging branches can\'t be fast-forwarded.\nfatal: Not possible to fast-forward, aborting.\n' }
  await ui.press({ key: 'branch:PROJ-42' })
  await ui.press({ key: 'pull' })
  expect(await ui.find({ type: 'Text', text: /✕ No se pudo hacer pull de PROJ-42: Not possible to fast-forward, aborting\./ })).toBeDefined()
  await ui.unmount()
})

test('/branches posts the message too, and shows no text of its own', async ($, on) => {
  const placed: string[] = []
  engine(on, shop(), placed)
  const ran = await $.command.run(RUN)

  expect(ran.text).toBeUndefined()
  const ui = await $.ui.mount(message(placed[0]!))
  expect(await ui.find({ type: 'Text', text: /^PROJ-42/ })).toBeDefined()
  await ui.unmount()
})

test('each message keeps what it showed when it was posted', async ($, on) => {
  const placed: string[] = []
  const folders = shop()
  engine(on, folders, placed)
  await $.command.run(RUN)
  folders[SERVICE]!.git['status --porcelain=v1 --branch'] = '## develop...origin/develop\n'
  await $.command.run(RUN)

  const first = await $.ui.mount(message(placed[0]!))
  expect(await first.find({ type: 'Text', text: /^PROJ-42/ })).toBeDefined()
  await first.unmount()
  const second = await $.ui.mount(message(placed[1]!))
  expect(await second.find({ type: 'Text', text: /^PROJ-42/ })).toBeUndefined()
  await second.unmount()
})

test('a folder that is a repository itself is its one project', async ($, on) => {
  const placed: string[] = []
  engine(on, { [ROOT]: { git: { 'rev-parse --show-toplevel': `${ROOT}\n`, ...shop()[WEB]!.git } } }, placed)
  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))

  expect(await ui.find({ type: 'Text', text: /tienda/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^develop/ })).toBeDefined()
  // One project: nothing to choose, and its branches list all the same.
  expect(await ui.find({ key: 'repo-0' })).toBeUndefined()
  await ui.press({ key: 'all' })
  expect(await ui.find({ type: 'Text', text: /feature\/carrito/ })).toBeDefined()
  await ui.unmount()
})

test('outside any project the footer has no button and the message says so', async ($, on) => {
  const placed: string[] = []
  engine(on, { [ROOT]: { git: {}, entries: ['docs'] } }, placed)
  await $.session.start(SESSION)

  const footer = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect(await footer.find({ key: 'branches' })).toBeUndefined()
  await footer.unmount()

  await $.command.run(RUN)
  const ui = await $.ui.mount(message(placed[0]!))
  expect(await ui.find({ type: 'Text', text: /No hay repositorios git en tienda/ })).toBeDefined()
  await ui.unmount()
})

test('a row another plugin placed is left to it', async ($, on) => {
  engine(on, shop())
  const ui = await $.ui.mount({ ...message('other'), props: { id: 'other', plugin: 'otro' } })

  expect((await ui.find({ type: 'Text' }))?.text).toBe('auto mode on')
  await ui.unmount()
})
