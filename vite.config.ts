import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Embedded apps are served inside the Shopify Admin iframe.
    // Use a tunnel (e.g. Cloudflare/ngrok) in front of this port during dev.
    port: 3000,
    // Allow the tunnel host to reach the dev server.
    host: true,
    // Cloudflare quick tunnels generate random *.trycloudflare.com hosts.
    // Allow subdomains so each new tunnel URL works without manual edits.
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    cors: true,
  },
  preview: {
    port: 3000,
  },
})
