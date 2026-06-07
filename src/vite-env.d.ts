/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Shopify app Client ID (from the Partner Dashboard). Public — embedded in the bundle. */
  readonly VITE_SHOPIFY_API_KEY: string
  /** Base URL of your existing backend API that this dashboard talks to. */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * App Bridge v4 exposes a global `shopify` object once the CDN script loads.
 * `@shopify/app-bridge-react` provides the typed `useAppBridge()` hook, but we
 * declare the global here so it can be referenced directly when needed.
 */
declare const shopify: import('@shopify/app-bridge-react').ShopifyGlobal
