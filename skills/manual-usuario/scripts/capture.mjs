// Captura pantallas reales del portal desde el Chrome de depuración (CDP, puerto 9222)
// y mide la esquina de cada control marcado. Uso:
//   node tools/capture.mjs screens.json assets/shots coords.json [soloId,otroId]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [, , screensFile, shotsDir, coordsFile, onlyArg] = process.argv
const screens = JSON.parse(readFileSync(screensFile, 'utf8'))
const only = onlyArg ? new Set(onlyArg.split(',')) : null
mkdirSync(shotsDir, { recursive: true })
const coords = existsSync(coordsFile) ? JSON.parse(readFileSync(coordsFile, 'utf8')) : {}

const VIEWPORT = { width: 1440, height: 900 }
const BASE = screens.baseUrl

const FRESH = process.env.FRESH_CONTEXT === '1'
let wsUrl
let ownTabId = null
if (FRESH) {
  const version = await (await fetch('http://127.0.0.1:9222/json/version')).json()
  const browser = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve) => (browser.onopen = resolve))
  const call = (id, method, params) =>
    new Promise((resolve) => {
      browser.onmessage = (m) => {
        const msg = JSON.parse(m.data)
        if (msg.id === id) resolve(msg.result)
      }
      browser.send(JSON.stringify({ id, method, params }))
    })
  const { browserContextId } = await call(1, 'Target.createBrowserContext', { disposeOnDetach: false })
  const { targetId } = await call(2, 'Target.createTarget', { url: 'about:blank', browserContextId })
  browser.close()
  await new Promise((r) => setTimeout(r, 800))
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  wsUrl = list.find((t) => t.id === targetId).webSocketDebuggerUrl
} else if (process.env.OWN_TAB === '1') {
  const created = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json()
  ownTabId = created.id
  wsUrl = created.webSocketDebuggerUrl
} else {
  const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const tab = tabs.find((t) => t.type === 'page' && t.url.startsWith(BASE))
  if (!tab) throw new Error(`No hay una pestaña abierta en ${BASE}`)
  wsUrl = tab.webSocketDebuggerUrl
}

const ws = new WebSocket(wsUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
let seq = 0
const pending = new Map()
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)))
    ws.send(JSON.stringify({ id, method, params }))
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(`eval: ${JSON.stringify(r.exceptionDetails).slice(0, 300)}`)
  return r.result.value
}
const waitFor = async (selector, timeout = 20000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const found = await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)
    if (found) return true
    await sleep(300)
  }
  throw new Error(`No apareció ${selector}`)
}
const clickSelector = (selector) =>
  evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('no existe ' + ${JSON.stringify(selector)});
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  })()`)
const clickText = (text, scope = 'button, [role=menuitem], [role=tab], a') =>
  evaluate(`(() => {
    const want = ${JSON.stringify(text)}.trim().toLowerCase();
    const el = [...document.querySelectorAll(${JSON.stringify(scope)})].find((n) => n.innerText.trim().toLowerCase() === want);
    if (!el) throw new Error('no hay control con texto ' + want);
    el.click();
    return true;
  })()`)

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false })

const HIDE_CSS = screens.hideCss ?? ''

for (const screen of screens.screens) {
  if (only && !only.has(screen.id)) continue
  try {
    if (screen.route) {
      await send('Page.navigate', { url: BASE + screen.route })
      await sleep(screen.settle ?? 2500)
    }
    if (screen.waitFor) await waitFor(screen.waitFor, screen.timeout)
    for (const action of screen.actions ?? []) {
      if (action.click) await clickSelector(action.click)
      if (action.clickText) await clickText(action.clickText, action.scope)
      if (action.eval) await evaluate(action.eval)
      if (action.waitFor) await waitFor(action.waitFor, action.timeout)
      if (action.key) {
        for (let i = 0; i < (action.times ?? 1); i++) {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key: action.key, code: action.key, windowsVirtualKeyCode: action.keyCode ?? 0 })
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key: action.key, code: action.key, windowsVirtualKeyCode: action.keyCode ?? 0 })
          await sleep(action.gap ?? 900)
        }
      }
      if (action.hover) {
        const pt = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(action.hover)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`)
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y })
      }
      await sleep(action.wait ?? 700)
    }
    await evaluate(`(() => {
      let s = document.getElementById('__manual_hide');
      if (!s) { s = document.createElement('style'); s.id = '__manual_hide'; document.head.appendChild(s); }
      s.textContent = ${JSON.stringify(HIDE_CSS + (screen.css ?? ''))};
      window.scrollTo(0, ${screen.scrollY ?? 0});
      return true;
    })()`)
    await sleep(screen.afterCss ?? 600)

    const clip = screen.crop
      ? await evaluate(`(() => {
          const r = document.querySelector(${JSON.stringify(screen.crop)}).getBoundingClientRect();
          const pad = ${screen.cropPad ?? 12};
          const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad);
          return { x, y, width: Math.min(innerWidth - x, r.width + pad * 2), height: Math.min(innerHeight - y, r.height + pad * 2) };
        })()`)
      : { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height }

    const markers = []
    for (const marker of screen.markers ?? []) {
      const box = await evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(marker)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      })()`)
      if (!box) {
        markers.push(null)
        console.warn(`  [${screen.id}] marcador no visible: ${marker}`)
        continue
      }
      const nudge = 10
      const x = Math.min(Math.max(box.left - clip.x - nudge, 14), clip.width - 14)
      const y = Math.min(Math.max(box.top - clip.y - nudge, 14), clip.height - 14)
      markers.push({ x: (x / clip.width) * 100, y: (y / clip.height) * 100 })
    }

    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 }, captureBeyondViewport: false })
    writeFileSync(join(shotsDir, `${screen.id}.png`), Buffer.from(shot.data, 'base64'))
    coords[screen.id] = { width: Math.round(clip.width), height: Math.round(clip.height), markers }
    console.log(`ok ${screen.id} (${markers.filter(Boolean).length}/${(screen.markers ?? []).length} marcadores)`)
  } catch (error) {
    console.log(`FALLO ${screen.id}: ${error.message}`)
  }
}

writeFileSync(coordsFile, JSON.stringify(coords, null, 1))
await send('Emulation.clearDeviceMetricsOverride')
ws.close()
if (ownTabId) await fetch(`http://127.0.0.1:9222/json/close/${ownTabId}`)
