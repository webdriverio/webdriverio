import Diagnostics from 'lighthouse/lighthouse-core/audits/diagnostics.js'
import MainThreadWorkBreakdown from 'lighthouse/lighthouse-core/audits/mainthread-work-breakdown.js'
import Metrics from 'lighthouse/lighthouse-core/audits/metrics.js'
import ServerResponseTime from 'lighthouse/lighthouse-core/audits/server-response-time.js'
import CumulativeLayoutShift from 'lighthouse/lighthouse-core/audits/metrics/cumulative-layout-shift.js'
import FirstContentfulPaint from 'lighthouse/lighthouse-core/audits/metrics/first-contentful-paint.js'
import LargestContentfulPaint from 'lighthouse/lighthouse-core/audits/metrics/largest-contentful-paint.js'
import SpeedIndex from 'lighthouse/lighthouse-core/audits/metrics/speed-index.js'
import InteractiveMetric from 'lighthouse/lighthouse-core/audits/metrics/interactive.js'
import TotalBlockingTime from 'lighthouse/lighthouse-core/audits/metrics/total-blocking-time.js'

import ReportScoring from 'lighthouse/lighthouse-core/scoring.js'
import defaultConfig from 'lighthouse/lighthouse-core/config/default-config.js'
import logger from '@wdio/logger'
import type { CustomInstanceCommands } from 'webdriverio'

import { DEFAULT_FORM_FACTOR, PWA_AUDITS } from './constants.js'
import type {
    FormFactor, Audit, AuditResults, AuditRef, MainThreadWorkBreakdownResult,
    DiagnosticsResults, ResponseTimeResult, MetricsResult, MetricsResults,
    AuditResult, LHAuditResult, ErrorAudit, PWAAudits
} from './types.js'
import type { Trace } from './gatherer/trace.js'
import type { CDPSessionOnMessageObject } from './gatherer/devtools.js'

const log = logger('@wdio/lighthouse-service:Auditor')

type RunAuditResult = [string, LHAuditResult | ErrorAudit]

export default class Auditor {
    private _url?: string

    constructor (
        private _traceLogs?: Trace,
        private _devtoolsLogs?: CDPSessionOnMessageObject[],
        private _formFactor?: FormFactor
    ) {
        if (_traceLogs) {
            this._url = _traceLogs.pageUrl
        }
    }

    _audit (AUDIT: Audit, params = {}): Promise<LHAuditResult> | ErrorAudit {
        const auditContext = {
            options: {
                ...AUDIT.defaultOptions
            },
            settings: {
                throttlingMethod: 'devtools',
                formFactor: this._formFactor || DEFAULT_FORM_FACTOR
            },
            LighthouseRunWarnings: false,
            computedCache: new Map()
        }

        try {
            return AUDIT.audit({
                traces: { defaultPass: this._traceLogs },
                devtoolsLogs: { defaultPass: this._devtoolsLogs },
                TestedAsMobileDevice: true,
                GatherContext: { gatherMode: 'navigation' },
                ...params
            }, auditContext)
        } catch (error: any) {
            log.error(error)
            return {
                score: 0,
                error
            }
        }
    }

    /**
     * an Auditor instance is created for every trace so provide an updateCommands
     * function to receive the latest performance metrics with the browser instance
     */
    updateCommands (browser: WebdriverIO.Browser, customFn?: CustomInstanceCommands<WebdriverIO.Browser>['addCommand']) {
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && fnName !== 'updateCommands' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(fnName, customFn || (this[fnName as keyof Auditor] as any).bind(this)))
    }

    /**
     * Returns a list with a breakdown of all main thread task and their total duration
     */
    async getMainThreadWorkBreakdown () {
        const result = await this._audit(MainThreadWorkBreakdown) as MainThreadWorkBreakdownResult
        return result.details.items.map(
            ({ group, duration }) => ({ group, duration })
        )
    }

    /**
     * Get some useful diagnostics about the page load
     */
    async getDiagnostics () {
        const result = await this._audit(Diagnostics) as DiagnosticsResults

        /**
         * return null if Audit fails
         */
        if (!Object.prototype.hasOwnProperty.call(result, 'details')) {
            return null
        }

        return result.details.items[0]
    }

    /**
     * Get most common used performance metrics
     */
    async getMetrics () {
        const serverResponseTime = await this._audit(ServerResponseTime, { URL: this._url }) as ResponseTimeResult
        const cumulativeLayoutShift = await this._audit(CumulativeLayoutShift) as ResponseTimeResult
        const result = await this._audit(Metrics) as MetricsResults
        const metrics = result.details.items[0] || {}
        return {
            timeToFirstByte: Math.round(serverResponseTime.numericValue),
            serverResponseTime: Math.round(serverResponseTime.numericValue),
            domContentLoaded: metrics.observedDomContentLoaded,
            firstVisualChange: metrics.observedFirstVisualChange,
            firstPaint: metrics.observedFirstPaint,
            firstContentfulPaint: metrics.firstContentfulPaint,
            firstMeaningfulPaint: metrics.firstMeaningfulPaint,
            largestContentfulPaint: metrics.largestContentfulPaint,
            lastVisualChange: metrics.observedLastVisualChange,
            interactive: metrics.interactive,
            load: metrics.observedLoad,
            speedIndex: metrics.speedIndex,
            totalBlockingTime: metrics.totalBlockingTime,
            maxPotentialFID: metrics.maxPotentialFID,
            cumulativeLayoutShift: cumulativeLayoutShift.numericValue,
        }
    }

    /**
     * Returns the Lighthouse Performance Score which is a weighted mean of the following metrics: firstMeaningfulPaint, interactive, speedIndex
     */
    async getPerformanceScore () {
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

    async _auditPWA (
        params: any,
        auditsToBeRun = Object.keys(PWA_AUDITS) as PWAAudits[]
    ): Promise<AuditResult> {
        const audits: RunAuditResult[] = await Promise.all(
            Object.entries(PWA_AUDITS)
                .filter(([name]) => auditsToBeRun.includes(name as PWAAudits))
                .map<Promise<RunAuditResult>>(
                    async ([name, Audit]) => [name, await this._audit(Audit, params)]
                )
        )
        return {
            passed: !audits.find(([, result]) => result.score < 1),
            details: audits.reduce((details, [name, result]) => {
                details[name] = result
                return details
            }, {} as Record<string, LHAuditResult>)
        }
    }
}
