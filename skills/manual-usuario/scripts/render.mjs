// Arma la composición, saca cada página con `hyperframes snapshot` y genera el PDF.
// Uso: node tools/render.mjs [salida.pdf]
import { readFileSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const out = process.argv[2] ?? 'out/Manual.pdf'
const HYPERFRAMES = process.env.HYPERFRAMES_VERSION ?? '0.8.150'

execSync('node tools/build.mjs manual.json coords.json', { stdio: 'inherit' })
const { at } = JSON.parse(readFileSync('work/pages.json', 'utf8'))
rmSync('snapshots', { recursive: true, force: true })
execSync(`npx --yes hyperframes@${HYPERFRAMES} snapshot --at ${at.join(',')}`, { stdio: 'inherit' })
execSync(`node tools/to-pdf.mjs snapshots "${out}"`, { stdio: 'inherit' })
