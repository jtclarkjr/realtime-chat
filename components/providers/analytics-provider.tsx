import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function AnalyticsProvider() {
  if (process.env.ENV === 'dev') return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
