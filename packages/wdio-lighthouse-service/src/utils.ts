import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants.js'
import type { RequestPayload } from './handler/network.js'
import type { LighthouseFlowResultLike, LighthouseResultLike } from './types.js'

interface PuppeteerPageLike {
    url: () => string
}

interface PuppeteerTargetLike<TPage extends PuppeteerPageLike> {
    url: () => string
    type?: () => string
    page: () => Promise<TPage | null | undefined>
}

interface PuppeteerBrowserLike<TPage extends PuppeteerPageLike> {
    pages: () => Promise<TPage[]>
    waitForTarget?: (
        predicate: (target: PuppeteerTargetLike<TPage>) => boolean | Promise<boolean>
    ) => Promise<{ page: () => Promise<TPage | null | undefined> } | undefined>
}

const CUSTOM_COMMANDS = [
    'getMetrics',
    'startTracing',
    'getDiagnostics',
    'getCoverageReport',
    'enablePerformanceAudits',
    'disablePerformanceAudits',
    'getMainThreadWorkBreakdown',
    'checkPWA',
    'getPerformanceScore',
    'getTraceLogs',
    'getPageWeight',
    'endTracing'
]

export function setUnsupportedCommand (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    for (const command of CUSTOM_COMMANDS) {
        (browser as WebdriverIO.Browser).addCommand(command, /* istanbul ignore next */() => {
            throw new Error(UNSUPPORTED_ERROR_MESSAGE)
        }, {})
    }
}

/**
 * Create a sum of a specific key from a list of objects
 * @param list list of key/value objects
 * @param key  key of value to be summed up
 */
export function sumByKey (list: RequestPayload[], key: keyof RequestPayload) {
    return list.map((data) => data[key]).reduce((acc, val) => acc + val, 0)
}

/**
 * check if url is supported for tracing
 * @param  {string}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url: string) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
}

/**
 * Puppeteer 24+ returns a Uint8Array from `page.tracing.stop()`.
 * `Uint8Array#toString()` joins bytes with commas, so decode as UTF-8 first.
 */
export function parseTraceBuffer (buffer: Buffer | Uint8Array | string): { traceEvents?: unknown[] } & Record<string, unknown> {
    const raw = typeof buffer === 'string'
        ? buffer
        : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength).toString('utf8')
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
    if (Array.isArray(parsed)) {
        return { traceEvents: parsed }
    }
    if (parsed && typeof parsed === 'object') {
        return parsed as { traceEvents?: unknown[] } & Record<string, unknown>
    }
    throw new Error('Trace buffer did not contain JSON trace data')
}

/**
 * Chrome's WebDriver BiDi stack and DevTools windows show up as extra Puppeteer
 * pages. Lighthouse must attach to the tab WebdriverIO actually navigates.
 */
export function isInternalBrowserPage (url: string) {
    return (
        url.includes('BiDi-CDP Mapper') ||
        url.startsWith('devtools://') ||
        url.startsWith('chrome-extension://')
    )
}

function pageMatchesUrl (pageUrl: string, currentUrl: string) {
    return pageUrl === currentUrl || pageUrl.includes(currentUrl) || currentUrl.includes(pageUrl)
}

export function resolveAuditablePage<TPage extends PuppeteerPageLike> (
    pages: TPage[],
    currentUrl?: string
): TPage | undefined {
    const candidates = pages.filter((page) => !isInternalBrowserPage(page.url()))
    if (currentUrl && currentUrl !== 'data:,') {
        const match = candidates.find((page) => pageMatchesUrl(page.url(), currentUrl))
        if (match) {
            return match
        }
    }

    return candidates.find((page) => isSupportedUrl(page.url())) ?? candidates.at(-1)
}

export async function getAuditablePuppeteerPage<TPage extends PuppeteerPageLike> (
    puppeteer: PuppeteerBrowserLike<TPage>,
    currentUrl?: string
): Promise<TPage | undefined> {
    const pages = await puppeteer.pages()
    const fromPages = resolveAuditablePage(pages, currentUrl)
    if (fromPages) {
        return fromPages
    }

    if (!puppeteer.waitForTarget) {
        return undefined
    }

    const target = currentUrl && currentUrl !== 'data:,'
        ? await puppeteer.waitForTarget(async (t) => (
            pageMatchesUrl(t.url(), currentUrl) &&
            !isInternalBrowserPage(t.url()) &&
            Boolean(await t.page())
        ))
        : await puppeteer.waitForTarget(async (t) => (
            (t.type?.() === 'page' || Boolean(await t.page())) &&
            !isInternalBrowserPage(t.url())
        ))

    return await target?.page() ?? undefined
}

const CORE_METRIC_KEYS = [
    'firstContentfulPaint',
    'largestContentfulPaint',
    'speedIndex'
] as const

function metricValue (lhr: LighthouseResultLike, auditId: string, metricKey: string) {
    const audits = lhr.audits ?? {}
    const metrics = audits.metrics?.details?.items?.[0] ?? {}
    const value = metrics[metricKey] ?? audits[auditId]?.numericValue
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function hasCorePerformanceMetrics (lhr?: LighthouseResultLike): lhr is LighthouseResultLike {
    if (!lhr) {
        return false
    }

    return CORE_METRIC_KEYS.every((key) => {
        const auditId = key === 'firstContentfulPaint'
            ? 'first-contentful-paint'
            : key === 'largestContentfulPaint'
                ? 'largest-contentful-paint'
                : 'speed-index'
        return metricValue(lhr, auditId, key) !== undefined
    })
}

export function selectLighthouseResult (result?: LighthouseFlowResultLike): LighthouseResultLike | undefined {
    const steps = result?.steps ?? []
    for (let i = steps.length - 1; i >= 0; i--) {
        if (hasCorePerformanceMetrics(steps[i]?.lhr)) {
            return steps[i].lhr
        }
    }

    return steps.at(-1)?.lhr
}

export function describeLighthouseResult (lhr?: LighthouseResultLike) {
    const url = lhr?.finalDisplayedUrl || lhr?.finalUrl || 'unknown'
    const runtimeError = lhr?.runtimeError
        ? `${lhr.runtimeError.code ?? 'unknown'}: ${lhr.runtimeError.message ?? ''}`.trim()
        : 'none'
    return `url=${url} runtimeError=${runtimeError}`
}
