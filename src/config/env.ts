/**
 * Centralized, validated access to environment variables.
 * Importing from here (instead of `import.meta.env` everywhere) gives us a
 * single place to validate config and fail fast on misconfiguration.
 */

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env.local and set it.`,
    )
  }
  return value
}

export const env = {
  shopifyApiKey: required('VITE_SHOPIFY_API_KEY'),
  apiBaseUrl: required('VITE_API_BASE_URL'),
} as const
