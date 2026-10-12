// Junta las páginas que sacó `hyperframes snapshot` en un PDF tamaño carta con Chrome headless.
// Uso: node tools/to-pdf.mjs snapshots out/Manual.pdf
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const [, , framesDir = 'snapshots', outFile = 'out/Manual.pdf'] = process.argv
const timeOf = (name) => Number((name.match(/at-([\d.]+)s/) ?? [])[1] ?? NaN)
const wanted = existsSync('work/pages.json')
  ? JSON.parse(readFileSync('work/pages.json', 'utf8')).at
  : null
const isWanted = (t) => !wanted || wanted.some((w) => Math.abs(w - t) < 0.01)
const frames = readdirSync(framesDir)
  .filter((f) => f.endsWith('.png') && !Number.isNaN(timeOf(f)) && isWanted(timeOf(f)))
  .sort((a, b) => timeOf(a) - timeOf(b))
if (!frames.length) throw new Error(`No hay páginas en ${framesDir}`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 8.5in 11in; margin: 0; }
html, body { margin: 0; padding: 0; }
img { display: block; width: 8.5in; height: 11in; page-break-after: always; break-after: page; }
img:last-child { page-break-after: auto; break-after: auto; }
</style></head><body>
${frames.map((f) => `<img src="${pathToFileURL(resolve(framesDir, f)).href}" />`).join('\n')}
</body></html>`

mkdirSync('work', { recursive: true })
const printFile = resolve('work/print.html')
writeFileSync(printFile, html)
mkdirSync(dirname(resolve(outFile)), { recursive: true })

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const chrome = candidates.find((p) => existsSync(p))
if (!chrome) throw new Error('No encontré Chrome ni Edge; define CHROME_PATH')

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--user-data-dir=${resolve('work/chrome-print')}`,
  `--print-to-pdf=${resolve(outFile)}`,
  pathToFileURL(printFile).href,
], { stdio: 'ignore', timeout: 300000 })

console.log(`${outFile}: ${frames.length} páginas, ${(statSync(outFile).size / 1024 / 1024).toFixed(1)} MB`)
