import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type ShopifyElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [key: string]: unknown
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      's-page': ShopifyElement
      's-section': ShopifyElement
      's-banner': ShopifyElement
      's-grid': ShopifyElement
      's-box': ShopifyElement
      's-stack': ShopifyElement
      's-text': ShopifyElement
      's-spinner': ShopifyElement
      's-link': ShopifyElement
      's-button': ShopifyElement
    }
  }
}

export {}
