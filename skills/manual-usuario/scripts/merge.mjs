// Une los capítulos (work/chapters/<id>.json + <id>.coords.json) en manual.json y coords.json,
// en el orden de book.json, y valida que cada página tenga su captura y un paso por marcador.
// Uso: node tools/merge.mjs book.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const [, , bookFile = 'book.json'] = process.argv
const book = JSON.parse(readFileSync(bookFile, 'utf8'))
const coords = {}
const chapters = []
const problems = []

for (const id of book.chapters) {
  const chapterFile = `work/chapters/${id}.json`
  if (!existsSync(chapterFile)) {
    problems.push(`falta el capítulo ${id}`)
    continue
  }
  const chapter = JSON.parse(readFileSync(chapterFile, 'utf8'))
  const coordsFile = `work/chapters/${id}.coords.json`
  if (existsSync(coordsFile)) Object.assign(coords, JSON.parse(readFileSync(coordsFile, 'utf8')))
  chapters.push(chapter)
}

for (const extra of book.extraCoords ?? []) {
  if (existsSync(extra)) Object.assign(coords, JSON.parse(readFileSync(extra, 'utf8')))
}

for (const chapter of chapters) {
  for (const page of chapter.pages) {
    if (!page.image) continue
    const meta = coords[page.image]
    if (!meta) {
      problems.push(`${chapter.id}: sin coordenadas para ${page.image}`)
      continue
    }
    if (!existsSync(`assets/shots/${page.image}.png`)) problems.push(`${chapter.id}: falta assets/shots/${page.image}.png`)
    const markers = meta.markers.length
    const steps = (page.steps ?? []).length
    if (steps < markers) problems.push(`${chapter.id}/${page.image}: ${markers} marcadores y ${steps} pasos`)
    const texts = [page.title, page.purpose, page.note, ...(page.steps ?? []), ...([].concat(page.text ?? []))]
    if (texts.some((t) => String(t ?? '').includes('—'))) problems.push(`${chapter.id}/${page.title}: guion largo`)
    if (texts.some((t) => /\bOCs?\b/.test(String(t ?? '')))) problems.push(`${chapter.id}/${page.title}: dice OC`)
  }
}

const manual = { ...book.meta, chapters }
writeFileSync('manual.json', JSON.stringify(manual, null, 1))
writeFileSync('coords.json', JSON.stringify(coords, null, 1))
const pages = chapters.reduce((n, c) => n + c.pages.length, 0)
console.log(`manual.json: ${chapters.length} capítulos, ${pages} páginas de contenido`)
if (problems.length) {
  console.log('PROBLEMAS:')
  for (const p of problems) console.log(' - ' + p)
  process.exitCode = 1
}
