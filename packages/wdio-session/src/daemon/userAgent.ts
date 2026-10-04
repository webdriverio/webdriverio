import logger from '@wdio/logger'

import type { Session } from '../session.js'

const log = logger('@wdio/session:init')

const HEADLESS_TOKEN = 'HeadlessChrome/'

/**
 * Headless Chrome and Edge send `HeadlessChrome/<version>` where a window
 * sends `Chrome/<version>`. Many sites refuse that token outright: Akamai
 * (Zara, UPS) answers "Access Denied" and Cloudflare (umich.edu) shows
 * "Just a moment..." before any page script runs, so an agent sees a block
 * page a headed session would never get. The same browser with only the
 * token changed loads those sites, with or without chromedriver's `cdc_`
 * globals on the page.
 *
 * So a headless session sends the user agent a headed window of the same
 * browser would send. It does not hide automation: `navigator.webdriver`
 * stays `true`. Chrome drops the user agent client hints while the user
 * agent is overridden (`navigator.userAgentData.brands` is empty).
 * `--arg=--user-agent=<ua>` keeps whatever user agent is given there.
 */
export async function matchHeadedUserAgent (session: Session) {
    const { plan } = session
    if (!plan.headless || !session.isBidi || (plan.target !== 'chrome' && plan.target !== 'edge') || hasUserAgentArg(plan.capabilities)) {
        return
    }
    const current = await session.browser.execute(() => navigator.userAgent)
    if (typeof current !== 'string' || !current.includes(HEADLESS_TOKEN)) {
        return
    }
    // without `contexts` the override applies to every tab, also those opened later
    await session.browser.emulationSetUserAgentOverride({ userAgent: current.replace(HEADLESS_TOKEN, 'Chrome/') })
    log.info('Headless session sends the user agent of a headed window')
}

function hasUserAgentArg (capabilities: unknown) {
    const caps = capabilities as Record<string, unknown> & { alwaysMatch?: Record<string, unknown> }
    return [caps, caps?.alwaysMatch].some((c) => ['goog:chromeOptions', 'ms:edgeOptions'].some((key) => {
        const args = (c?.[key] as { args?: unknown } | undefined)?.args
        return Array.isArray(args) && args.some((arg) => typeof arg === 'string' && arg.startsWith('--user-agent='))
    }))
}
