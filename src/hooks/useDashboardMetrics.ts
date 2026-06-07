import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DashboardMetrics {
  totalOrders: string
  revenue: string
  customers: string
  conversionRate: string
}

/**
 * Example data hook. Swap the `queryFn` for your real backend endpoint.
 * The api client automatically attaches a Shopify session token.
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api.get<DashboardMetrics>('/dashboard/metrics'),
    // Remove this once your endpoint exists; lets the UI render before the API is built.
    enabled: false,
    placeholderData: {
      totalOrders: '1,284',
      revenue: '$48,920',
      customers: '932',
      conversionRate: '3.4%',
    },
  })
}
