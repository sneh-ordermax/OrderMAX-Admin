import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

/**
 * Wraps the app with everything global:
 * - TanStack Query client
 *
 * Note: App Bridge itself is loaded via the CDN <script> in index.html and
 * exposes the global `shopify` object — it does NOT need a React provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
