import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment'
import { inject } from '@vercel/analytics'

/**
 * Vercel Web Analytics is cookieless, so no consent banner is required. The
 * script is served from `/_vercel/insights/*` by the Vercel deployment itself
 * and tracks client-side route changes on its own.
 */
if (ExecutionEnvironment.canUseDOM && process.env.NODE_ENV === 'production') {
    inject({ framework: 'docusaurus' })
}
