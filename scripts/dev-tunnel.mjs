#!/usr/bin/env node
/**
 * Dev orchestrator: Cloudflare quick tunnel -> Vite dev server.
 *
 * On `npm run dev` this:
 *   1. Starts a Cloudflare quick tunnel in front of the Vite port (no account needed).
 *   2. Writes the public https tunnel URL into ../ordermax/shopify.app.toml
 *      (application_url + every auth.redirect_urls entry), so the embedded app
 *      loads through the tunnel during development.
 *   3. Starts Vite.
 *   4. On exit (Ctrl-C), restores the production URL in shopify.app.toml so the
 *      committed config never carries an ephemeral dev tunnel URL.
 *
 * Production deploys are untouched: this only runs for `npm run dev`, and the
 * prod URL is restored on shutdown.
 */
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const ordermaxRoot = resolve(projectRoot, '../ordermax')

// --- Config (override via env) -------------------------------------------------
const PORT = process.env.DEV_PORT || '3000'
// Path to the Shopify app config that owns the URLs.
const APP_TOML =
  process.env.SHOPIFY_APP_TOML || resolve(projectRoot, '../ordermax/shopify.app.toml')
// The canonical production URL to restore when dev stops.
const PROD_URL = process.env.SHOPIFY_PROD_URL || 'https://ordermax-admin.onrender.com'
const START_SHOPIFY_DEV = process.env.START_SHOPIFY_DEV !== 'false'

const URL_RE = /https:\/\/[^"\s]+/

function log(msg) {
  process.stdout.write(`\x1b[36m[dev-tunnel]\x1b[0m ${msg}\n`)
}

function readToml() {
  if (!existsSync(APP_TOML)) {
    log(`WARNING: ${APP_TOML} not found — skipping URL sync.`)
    return null
  }
  return readFileSync(APP_TOML, 'utf8')
}

/** Current application_url value in the toml, or null. */
function currentAppUrl(toml) {
  const m = toml.match(/^\s*application_url\s*=\s*"([^"]+)"/m)
  return m ? m[1] : null
}

/**
 * Replace the origin (scheme://host) of application_url and all redirect_urls
 * with `newOrigin`, preserving any path suffixes. Returns updated toml or null
 * if nothing to do.
 */
function rewriteUrls(toml, newOrigin) {
  const oldOrigin = currentAppUrl(toml)
  if (!oldOrigin) return null
  // application_url is a bare origin; redirect_urls are origin + path.
  // Replace every occurrence of the old origin so paths are preserved.
  if (oldOrigin === newOrigin) return null
  return toml.split(oldOrigin).join(newOrigin)
}

function applyOrigin(newOrigin, label) {
  const toml = readToml()
  if (!toml) return
  const updated = rewriteUrls(toml, newOrigin)
  if (updated == null) {
    log(`${label}: shopify.app.toml already points at ${newOrigin}`)
    return
  }
  writeFileSync(APP_TOML, updated)
  log(`${label}: shopify.app.toml URLs -> ${newOrigin}`)
}

let vite = null
let tunnel = null
let shopifyDev = null
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  log('Shutting down…')
  // Restore the production URL so the committed config stays clean.
  applyOrigin(PROD_URL, 'restore')
  for (const child of [vite, tunnel, shopifyDev]) {
    if (child && !child.killed) {
      try {
        child.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
  }
  process.exit(code)
}

function startShopifyDev() {
  if (!START_SHOPIFY_DEV) {
    log('Skipping ../ordermax dev (START_SHOPIFY_DEV=false).')
    return
  }

  if (shopifyDev && !shopifyDev.killed) return

  const existingShopifyDev = spawnSync('pgrep', ['-f', 'shopify app dev'], {
    encoding: 'utf8',
  })
  const existingPids =
    existingShopifyDev.status === 0
      ? existingShopifyDev.stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : []

  if (existingPids.length > 0) {
    log(`Detected existing ../ordermax dev (${existingPids.join(', ')}); skipping duplicate start.`)
    return
  }

  if (!existsSync(ordermaxRoot)) {
    log(`WARNING: ${ordermaxRoot} not found — skipping ../ordermax dev.`)
    return
  }

  log('Starting ../ordermax npm run dev…')
  shopifyDev = spawn('npm', ['run', 'dev'], {
    cwd: ordermaxRoot,
    stdio: 'inherit',
    env: process.env,
  })

  shopifyDev.on('exit', (code) => {
    if (!shuttingDown) {
      log(`../ordermax dev exited (code ${code ?? 0}).`)
      log('Continuing Admin tunnel/Vite. Restart ../ordermax dev after re-auth if needed.')
      shopifyDev = null
    }
  })
}

function startVite() {
  log(`Starting Vite on port ${PORT}…`)
  vite = spawn('npx', ['vite', '--port', PORT, '--strictPort'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  })
  vite.on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 0)
  })
}

function startTunnel() {
  log('Starting Cloudflare quick tunnel…')
  tunnel = spawn(
    'cloudflared',
    ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`],
    { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
  )

  let captured = false
  const handle = (buf) => {
    const text = buf.toString()
    process.stderr.write(text)
    if (captured) return
    const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
    if (m) {
      captured = true
      const origin = m[0]
      log(`Tunnel ready: ${origin}`)
      applyOrigin(origin, 'dev')
      startShopifyDev()
    }
  }
  tunnel.stdout.on('data', handle)
  tunnel.stderr.on('data', handle)
  tunnel.on('exit', (code) => {
    if (!shuttingDown) {
      log(`cloudflared exited (code ${code ?? 0}).`)
      shutdown(code ?? 0)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

startVite()
startTunnel()
