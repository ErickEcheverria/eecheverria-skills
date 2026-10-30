import { atom, read, update } from 'claude-code'
import type { EngineInterface, FsEntry, Register, RenderNode } from 'claude-code'

import type { Branch, Message, Notice, Repo, Segment, Tracking } from '../types'

// Whether the session's folder holds a project: the footer shows its button only then.
const hasRepos = atom({ plugin: 'git-branches', key: 'hasRepos' } as const, false)
// What each message placed in the transcript shows, by the row's id. Change the tag when Message's
// fields change: it declines what an earlier version stored.
const messages = atom({ plugin: 'git-branches', key: 'messages' } as const, {}, { shape: 'messages-3' })

const SEP = '\x1f'
const REF_FORMAT = [
  '%(HEAD)',
  '%(refname)',
  '%(refname:short)',
  '%(refname:lstrip=3)',
  '%(upstream:short)',
  '%(upstream:track,nobracket)',
  '%(upstream:remotename)',
  '%(upstream:remoteref)',
  '%(committerdate:unix)',
  '%(symref)',
  '%(contents:subject)'
].join('%1f')
const GIT_TIMEOUT_MS = 10000
// A pull talks to the remote: it may wait on the network or on a credential window.
const NETWORK_TIMEOUT_MS = 120000
// Folders never looked into for a project: dependencies and build output.
const SKIPPED = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', 'target', 'bin', 'obj'])
const SEPARATOR = ' · '
// Below this many columns the footer button is the glyph alone.
const NARROW_COLUMNS = 100
// Messages kept: an older one's row draws nothing once its entry is dropped.
const MESSAGES_KEPT = 30
const REMOTES_SHOWN = 30
// Where a listed branch's row starts, under the "all branches" row, and where its actions start.
const BRANCH_INDENT = '    '
const ACTION_INDENT = 8

type Action = 'switch' | 'pull'

// Tells apart two messages placed within the same millisecond.
let placed = 0

/** Runs git in `cwd`: whether it succeeded, what it printed, and the line that says why when it did not. */
async function run ($: EngineInterface, cwd: string, args: string[], timeoutMs = GIT_TIMEOUT_MS) {
  try {
    const { exitCode, stdout, stderr } = await $.process.run(['git', '--no-optional-locks', ...args], {
      cwd,
      timeoutMs,
      env: { GIT_TERMINAL_PROMPT: '0' } // fail rather than wait on a terminal prompt nobody sees
    })
    return { isOk: exitCode === 0, stdout, error: reasonOf(stderr) }
  } catch (error) {
    return { isOk: false, stdout: '', error: error instanceof Error ? error.message : String(error) }
  }
}

/** git's output, or undefined when it failed or could not start. */
async function git ($: EngineInterface, cwd: string, args: string[]) {
  const ran = await run($, cwd, args)
  return ran.isOk ? ran.stdout : undefined
}

/** The line of git's errors that says why: its first `error:` or `fatal:`, else its first line. */
function reasonOf (stderr: string) {
  const lines = linesOf(stderr).map(line => line.trim())
  const reason = lines.find(line => /^(error|fatal):/.test(line)) ?? lines[0] ?? 'git falló sin decir por qué'
  return reason.replace(/^(error|fatal):\s*/, '')
}

const linesOf = (out: string | undefined) => (out ?? '').split(/\r?\n/).filter(Boolean)

const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path

/** "ahora", "5m", "3h", "2d", "4sem", "5mes", "2a": how long ago. */
function ageOf (ms: number) {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d`
  if (days < 60) return `${Math.floor(days / 7)}sem`
  if (days < 365) return `${Math.floor(days / 30)}mes`
  return `${Math.floor(days / 365)}a`
}

/** Ahead and behind from git's track text: "ahead 3, behind 2", "gone" or empty. */
function trackOf (track: string) {
  const count = (word: string) => Number(new RegExp(`${word} (\\d+)`).exec(track)?.[1] ?? 0)
  return { ahead: count('ahead'), behind: count('behind'), isGone: track === 'gone' }
}

/** The repository the folder is in, then each folder right under it that holds its own: one level, never deeper. */
async function reposIn ($: EngineInterface, root: string) {
  const [top, entries] = await Promise.all([
    git($, root, ['rev-parse', '--show-toplevel']),
    $.fs.list(root).catch((): FsEntry[] => [])
  ])
  const folders = entries
    .filter(entry => entry.kind === 'dir' && !entry.name.startsWith('.') && !SKIPPED.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
  const nested = await Promise.all(folders.map(async ({ name }) => {
    const path = `${root}/${name}`
    return (await $.fs.exists(`${path}/.git`).catch(() => false)) ? [{ name, path }] : []
  }))
  const topPath = top?.trim()
  return [...(topPath ? [{ name: baseName(topPath), path: topPath }] : []), ...nested.flat()]
}

/** A project's checked-out branch, its upstream and its uncommitted changes, from one `git status`. */
async function repoOf ($: EngineInterface, name: string, path: string): Promise<Repo | undefined> {
  const status = await git($, path, ['status', '--porcelain=v1', '--branch'])
  if (status === undefined) return undefined
  const [first = '', ...changes] = linesOf(status)
  // "## main...origin/main [ahead 1, behind 2]", "## main", "## HEAD (no branch)", "## No commits yet on main"
  const line = first.replace(/^## /, '')
  const base = { name, path, upstream: '', ahead: 0, behind: 0, isGone: false, isDetached: false, changes: changes.length }
  const unborn = /^(?:No commits yet|Initial commit) on (.+)$/.exec(line)
  if (unborn) return { ...base, head: unborn[1] ?? line }
  if (line.startsWith('HEAD (no branch)')) {
    const sha = (await git($, path, ['rev-parse', '--short', 'HEAD']))?.trim() ?? ''
    return { ...base, head: `HEAD ${sha}`, isDetached: true }
  }
  const [, head = line, upstream = '', track = ''] = /^(.+?)(?:\.\.\.(\S+))?(?: \[(.+)\])?$/.exec(line) ?? []
  return { ...base, head, upstream, ...trackOf(track) }
}

/** A project's branches, local and remote, newest tip first; a symbolic ref (origin/HEAD) left out. */
async function branchesOf ($: EngineInterface, path: string): Promise<Branch[]> {
  const [refs, now] = await Promise.all([
    git($, path, ['for-each-ref', '--sort=-committerdate', `--format=${REF_FORMAT}`, 'refs/heads', 'refs/remotes']),
    $.clock.now()
  ])
  return linesOf(refs).flatMap(line => {
    const [head, ref = '', name = '', stripped = '', upstream = '', track = '', remote = '', remoteRef = '', date = '', symref, subject = ''] = line.split(SEP)
    if (!ref || symref) return []
    const isRemote = ref.startsWith('refs/remotes/')
    return [{
      name,
      localName: isRemote ? stripped : name,
      remote,
      remoteRef,
      isCurrent: head === '*',
      isRemote,
      upstream,
      ...trackOf(track),
      age: ageOf(now - Number(date) * 1000),
      subject
    }]
  })
}

/** The session's folder and where each of its projects stands now. */
async function messageOf ($: EngineInterface): Promise<Message> {
  const root = await $.session.root()
  const found = await reposIn($, root)
  const repos = (await Promise.all(found.map(({ name, path }) => repoOf($, name, path))))
    .filter((repo): repo is Repo => repo !== undefined)
  return { root, repos, selected: repos[0]?.path ?? '', isExpanded: false, branches: {}, branch: '', isBusy: false, notice: null }
}

/** Reads where each project stands and places it as a message at the transcript's end. */
async function post ($: EngineInterface) {
  const message = await messageOf($)
  const id = `branches-${await $.clock.now()}-${placed++}`
  await update($, hasRepos, () => message.repos.length > 0)
  await update($, messages, all => Object.fromEntries([...Object.entries(all), [id, message]].slice(-MESSAGES_KEPT)))
  return $.ui.place({ id })
}

/** The message `id` with `fn`'s change applied to what it holds now; the map as it is where the message is gone. */
async function change ($: EngineInterface, id: string, fn: (message: Message) => Partial<Message>) {
  await update($, messages, all => {
    const message = all[id]
    return message ? { ...all, [id]: { ...message, ...fn(message) } } : all
  })
}

/** `path`'s branches, read once per message: what the message lists afterwards stays as it was read. */
async function loaded ($: EngineInterface, id: string, path: string) {
  const message = (await read($, messages))[id]
  if (!message || message.branches[path]) return {}
  return { [path]: await branchesOf($, path) }
}

/** Makes `path` the message's project, reading its branches first when the list is open. */
async function select ($: EngineInterface, id: string, path: string) {
  const isExpanded = (await read($, messages))[id]?.isExpanded ?? false
  const fresh = isExpanded ? await loaded($, id, path) : {}
  await change($, id, message => ({ selected: path, branch: '', notice: null, branches: { ...message.branches, ...fresh } }))
}

/** Opens or closes the message's list of all the selected project's branches. */
async function toggleAll ($: EngineInterface, id: string) {
  const message = (await read($, messages))[id]
  if (!message) return
  const fresh = message.isExpanded ? {} : await loaded($, id, message.selected)
  await change($, id, now => ({ isExpanded: !now.isExpanded, branch: '', notice: null, branches: { ...now.branches, ...fresh } }))
}

/** Shows `name`'s actions under it, or hides them when they already show. */
async function pick ($: EngineInterface, id: string, name: string) {
  await change($, id, now => ({ branch: now.branch === name ? '' : name, notice: null }))
}

/** Leaves the model a note of what the person did from a message, so it does not go on with a stale picture. */
async function tell ($: EngineInterface, text: string) {
  await $.session.append({ message: { type: 'user', content: [{ type: 'text', text: `[git-branches] ${text}` }] } })
    .catch(() => {})
}

/** `repo` read again, or why `refused` happened: it could not be read, or it has uncommitted changes. */
async function clean ($: EngineInterface, repo: Repo, refused: string): Promise<Repo | Notice> {
  const now = await repoOf($, repo.name, repo.path)
  if (!now) return { text: `No se pudo leer el estado de ${repo.name}.`, isError: true }
  if (now.changes > 0) {
    return { text: `${refused}: ${repo.name} tiene ${changesText(now.changes)} sin commitear. Haz commit o stash primero.`, isError: true }
  }
  return now
}

/** Switches `repo` to `branch`, only with nothing uncommitted: a remote branch is checked out as a local one tracking it. */
async function switchTo ($: EngineInterface, repo: Repo, branch: Branch, known: Branch[]): Promise<Notice> {
  const now = await clean($, repo, 'No se cambió de rama')
  if ('text' in now) return now
  const local = branch.localName
  const hasLocal = known.some(one => !one.isRemote && one.name === local)
  const ran = await run($, repo.path, hasLocal ? ['switch', local] : ['switch', '-c', local, '--track', branch.name])
  if (!ran.isOk) return { text: `No se pudo cambiar a ${local}: ${ran.error}`, isError: true }
  await tell($, `El usuario cambió ${repo.name} (${repo.path}) de la rama ${now.head} a ${local}: los archivos de ese proyecto son ahora los de ${local}.`)
  return { text: `${repo.name} ahora está en ${local}.`, isError: false }
}

/**
 * Brings `branch` up to its upstream, only with nothing uncommitted and fast-forward only: the checked-out
 * one with a pull, another with a fetch into it.
 */
async function pull ($: EngineInterface, repo: Repo, branch: Branch): Promise<Notice> {
  const now = await clean($, repo, 'No se hizo pull')
  if ('text' in now) return now
  const tip = async () => (await git($, repo.path, ['rev-parse', `refs/heads/${branch.name}`]))?.trim()
  const before = await tip()
  const ran = await run(
    $,
    repo.path,
    branch.isCurrent ? ['pull', '--ff-only'] : ['fetch', branch.remote, `${branch.remoteRef}:refs/heads/${branch.name}`],
    NETWORK_TIMEOUT_MS
  )
  if (!ran.isOk) return { text: `No se pudo hacer pull de ${branch.name}: ${ran.error}`, isError: true }
  if ((await tip()) === before) return { text: `${branch.name} ya estaba al día.`, isError: false }
  if (branch.isCurrent) await tell($, `El usuario hizo pull de ${branch.name} en ${repo.name} (${repo.path}): los archivos de ese proyecto cambiaron.`)
  return { text: `${branch.name} actualizada desde ${branch.upstream}.`, isError: false }
}

/** Runs `action` on the message's picked branch, then reads the project again so the message shows where it stands. */
async function act ($: EngineInterface, id: string, action: Action) {
  const message = (await read($, messages))[id]
  if (!message || message.isBusy) return
  const repo = message.repos.find(one => one.path === message.selected)
  const known = message.branches[message.selected] ?? []
  const branch = known.find(one => one.name === message.branch)
  if (!repo || !branch) return
  await change($, id, () => ({ isBusy: true, notice: null }))
  const notice = await (action === 'switch' ? switchTo($, repo, branch, known) : pull($, repo, branch))
    .catch((error): Notice => ({ text: error instanceof Error ? error.message : String(error), isError: true }))
  const [fresh, branches] = await Promise.all([repoOf($, repo.name, repo.path), branchesOf($, repo.path)])
  await change($, id, now => ({
    isBusy: false,
    notice,
    repos: now.repos.map(one => (one.path === repo.path && fresh ? fresh : one)),
    branches: { ...now.branches, [repo.path]: branches }
  }))
}

/** "↑1 ↓2", "✕ gone", "✓" in step with its upstream, empty with none. */
function trackText (tracking: Tracking) {
  if (tracking.isGone) return '✕ gone'
  const moved = [tracking.ahead ? `↑${tracking.ahead}` : '', tracking.behind ? `↓${tracking.behind}` : ''].filter(Boolean)
  if (moved.length > 0) return moved.join(' ')
  return tracking.upstream ? '✓' : ''
}

const trackColor = (tracking: Tracking) => (tracking.isGone ? 'error' : tracking.ahead || tracking.behind ? 'warning' : 'subtle')

const changesText = (changes: number) => (changes === 0 ? 'limpio' : `${changes} ${changes === 1 ? 'cambio' : 'cambios'}`)

const widthOf = (text: string) => [...text].length

const longest = (texts: string[]) => texts.reduce((most, text) => Math.max(most, widthOf(text)), 0)

/** `text` cut or padded to `width` columns. */
function pad (text: string, width: number) {
  const chars = [...text]
  if (chars.length > width) return chars.slice(0, Math.max(0, width - 1)).join('') + '…'
  return text + ' '.repeat(width - chars.length)
}

/** The runs that fit in `columns`, the last one cut with an ellipsis: one row, never wrapped. */
function fit (segments: Segment[], columns: number): Segment[] {
  let room = columns
  const fitted: Segment[] = []
  for (const segment of segments) {
    if (room <= 0) break
    const width = widthOf(segment.text)
    if (width <= room) {
      fitted.push(segment)
      room -= width
      continue
    }
    fitted.push({ ...segment, text: pad(segment.text, room) })
    room = 0
  }
  return fitted
}

/** A project's row: its marker, its folder, its branch, where it stands against its upstream, and its changes. */
function repoRowOf (repo: Repo, marker: Segment, widths: { name: number; head: number }): Segment[] {
  const track = trackText(repo)
  return [
    marker,
    { text: pad(repo.name, widths.name) + '  ' },
    { text: pad(repo.head, widths.head), color: repo.isDetached ? 'warning' : 'success', isBold: true },
    ...(track ? [{ text: '  ' + track, color: trackColor(repo) }] : []),
    { text: (track ? SEPARATOR : '  ') + changesText(repo.changes), ...(repo.changes > 0 ? { color: 'warning' } : { isDim: true }) }
  ]
}

/** A listed branch's row: marker (▸ picked, ● checked out), name, ahead/behind, age, and its tip's subject. */
function branchRowOf (branch: Branch, isPicked: boolean, widths: { name: number; track: number; age: number }): Segment[] {
  const isCurrent = branch.isCurrent && !branch.isRemote
  const marker: Segment = isPicked
    ? { text: BRANCH_INDENT + '▸ ', color: 'claude' }
    : isCurrent ? { text: BRANCH_INDENT + '● ', color: 'success' } : { text: BRANCH_INDENT + '  ' }
  return [
    marker,
    isCurrent ? { text: pad(branch.name, widths.name), color: 'success', isBold: true } : { text: pad(branch.name, widths.name), isBold: isPicked },
    ...(widths.track > 0 ? [{ text: ' ' + pad(trackText(branch), widths.track), color: trackColor(branch) }] : []),
    { text: ' ' + branch.age.padStart(widths.age), isDim: true },
    { text: '  ' + branch.subject, isDim: true }
  ]
}

/** Whether a drawing beneath shows nothing: no text, no control (the engine's own node draws `modes`, counted apart). */
function isBlank (node: RenderNode | undefined): boolean {
  if (node === undefined || node === null) return true
  if (typeof node === 'string') return node.trim() === ''
  if (node.type === 'engine') return true
  return (node.type === 'Box' || node.type === 'Text') && (node.children ?? []).every(isBlank)
}

export const register: Register = on => {
  placed = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'branches',
      description: 'Muestra en qué rama está cada proyecto git de la carpeta'
    })
    const found = await reposIn($, await $.session.root())
    await update($, hasRepos, () => found.length > 0)
    return next(e)
  })

  on('command.run', { command: 'branches' }, async $ => {
    const posted = await post($)
    return posted.isPlaced ? {} : { text: `No se pudieron mostrar las ramas: ${posted.reason}` }
  })

  // The footer, beside the permission mode: what is beneath (the engine's labels, another plugin's meter
  // or switch), then the button that posts the message. None where the folder holds no project.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const [isShown, beneath] = await Promise.all([read($, hasRepos), next(e)])
    if (!isShown) return beneath
    const { Box, Button, Text } = $.ui.resolve(e)
    const hasBeneath = e.props.modes.length > 0 || !isBlank(beneath)
    const isNarrow = e.surface === 'terminal' && (e.viewport?.columns ?? Infinity) < NARROW_COLUMNS

    return (
      <Box flexDirection="row">
        {hasBeneath ? beneath : null}
        {hasBeneath ? <Text dimColor>{SEPARATOR}</Text> : null}
        <Button key="branches" plain onPress={() => void post($).catch(() => {})}>
          <Text color="claude">{isNarrow ? '⎇' : '⎇ branches'}</Text>
        </Button>
      </Box>
    )
  })

  // A message: the folder, each project with the branch it is on (a press selects it), and the
  // "all branches" row that lists every branch of the selected one; a press on a listed branch
  // shows what can be done with it.
  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== 'git-branches') return next(e)
    const id = e.props.id
    const message = (await read($, messages))[id]
    if (!message) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const columns = Math.max(20, (e.viewport?.columns ?? 80) - 2)
    const texts = (segments: Segment[]) => fit(segments, columns).map(segment => (
      <Text color={segment.color} bold={segment.isBold} dimColor={segment.isDim}>{segment.text}</Text>
    ))
    const line = (segments: Segment[]) => <Box flexDirection="row">{texts(segments)}</Box>
    const folder = baseName(message.root)

    const target = message.repos.find(repo => repo.path === message.selected) ?? message.repos[0]
    if (!target) {
      return line([{ text: '⎇ ', color: 'claude' }, { text: `No hay repositorios git en ${folder} ni en sus subcarpetas.`, isDim: true }])
    }
    const hasChoice = message.repos.length > 1
    const widths = {
      name: Math.min(longest(message.repos.map(repo => repo.name)), Math.max(12, Math.floor(columns * 0.4))),
      head: Math.min(longest(message.repos.map(repo => repo.head)), Math.max(10, Math.floor(columns * 0.3)))
    }
    const marker = (repo: Repo): Segment =>
      !hasChoice ? { text: '  ' } : repo.path === target.path ? { text: '● ', color: 'claude' } : { text: '○ ', isDim: true }

    const listed = message.isExpanded ? message.branches[target.path] ?? [] : []
    const locals = listed.filter(branch => !branch.isRemote)
    const remotes = listed.filter(branch => branch.isRemote)
    const shownBranches = [...locals, ...remotes.slice(0, REMOTES_SHOWN)]
    const branchWidths = {
      name: Math.min(longest(shownBranches.map(branch => branch.name)), Math.max(12, Math.floor(columns * 0.4))),
      track: longest(shownBranches.map(trackText)),
      age: longest(shownBranches.map(branch => branch.age))
    }
    const heading = (text: string) => line([{ text: BRANCH_INDENT + text, isDim: true }])
    const action = (key: Action, glyph: string, label: string, hint: string) => (
      <Button key={key} plain onPress={() => void act($, id, key).catch(() => {})}>
        {texts([
          { text: ' '.repeat(ACTION_INDENT) + glyph + ' ', color: 'claude' },
          { text: label, color: 'claude' },
          ...(hint ? [{ text: SEPARATOR + hint, isDim: true }] : [])
        ])}
      </Button>
    )

    // What can be done with a listed branch: switch to it (not to the one checked out), and pull a local one with an
    // upstream; both only while the project has nothing uncommitted.
    const actions = (branch: Branch) => {
      const canSwitch = target.isDetached || branch.localName !== target.head
      const canPull = !branch.isRemote && branch.remote !== ''
      const needsClean = target.changes > 0 ? 'requiere el proyecto sin cambios' : ''
      return (
        <Box flexDirection="column">
          {message.isBusy && line([{ text: ' '.repeat(ACTION_INDENT) + '… trabajando', isDim: true }])}
          {!message.isBusy && canSwitch && action('switch', '⇄', 'cambiar a esta rama', needsClean)}
          {!message.isBusy && canPull && action('pull', '↓', 'pull', needsClean || 'solo avance rápido')}
          {!message.isBusy && !canSwitch && !canPull &&
            line([{ text: ' '.repeat(ACTION_INDENT) + 'Es la rama actual y no tiene upstream.', isDim: true }])}
          {message.notice && (
            <Box paddingLeft={ACTION_INDENT}>
              <Text color={message.notice.isError ? 'error' : 'success'}>
                {(message.notice.isError ? '✕ ' : '✓ ') + message.notice.text}
              </Text>
            </Box>
          )}
        </Box>
      )
    }
    const branchRow = (branch: Branch) => {
      const isPicked = branch.name === message.branch
      return (
        <Box flexDirection="column">
          <Button key={`branch:${branch.name}`} plain onPress={() => void pick($, id, branch.name).catch(() => {})}>
            {texts(branchRowOf(branch, isPicked, branchWidths))}
          </Button>
          {isPicked && actions(branch)}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {line([{ text: '⎇ ', color: 'claude' }, { text: 'Ramas actuales', isBold: true }, { text: SEPARATOR + folder, isDim: true }])}
        {message.repos.map((repo, i) =>
          hasChoice
            ? (
              <Button key={`repo-${i}`} plain onPress={() => void select($, id, repo.path).catch(() => {})}>
                {texts(repoRowOf(repo, marker(repo), widths))}
              </Button>
              )
            : line(repoRowOf(repo, marker(repo), widths))
        )}
        <Button key="all" plain onPress={() => void toggleAll($, id).catch(() => {})}>
          {texts([
            { text: '  ' + (message.isExpanded ? '▾ ' : '▸ '), color: 'claude' },
            { text: 'all branches', color: 'claude' },
            ...(hasChoice ? [{ text: SEPARATOR + target.name, isDim: true }] : [])
          ])}
        </Button>
        {message.isExpanded && listed.length === 0 && heading('Sin ramas.')}
        {locals.length > 0 && heading(`Locales (${locals.length})`)}
        {locals.map(branchRow)}
        {remotes.length > 0 && heading(`Remotas (${remotes.length})`)}
        {remotes.slice(0, REMOTES_SHOWN).map(branchRow)}
        {remotes.length > REMOTES_SHOWN && heading(`  … ${remotes.length - REMOTES_SHOWN} más`)}
      </Box>
    )
  })
}
