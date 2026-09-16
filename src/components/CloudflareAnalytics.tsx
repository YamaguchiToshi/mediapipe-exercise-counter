const CLOUDFLARE_ANALYTICS_TOKEN = "ac03e0f4d5644194a5d005a3786f0e9c";

interface CloudflareAnalyticsProps {
  token?: string;
}

/**
 * Cloudflare Web Analytics component
 * Injects the Cloudflare Beacon script directly into the page.
 */
export function CloudflareAnalytics({ token }: CloudflareAnalyticsProps) {
  const analyticsToken =
    token || process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN || CLOUDFLARE_ANALYTICS_TOKEN;

  if (!analyticsToken) {
    return null;
  }

  return (
    <script
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: analyticsToken })}
    />
  );
}
