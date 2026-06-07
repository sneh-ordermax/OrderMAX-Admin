#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { access, copyFile, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import { findMissingEnvKeys, renderFixSuggestion } from './setup-system-lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const envExamplePath = resolve(rootDir, '.env.example')
const envLocalPath = resolve(rootDir, '.env.local')

const rl = createInterface({ input, output })

function log(message) {
  process.stdout.write(`\x1b[36m[setup]\x1b[0m ${message}\n`)
}

function warn(message) {
  process.stdout.write(`\x1b[33m[setup]\x1b[0m ${message}\n`)
}

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(checker, [command], { stdio: 'ignore' })
  return result.status === 0
}

async function askChoice(question, choices) {
  while (true) {
    const response = (await rl.question(`${question} `)).trim().toLowerCase()
    if (choices.includes(response)) return response
    warn(`Please choose one of: ${choices.join(', ')}`)
  }
}

async function runCommand(command, args, { canContinue = false } = {}) {
  while (true) {
    log(`Running: ${command} ${args.join(' ')}`)
    const result = await new Promise((resolvePromise) => {
      const child = spawn(command, args, {
        cwd: rootDir,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString()
        stdout += text
        process.stdout.write(text)
      })
      child.stderr.on('data', (chunk) => {
        const text = chunk.toString()
        stderr += text
        process.stderr.write(text)
      })

      child.on('error', (error) => {
        resolvePromise({ code: 1, stdout, stderr: `${stderr}\n${error.message}` })
      })
      child.on('exit', (code) => {
        resolvePromise({ code: code ?? 1, stdout, stderr })
      })
    })

    if (result.code === 0) return

    warn(renderFixSuggestion({ command: `${command} ${args.join(' ')}`, ...result }))
    const choices = canContinue ? ['retry', 'continue', 'exit'] : ['retry', 'exit']
    const choice = await askChoice(
      `Command failed. Type ${choices.map((c) => `"${c}"`).join(', ')}:`,
      choices,
    )
    if (choice === 'retry') continue
    if (choice === 'continue') return
    throw new Error(`Setup stopped by user while running "${command} ${args.join(' ')}".`)
  }
}

async function ensureEnvFile() {
  try {
    await access(envLocalPath, constants.F_OK)
    log('.env.local found.')
  } catch {
    warn('.env.local not found.')
    const choice = await askChoice(
      'Create .env.local from .env.example now? ("yes" / "no")',
      ['yes', 'no'],
    )
    if (choice === 'no') {
      throw new Error('Cannot continue without .env.local.')
    }
    await copyFile(envExamplePath, envLocalPath)
    log('Created .env.local from .env.example.')
  }

  const exampleContents = await readFile(envExamplePath, 'utf8')
  const localContents = await readFile(envLocalPath, 'utf8')
  const missingKeys = findMissingEnvKeys(exampleContents, localContents)

  if (!missingKeys.length) {
    log('Environment variables look good.')
    return
  }

  warn(`Missing or placeholder values in .env.local: ${missingKeys.join(', ')}`)
  warn('How to fix:')
  warn('- Open .env.local and fill each value with real project credentials.')
  warn('- Keep only VITE_* public values in this file (no secrets).')

  const choice = await askChoice(
    'After updating .env.local, type "retry" to validate again or "continue" to skip:',
    ['retry', 'continue'],
  )
  if (choice === 'retry') {
    return ensureEnvFile()
  }
}

async function main() {
  log('Starting project setup...')
  if (!commandExists('node')) {
    throw new Error('Node.js is not installed. Install Node 20+ from https://nodejs.org/.')
  }
  if (!commandExists('npm')) {
    throw new Error('npm is not available. Reinstall Node.js or fix your PATH.')
  }

  await runCommand('npm', ['install'])
  await ensureEnvFile()

  if (!commandExists('cloudflared')) {
    warn('Optional dependency missing: cloudflared.')
    warn('How to fix:')
    warn('- Install cloudflared for embedded Shopify tunnel-based dev.')
    warn('- Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/')
    warn('- You can still run local-only mode with `npm run dev:local`.')
  } else {
    log('cloudflared found.')
  }

  log('Setup complete.')
  log('Next steps:')
  log('- Run `npm run dev` for tunnel + Vite.')
  log('- Run `npm run dev:local` for local-only development.')
}

main()
  .catch((error) => {
    warn(error.message)
    process.exitCode = 1
  })
  .finally(() => {
    rl.close()
  })
