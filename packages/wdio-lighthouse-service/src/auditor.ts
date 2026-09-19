import logger from '@wdio/logger'
import type { CustomInstanceCommands } from 'webdriverio'

import type {
    FormFactor,
    DiagnosticsResult,
    PerformanceMetrics,
    LighthouseResultLike,
    MainThreadWorkBreakdownResult
} from './types.js'

const log = logger('@wdio/lighthouse-service:Auditor')

function asNumber (value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function roundMetric (value: unknown): number | undefined {
    const numeric = asNumber(value)
    return numeric === undefined ? undefined : Math.round(numeric)
}

export default class Auditor {
    constructor (
        private _lhr?: LighthouseResultLike,
        private _formFactor?: FormFactor
    ) {}

    /**
     * an Auditor instance is created for every Lighthouse run so provide an
     * updateCommands function to receive the latest performance metrics
     */
    updateCommands (browser: WebdriverIO.Browser, customFn?: CustomInstanceCommands<WebdriverIO.Browser>['addCommand']) {
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && fnName !== 'updateCommands' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(fnName, customFn || (this[fnName as keyof Auditor] as Function).bind(this)))
    }

    /**
     * Returns a list with a breakdown of all main thread tasks and their total duration
     */
    async getMainThreadWorkBreakdown (): Promise<MainThreadWorkBreakdownResult[]> {
        const items = this._lhr?.audits?.['mainthread-work-breakdown']?.details?.items
        if (!Array.isArray(items)) {
            return []
        }

        return items.map((item) => ({
            group: String(item.group ?? ''),
            duration: asNumber(item.duration) ?? 0
        }))
    }

    /**
     * Get some useful diagnostics about the page load
     */
    async getDiagnostics (): Promise<DiagnosticsResult | null> {
        const details = this._lhr?.audits?.diagnostics?.details
        if (!details || !Array.isArray(details.items) || !details.items[0]) {
            return null
        }

        return details.items[0] as DiagnosticsResult
    }

    /**
     * Get most commonly used performance metrics
     */
    async getMetrics (): Promise<PerformanceMetrics> {
        const audits = this._lhr?.audits ?? {}
        const metrics = audits.metrics?.details?.items?.[0] ?? {}

        return {
            timeToFirstByte: roundMetric(audits['server-response-time']?.numericValue),
            serverResponseTime: roundMetric(audits['server-response-time']?.numericValue),
            domContentLoaded: asNumber(metrics.observedDomContentLoaded),
            firstVisualChange: asNumber(metrics.observedFirstVisualChange),
            firstPaint: asNumber(metrics.observedFirstPaint),
            firstContentfulPaint: asNumber(metrics.firstContentfulPaint ?? audits['first-contentful-paint']?.numericValue),
            firstMeaningfulPaint: asNumber(metrics.firstMeaningfulPaint),
            largestContentfulPaint: asNumber(metrics.largestContentfulPaint ?? audits['largest-contentful-paint']?.numericValue),
            lastVisualChange: asNumber(metrics.observedLastVisualChange),
            interactive: asNumber(metrics.interactive ?? audits.interactive?.numericValue),
            load: asNumber(metrics.observedLoad),
            speedIndex: asNumber(metrics.speedIndex ?? audits['speed-index']?.numericValue),
            totalBlockingTime: asNumber(metrics.totalBlockingTime ?? audits['total-blocking-time']?.numericValue),
            maxPotentialFID: asNumber(metrics.maxPotentialFID ?? audits['max-potential-fid']?.numericValue),
            cumulativeLayoutShift: asNumber(
                audits['cumulative-layout-shift']?.numericValue ?? metrics.cumulativeLayoutShift
            ),
            interactionToNextPaint: asNumber(audits['interaction-to-next-paint']?.numericValue)
        }
    }

    /**
     * Returns the Lighthouse Performance Score, a weighted mean of FCP, SI, LCP, TBT and CLS.
     */
    async getPerformanceScore (): Promise<number | null> {
        const score = this._lhr?.categories?.performance?.score
        if (typeof score !== 'number' || Number.isNaN(score)) {
            log.info('Performance score couldn\'t be found, setting performance score to: null')
            return null
        }

        return score
    }
}
