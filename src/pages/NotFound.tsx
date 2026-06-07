export function NotFound() {
  return (
    <s-page heading="Page not found">
      <s-section padding="base">
        <s-banner heading="This page doesn't exist" tone="warning">
          Check the URL or go back to the dashboard.
        </s-banner>
        <s-box padding="base">
          <s-link href="/">Back to dashboard</s-link>
        </s-box>
      </s-section>
    </s-page>
  )
}
