import { EOL } from 'node:os'

function parseLineKey(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    return null
  }

  const [rawKey] = trimmed.split('=')
  return rawKey?.trim() || null
}

export function parseEnvKeys(fileContents) {
  return fileContents
    .split(/\r?\n/g)
    .map(parseLineKey)
    .filter((key) => key && key.startsWith('VITE_'))
}

function parseEnvMap(fileContents) {
  const map = new Map()

  for (const line of fileContents.split(/\r?\n/g)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [rawKey, ...rawValueParts] = trimmed.split('=')
    const key = rawKey.trim()
    const value = rawValueParts.join('=').trim()
    map.set(key, value)
  }

  return map
}

function isPlaceholder(value) {
  if (!value) return true
  return /your_|example\.com|_here|changeme|placeholder/i.test(value)
}

export function findMissingEnvKeys(exampleContents, localContents) {
  const requiredKeys = parseEnvKeys(exampleContents)
  const currentValues = parseEnvMap(localContents)

  return requiredKeys.filter((key) => {
    const value = currentValues.get(key)
    return !value || isPlaceholder(value)
  })
}

export function renderFixSuggestion({ command, stdout = '', stderr = '' }) {
  const combined = `${stdout}\n${stderr}`.trim()
  const lower = combined.toLowerCase()
  const fixes = []

  if (lower.includes('eacces') || lower.includes('permission denied')) {
    fixes.push('- Check folder permissions and rerun in a writable directory.')
    fixes.push('- If using npm globally, prefer `npx` or a Node version manager.')
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('etimedout')) {
    fixes.push('- Check internet connectivity and retry.')
    fixes.push('- If behind a proxy, run `npm config set proxy <proxy-url>`.')
  }
  if (lower.includes('not found') || lower.includes('enoent')) {
    fixes.push('- Verify the command exists in your PATH.')
    fixes.push('- Reinstall dependencies or run `npm install` again.')
  }
  if (lower.includes('cloudflared')) {
    fixes.push('- Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/')
    fixes.push('- Or use `npm run dev:local` to develop without a tunnel.')
  }
  if (!fixes.length) {
    fixes.push('- Review the error output and rerun this setup command.')
    fixes.push('- If it keeps failing, share this output with the team for support.')
  }

  const details = combined ? `${combined}${EOL}${EOL}` : ''
  return `Command failed: ${command}${EOL}${EOL}${details}How to fix:${EOL}${fixes.join(EOL)}`
}
