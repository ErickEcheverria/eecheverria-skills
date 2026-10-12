// Arma la composición HyperFrames del manual: una página tamaño carta (1700x2200, 200 dpi) por segundo.
// Uso: node tools/build.mjs manual.json coords.json  ->  index.html + work/pages.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const [, , manualFile = 'manual.json', coordsFile = 'coords.json'] = process.argv
const manual = JSON.parse(readFileSync(manualFile, 'utf8'))
const coords = JSON.parse(readFileSync(coordsFile, 'utf8'))

const W = 1700
const H = 2200
const MARGIN = 110
const CONTENT_W = W - MARGIN * 2

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const rich = (value) => esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

const contentPages = []
for (const chapter of manual.chapters) {
  chapter.pages.forEach((page, index) => {
    contentPages.push({ kind: 'screen', chapter, page, first: index === 0 })
  })
}

const TOC_CAPACITY = 48
const tocEntries = []
manual.chapters.forEach((chapter, index) => {
  tocEntries.push({ type: 'chapter', chapter, index, units: 2.6 })
  for (const page of chapter.pages) tocEntries.push({ type: 'page', chapter, page, units: 1 })
})
const tocChunks = []
let tocChunk = []
let tocUnits = 0
for (const entry of tocEntries) {
  const capacity = tocChunks.length === 0 ? TOC_CAPACITY - 3 : TOC_CAPACITY
  if (tocUnits + entry.units > capacity && tocChunk.length) {
    tocChunks.push(tocChunk)
    tocChunk = []
    tocUnits = 0
  }
  tocChunk.push(entry)
  tocUnits += entry.units
}
if (tocChunk.length) tocChunks.push(tocChunk)

const ROLE_CAPACITY = 52
const roles = manual.roles ?? []
const roleUnits = (role) => 3 + Math.ceil(role.pages.length / 2) * 1.1
const roleChunks = []
let roleChunk = []
let roleUsed = 0
for (const role of roles) {
  const capacity = roleChunks.length === 0 ? ROLE_CAPACITY - 3 : ROLE_CAPACITY
  if (roleUsed + roleUnits(role) > capacity && roleChunk.length) {
    roleChunks.push(roleChunk)
    roleChunk = []
    roleUsed = 0
  }
  roleChunk.push(role)
  roleUsed += roleUnits(role)
}
if (roleChunk.length) roleChunks.push(roleChunk)

const pages = [{ kind: 'cover' }]
tocChunks.forEach((entries, part) => pages.push({ kind: 'toc', entries, part }))
roleChunks.forEach((list, part) => pages.push({ kind: 'roles', list, part }))
pages.push(...contentPages)

const pageNumber = new Map()
const chapterStart = new Map()
pages.forEach((p, i) => {
  if (p.kind !== 'screen') return
  pageNumber.set(`${p.chapter.id}::${p.page.title}`, i + 1)
  if (p.first) chapterStart.set(p.chapter.id, i + 1)
})
const numberOf = (ref) => {
  const n = pageNumber.get(ref)
  if (!n) throw new Error(`La guía por rol apunta a una página que no existe: ${ref}`)
  return n
}

const PRODUCT = manual.product ?? manual.subtitle ?? ''
const MARK = manual.mark ?? 'assets/brand/mark.svg'
const LOGO = manual.logo ?? MARK
const THEME = { primary: '#2c589a', primarySoft: '#e8eef7', accent: '#cc1f37', ...(manual.theme ?? {}) }

const header = (label) => `
  <div class="pg-header"><span class="pg-brand"><img src="${esc(MARK)}" alt="" />${esc(PRODUCT)} · ${esc(manual.title)}</span><span>${esc(label)}</span></div>`

const footer = (n) => `<div class="pg-footer"><span>${esc(manual.footer ?? '')}</span><span>${n}</span></div>`

const coverHtml = () => `
  <div class="cover-band"></div>
  <div class="cover-body">
    <img class="cover-logo" src="${esc(LOGO)}" alt="${esc(PRODUCT)}" />
    <h1 class="cover-title">${esc(manual.title)}</h1>
    <p class="cover-sub">${esc(manual.subtitle)}</p>
    <div class="cover-meta">
      <div><span>Versión</span><strong>${esc(manual.version)}</strong></div>
      <div><span>Fecha</span><strong>${esc(manual.date)}</strong></div>
      <div><span>Audiencia</span><strong>${esc(manual.audience)}</strong></div>
    </div>
    <p class="cover-note">${rich(manual.coverNote ?? '')}</p>
  </div>
  <div class="cover-foot">${esc(manual.footer ?? '')}</div>`

const tocHtml = ({ entries, part }, n) => {
  const rows = entries
    .map((e) => {
      if (e.type === 'chapter')
        return `<div class="toc-ch" data-target="${chapterStart.get(e.chapter.id)}"><span class="toc-num">${e.index + 1}</span><span class="toc-name">${esc(e.chapter.title)}<small>${esc(e.chapter.summary ?? '')}</small></span><span class="toc-dots"></span><span class="toc-page">${chapterStart.get(e.chapter.id)}</span></div>`
      return `<div class="toc-pg" data-target="${pageNumber.get(`${e.chapter.id}::${e.page.title}`)}"><span>${esc(e.page.title)}</span><span class="toc-dots"></span><span>${pageNumber.get(`${e.chapter.id}::${e.page.title}`)}</span></div>`
    })
    .join('')
  const title = part === 0 ? 'Contenido' : 'Contenido (continuación)'
  const intro = part === 0 ? `<p class="pg-purpose">${rich(manual.tocIntro ?? '')}</p>` : ''
  return `
  ${header('Contenido')}
  <h2 class="pg-title">${title}</h2>
  ${intro}
  <div class="toc2">${rows}</div>
  ${footer(n)}`
}

const rolesHtml = ({ list, part }, n) => {
  const cards = list
    .map(
      (role) => `<div class="role"><div class="role-head"><h3>${esc(role.role)}</h3><p>${rich(role.description ?? '')}</p></div><ul class="role-pages">${role.pages
        .map((ref) => `<li data-target="${numberOf(ref)}"><span>${esc(ref.split('::')[1])}</span><span class="toc-dots"></span><span>${numberOf(ref)}</span></li>`)
        .join('')}</ul></div>`
    )
    .join('')
  const title = part === 0 ? 'Guía por rol' : 'Guía por rol (continuación)'
  const intro = part === 0 ? `<p class="pg-purpose">${rich(manual.rolesIntro ?? '')}</p>` : ''
  return `
  ${header('Guía por rol')}
  <h2 class="pg-title">${title}</h2>
  ${intro}
  <div class="roles">${cards}</div>
  ${footer(n)}`
}

const shotHtml = (page) => {
  if (!page.image) return ''
  const meta = coords[page.image]
  if (!meta) throw new Error(`Falta la captura ${page.image} en coords`)
  const maxH = page.maxImageHeight ?? 1000
  let width = CONTENT_W
  let height = Math.round((meta.height / meta.width) * width)
  if (height > maxH) {
    height = maxH
    width = Math.round((meta.width / meta.height) * height)
  }
  const dots = (meta.markers ?? [])
    .map((m, i) => (m ? `<span class="dot" style="left:${m.x.toFixed(2)}%;top:${m.y.toFixed(2)}%">${i + 1}</span>` : ''))
    .join('')
  return `<div class="shot" style="width:${width}px;height:${height}px"><img src="assets/shots/${esc(page.image)}.png" alt="" />${dots}</div>`
}

const screenHtml = ({ chapter, page, first }, n) => {
  const chapterIndex = manual.chapters.indexOf(chapter) + 1
  const intro = first
    ? `<div class="chapter"><span class="chapter-num">Capítulo ${chapterIndex}</span><h1>${esc(chapter.title)}</h1><p>${rich(chapter.intro ?? '')}</p>${chapter.audience ? `<p class="chapter-who"><strong>Quién lo usa:</strong> ${rich(chapter.audience)}</p>` : ''}</div>`
    : ''
  const steps = (page.steps ?? [])
    .map((s, i) => `<li><span class="num">${i + 1}</span><span>${rich(s)}</span></li>`)
    .join('')
  const twoCols = (page.steps ?? []).length > 6 ? ' two' : ''
  const note = page.note ? `<div class="note"><strong>${esc(page.noteTitle ?? 'Importante')}</strong><span>${rich(page.note)}</span></div>` : ''
  return `
  ${header(`${chapterIndex}. ${chapter.title}`)}
  ${intro}
  <h2 class="pg-title">${esc(page.title)}</h2>
  ${page.purpose ? `<p class="pg-purpose">${rich(page.purpose)}</p>` : ''}
  ${shotHtml(page)}
  ${steps ? `<ol class="steps${twoCols}">${steps}</ol>` : ''}
  ${page.text ? `<div class="pg-text">${(Array.isArray(page.text) ? page.text : [page.text]).map((t) => `<p>${rich(t)}</p>`).join('')}</div>` : ''}
  ${note}
  ${footer(n)}`
}

const body = pages
  .map((p, i) => {
    const n = i + 1
    let inner = ''
    if (p.kind === 'cover') inner = coverHtml()
    if (p.kind === 'toc') inner = tocHtml(p, n)
    if (p.kind === 'roles') inner = rolesHtml(p, n)
    if (p.kind === 'screen') inner = screenHtml(p, n)
    return `<section id="page-${n}" class="clip page page-${p.kind}" data-start="${i}" data-duration="1" data-track-index="0">${inner}</section>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(manual.title)} · ${esc(manual.subtitle)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${manual.font ? `@font-face { font-family: 'ManualFont'; src: url('${manual.font}') format('woff2'); font-weight: 100 900; }` : ''}
:root { --primary: ${THEME.primary}; --primary-soft: ${THEME.primarySoft}; --ink: #1e293b; --muted: #64748b; --line: #e2e8f0; --accent: ${THEME.accent}; }
* { box-sizing: border-box; }
body { margin: 0; background: #ffffff; font-family: 'ManualFont', 'Segoe UI', Arial, sans-serif; color: var(--ink); }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #ffffff; }
.page { position: absolute; inset: 0; padding: ${MARGIN}px ${MARGIN}px 0; background: #ffffff; }
.pg-header { display: flex; justify-content: space-between; align-items: center; font-size: 22px; color: var(--muted); padding-bottom: 22px; border-bottom: 2px solid var(--line); margin-bottom: 44px; }
.pg-brand { display: flex; align-items: center; gap: 12px; font-weight: 600; color: var(--primary); }
.pg-brand img { width: 30px; height: 30px; }
.pg-footer { position: absolute; left: ${MARGIN}px; right: ${MARGIN}px; bottom: 70px; display: flex; justify-content: space-between; font-size: 22px; color: var(--muted); border-top: 2px solid var(--line); padding-top: 20px; }
.chapter { background: var(--primary); color: #fff; border-radius: 22px; padding: 40px 48px; margin-bottom: 44px; }
.chapter-num { font-size: 22px; letter-spacing: 3px; text-transform: uppercase; opacity: .8; }
.chapter h1 { font-size: 64px; margin: 8px 0 14px; font-weight: 700; }
.chapter p { font-size: 28px; line-height: 1.45; margin: 0; opacity: .95; }
.chapter .chapter-who { margin-top: 14px; font-size: 25px; }
.pg-title { font-size: 46px; font-weight: 650; margin: 0 0 12px; color: var(--ink); }
.pg-purpose { font-size: 28px; line-height: 1.45; color: var(--muted); margin: 0 0 30px; }
.shot { position: relative; border: 2px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 26px rgba(15, 23, 42, .10); margin: 0 auto 36px; }
.shot img { display: block; width: 100%; height: 100%; object-fit: fill; }
.dot { position: absolute; transform: translate(-50%, -50%); width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 24px; font-weight: 700; display: grid; place-items: center; border: 3px solid #fff; box-shadow: 0 3px 10px rgba(0, 0, 0, .35); }
.steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 18px; }
.steps.two { grid-template-columns: 1fr 1fr; column-gap: 40px; }
.steps li { display: flex; gap: 18px; font-size: 27px; line-height: 1.42; }
.steps .num { flex: 0 0 44px; height: 44px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 700; font-size: 23px; display: grid; place-items: center; }
.pg-text p { font-size: 28px; line-height: 1.5; margin: 0 0 18px; }
.note { margin-top: 30px; background: var(--primary-soft); border-radius: 14px; padding: 22px 28px; font-size: 26px; line-height: 1.45; display: grid; gap: 6px; }
.note strong { color: var(--primary); }
.toc2 { display: grid; gap: 2px; margin-top: 6px; }
.toc-ch { display: flex; align-items: flex-end; gap: 22px; font-size: 30px; margin: 26px 0 10px; }
.toc-ch:first-child { margin-top: 0; }
.toc-pg { display: flex; align-items: flex-end; gap: 14px; font-size: 24px; color: var(--ink); padding-left: 80px; line-height: 1.55; }
.roles { display: grid; gap: 26px; }
.role { border: 2px solid var(--line); border-radius: 18px; padding: 26px 32px; }
.role-head { display: grid; gap: 4px; margin-bottom: 14px; }
.role-head h3 { margin: 0; font-size: 32px; color: var(--primary); }
.role-head p { margin: 0; font-size: 23px; color: var(--muted); line-height: 1.4; }
.role-pages { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; row-gap: 6px; }
.role-pages li { display: flex; align-items: flex-end; gap: 10px; font-size: 22px; }
.toc { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 26px; }
.toc li { display: flex; align-items: flex-end; gap: 22px; font-size: 32px; }
.toc-num { width: 58px; height: 58px; border-radius: 14px; background: var(--primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 28px; flex: 0 0 58px; }
.toc-name { display: grid; font-weight: 600; }
.toc-name small { font-size: 23px; font-weight: 400; color: var(--muted); }
.toc-dots { flex: 1; border-bottom: 3px dotted var(--line); margin-bottom: 14px; }
.toc-page { font-weight: 600; color: var(--primary); }
.page-cover { padding: 0; }
.cover-band { position: absolute; left: 0; right: 0; top: 0; height: 560px; background: var(--primary); }
.cover-body { position: absolute; left: ${MARGIN}px; right: ${MARGIN}px; top: 360px; background: #fff; border-radius: 30px; padding: 90px 90px 80px; box-shadow: 0 20px 60px rgba(15, 23, 42, .16); }
.cover-logo { height: 90px; }
.cover-title { font-size: 120px; line-height: 1.02; margin: 70px 0 18px; font-weight: 700; color: var(--ink); }
.cover-sub { font-size: 40px; color: var(--muted); margin: 0 0 70px; }
.cover-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; border-top: 2px solid var(--line); padding-top: 40px; }
.cover-meta span { display: block; font-size: 22px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }
.cover-meta strong { font-size: 32px; }
.cover-note { font-size: 26px; line-height: 1.5; color: var(--muted); margin: 50px 0 0; }
.cover-foot { position: absolute; left: 0; right: 0; bottom: 90px; text-align: center; font-size: 24px; color: var(--muted); }
</style>
</head>
<body>
<div id="root" data-composition-id="manual" data-start="0" data-width="${W}" data-height="${H}" data-duration="${pages.length}">
${body}
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  tl.set('#root', { opacity: 1 }, 0);
  tl.to({}, { duration: ${pages.length} }, 0);
  window.__timelines['manual'] = tl;
</script>
</body>
</html>
`

writeFileSync('index.html', html)
mkdirSync('work', { recursive: true })
writeFileSync('work/pages.json', JSON.stringify({ count: pages.length, at: pages.map((_, i) => i + 0.5) }))
console.log(`index.html con ${pages.length} páginas`)
