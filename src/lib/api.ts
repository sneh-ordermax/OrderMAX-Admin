import { env } from '@/config/env'

/**
 * HTTP client for the existing backend API.
 *
 * Every request is authenticated with a fresh Shopify **session token** (a
 * short-lived JWT from App Bridge). Your backend verifies this token using your
 * app's API secret to know which shop/user is making the request.
 *
 * Docs: https://shopify.dev/docs/api/app-bridge-library/reference/id-token
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getSessionToken(): Promise<string> {
  // `shopify` is the global injected by the App Bridge CDN script (see index.html).
  if (typeof shopify === 'undefined' || !shopify.idToken) {
    throw new ApiError(401, 'App Bridge is not available — open this app inside Shopify Admin.')
  }
  return shopify.idToken()
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  /** JSON-serializable body. */
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getSessionToken()
  const { body, headers, ...rest } = options

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : undefined) ?? `Request failed with status ${response.status}`
    throw new ApiError(response.status, message, payload)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
