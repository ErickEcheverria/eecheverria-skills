// Mide en index.html cada renglón con data-target (índice, guía por rol) para convertirlo en enlace
// del PDF. Usa el Chrome de depuración (puerto 9222). Uso: node tools/links.mjs  ->  work/links.json
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const url = pathToFileURL(resolve('index.html')).href
const tab = await (await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let seq = 0
const pending = new Map()
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq
    pending.set(id, r)
    ws.send(JSON.stringify({ id, method, params }))
  })

await send('Emulation.setDeviceMetricsOverride', { width: 1700, height: 2200, deviceScaleFactor: 1, mobile: false })
await send('Page.reload')
await new Promise((r) => setTimeout(r, 3000))
const result = await send('Runtime.evaluate', {
  returnByValue: true,
  awaitPromise: true,
  expression: `(async () => {
    await document.fonts.ready;
    const out = [];
    for (const section of document.querySelectorAll('section.page')) {
      const page = Number(section.id.replace('page-', ''));
      const base = section.getBoundingClientRect();
      for (const el of section.querySelectorAll('[data-target]')) {
        const r = el.getBoundingClientRect();
        out.push({ page, target: Number(el.dataset.target), x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
      }
    }
    return out;
  })()`,
})
const links = result.result.value
writeFileSync('work/links.json', JSON.stringify(links))
ws.close()
await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`)
console.log(`work/links.json: ${links.length} enlaces`)
