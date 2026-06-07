import test from 'node:test'
import assert from 'node:assert/strict'

import { findMissingEnvKeys, parseEnvKeys, renderFixSuggestion } from './setup-system-lib.mjs'

test('parseEnvKeys returns declared VITE keys', () => {
  const example = `
# comment
VITE_SHOPIFY_API_KEY=demo
VITE_API_BASE_URL=https://api.example.com
`

  assert.deepEqual(parseEnvKeys(example), ['VITE_SHOPIFY_API_KEY', 'VITE_API_BASE_URL'])
})

test('findMissingEnvKeys returns keys not set in env.local', () => {
  const example = `
VITE_SHOPIFY_API_KEY=demo
VITE_API_BASE_URL=https://api.example.com
`
  const local = `
VITE_SHOPIFY_API_KEY=pk_live_123
`

  assert.deepEqual(findMissingEnvKeys(example, local), ['VITE_API_BASE_URL'])
})

test('renderFixSuggestion includes command and troubleshooting guidance', () => {
  const output = renderFixSuggestion({
    command: 'npm install',
    stdout: '',
    stderr: 'npm ERR! network timeout',
  })

  assert.match(output, /Command failed: npm install/)
  assert.match(output, /network timeout/)
  assert.match(output, /How to fix:/)
})
