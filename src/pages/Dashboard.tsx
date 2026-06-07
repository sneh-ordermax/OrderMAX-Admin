import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <s-box border="base" borderRadius="base" padding="base" background="subdued">
      <s-stack direction="block" gap="tight">
        <s-text color="subdued">{label}</s-text>
        <s-text type="strong">{value}</s-text>
      </s-stack>
    </s-box>
  )
}

export function Dashboard() {
  const { data, isLoading, isError, error } = useDashboardMetrics()

  return (
    <s-page heading="Dashboard">
      <s-section heading="Overview of your store performance" padding="base">
        {isError && (
          <s-banner heading="Couldn't load metrics" tone="critical">
            {error instanceof Error ? error.message : 'Unknown error'}
          </s-banner>
        )}

        <s-box padding="base">
          {isLoading ? (
            <s-stack direction="block" gap="tight">
              <s-spinner accessibilityLabel="Loading metrics" />
              <s-text color="subdued">Loading dashboard metrics...</s-text>
            </s-stack>
          ) : (
            <s-grid gridTemplateColumns="repeat(4, minmax(0, 1fr))" gap="base">
              <MetricCard label="Total orders" value={data?.totalOrders ?? '-'} />
              <MetricCard label="Revenue" value={data?.revenue ?? '-'} />
              <MetricCard label="Customers" value={data?.customers ?? '-'} />
              <MetricCard label="Conversion" value={data?.conversionRate ?? '-'} />
            </s-grid>
          )}
        </s-box>
      </s-section>

      <s-section heading="Welcome to OrderMAX Admin" padding="base">
        <s-text color="subdued">
          This dashboard now uses Shopify App Home web components. Wire
          useDashboardMetrics to your API endpoint, then build out the Orders and
          Settings pages.
        </s-text>
      </s-section>
    </s-page>
  )
}
