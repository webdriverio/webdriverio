import Diagnostics from 'lighthouse/lighthouse-core/audits/diagnostics'
import MainThreadWorkBreakdown from 'lighthouse/lighthouse-core/audits/mainthread-work-breakdown'
import Metrics from 'lighthouse/lighthouse-core/audits/metrics'
import ServerResponseTime from 'lighthouse/lighthouse-core/audits/server-response-time'
import CumulativeLayoutShift from 'lighthouse/lighthouse-core/audits/metrics/cumulative-layout-shift'
import FirstContentfulPaint from 'lighthouse/lighthouse-core/audits/metrics/first-contentful-paint'
import LargestContentfulPaint from 'lighthouse/lighthouse-core/audits/metrics/largest-contentful-paint'
import SpeedIndex from 'lighthouse/lighthouse-core/audits/metrics/speed-index'
import InteractiveMetric from 'lighthouse/lighthouse-core/audits/metrics/interactive'
import TotalBlockingTime from 'lighthouse/lighthouse-core/audits/metrics/total-blocking-time'
import ReportScoring from 'lighthouse/lighthouse-core/scoring'
import defaultConfig from 'lighthouse/lighthouse-core/config/default-config'
import logger from '@wdio/logger'

import type { Trace } from './gatherer/trace'
import type { CDPSessionOnMessageObject } from './gatherer/devtools'

const log = logger('@wdio/devtools-service:Auditor')

const SHARED_AUDIT_CONTEXT = {
    settings: { throttlingMethod: 'devtools' },
    LighthouseRunWarnings: false,
    computedCache: new Map()
}

interface Audit {
    audit: (opts: any, context: any) => Promise<any>,
    defaultOptions: Record<string, any>
}

interface AuditResults {
    'speed-index': MetricsResult
    'first-contentful-paint': MetricsResult
    'largest-contentful-paint': MetricsResult
    'cumulative-layout-shift': MetricsResult
    'total-blocking-time': MetricsResult
    interactive: MetricsResult
}

interface AuditRef {
    id: keyof AuditResults
    weight: number
}

interface MainThreadWorkBreakdownResult {
    details: {
        items: {
            group: string,
            duration: number
        }[]
    }
}

interface DiagnosticsResults {
    details: {
        items: any[]
    }
}

interface ResponseTimeResult {
    numericValue: number
}

interface MetricsResult {
    score: number
}

interface MetricsResults {
    details: {
        items: {
            estimatedInputLatency: number
            observedDomContentLoaded: number
            observedFirstVisualChange: number
            observedFirstPaint: number
            firstContentfulPaint: number
            firstMeaningfulPaint: number
            largestContentfulPaint: number
            observedLastVisualChange: number
            firstCPUIdle: number
            interactive: number
            observedLoad: number
            speedIndex: number
            totalBlockingTime: number
        }[]
    }
}

export default class Auditor {
    _devtoolsLogs?: CDPSessionOnMessageObject[]
    _traceLogs?: Trace
    _url?: string

    constructor(traceLogs?: Trace, devtoolsLogs?: CDPSessionOnMessageObject[]) {
        this._devtoolsLogs = devtoolsLogs
        this._traceLogs = traceLogs

        if (traceLogs) {
            this._url = traceLogs.pageUrl
        }
    }

    _audit (AUDIT: Audit, params = {}) {
        const auditContext = {
            options: { ...AUDIT.defaultOptions },
            ...SHARED_AUDIT_CONTEXT
        }

        try {
            return AUDIT.audit({
                traces: { defaultPass: this._traceLogs },
                devtoolsLogs: { defaultPass: this._devtoolsLogs },
                TestedAsMobileDevice: true,
                ...params
            }, auditContext)
        } catch (e) {
            log.error(e)
            return {}
        }
    }

    /**
     * an Auditor instance is created for every trace so provide an updateCommands
     * function to receive the latest performance metrics with the browser instance
     */
    updateCommands (browser: WebdriverIO.BrowserObject, customFn?: WebdriverIO.AddCommandFn) {
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && fnName !== 'updateCommands' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(fnName, customFn || (this[fnName as keyof Auditor] as any).bind(this)))
    }

    async getMainThreadWorkBreakdown() {
        const result = await this._audit(MainThreadWorkBreakdown) as MainThreadWorkBreakdownResult
        return result.details.items.map(
            ({ group, duration }) => ({ group, duration })
        )
    }

    async getDiagnostics() {
        const result = await this._audit(Diagnostics) as DiagnosticsResults

        /**
         * return null if Audit fails
         */
        if (!Object.prototype.hasOwnProperty.call(result, 'details')) {
            return null
        }

        return result.details.items[0]
    }

    async getMetrics () {
        const serverResponseTime = await this._audit(ServerResponseTime, { URL: this._url }) as ResponseTimeResult
        const cumulativeLayoutShift = await this._audit(CumulativeLayoutShift) as ResponseTimeResult
        const result = await this._audit(Metrics) as MetricsResults
        const metrics = result.details.items[0] || {}
        return {
            estimatedInputLatency: metrics.estimatedInputLatency,
            /**
             * keeping TTFB for backwards compatibility
             */
            timeToFirstByte: Math.round(serverResponseTime.numericValue),
            serverResponseTime: Math.round(serverResponseTime.numericValue),
            domContentLoaded: metrics.observedDomContentLoaded,
            firstVisualChange: metrics.observedFirstVisualChange,
            firstPaint: metrics.observedFirstPaint,
            firstContentfulPaint: metrics.firstContentfulPaint,
            firstMeaningfulPaint: metrics.firstMeaningfulPaint,
            largestContentfulPaint: metrics.largestContentfulPaint,
            lastVisualChange: metrics.observedLastVisualChange,
            firstCPUIdle: metrics.firstCPUIdle,
            firstInteractive: metrics.interactive,
            load: metrics.observedLoad,
            speedIndex: metrics.speedIndex,
            totalBlockingTime: metrics.totalBlockingTime,
            cumulativeLayoutShift: cumulativeLayoutShift.numericValue,
        }
    }

    async getPerformanceScore() {
        const auditResults: AuditResults = {
            'speed-index': await this._audit(SpeedIndex) as MetricsResult,
            'first-contentful-paint': await this._audit(FirstContentfulPaint) as MetricsResult,
            'largest-contentful-paint': await this._audit(LargestContentfulPaint) as MetricsResult,
            'cumulative-layout-shift': await this._audit(CumulativeLayoutShift) as MetricsResult,
            'total-blocking-time': await this._audit(TotalBlockingTime) as MetricsResult,
            interactive: await this._audit(InteractiveMetric) as MetricsResult
        }

        if (!auditResults.interactive || !auditResults['cumulative-layout-shift'] || !auditResults['first-contentful-paint'] ||
            !auditResults['largest-contentful-paint'] || !auditResults['speed-index'] || !auditResults['total-blocking-time']) {
            log.info('One or multiple required metrics couldn\'t be found, setting performance score to: null')
            return null
        }

        const scores = defaultConfig.categories.performance.auditRefs.filter((auditRef: AuditRef) => auditRef.weight).map((auditRef: AuditRef) => ({
            score: auditResults[auditRef.id].score,
            weight: auditRef.weight,
        }))
        return ReportScoring.arithmeticMean(scores)
    }
}
