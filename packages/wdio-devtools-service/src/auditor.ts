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

// PWA
import InstallableManifest from 'lighthouse/lighthouse-core/audits/installable-manifest'
import ServiceWorker from 'lighthouse/lighthouse-core/audits/service-worker'
import SplashScreen from 'lighthouse/lighthouse-core/audits/splash-screen'
import ThemedOmnibox from 'lighthouse/lighthouse-core/audits/themed-omnibox'
import ContentWidth from 'lighthouse/lighthouse-core/audits/content-width'
import Viewport from 'lighthouse/lighthouse-core/audits/viewport'
import AppleTouchIcon from 'lighthouse/lighthouse-core/audits/apple-touch-icon'
import MaskableIcon from 'lighthouse/lighthouse-core/audits/maskable-icon'

import ReportScoring from 'lighthouse/lighthouse-core/scoring'
import defaultConfig from 'lighthouse/lighthouse-core/config/default-config'
import logger from '@wdio/logger'

import { DEFAULT_FORM_FACTOR } from './constants'
import type {
    FormFactor, Audit, AuditResults, AuditRef, MainThreadWorkBreakdownResult,
    DiagnosticsResults, ResponseTimeResult, MetricsResult, MetricsResults,
    AuditResult, LHAuditResult, ErrorAudit
} from './types'
import type { Trace } from './gatherer/trace'
import type { CDPSessionOnMessageObject } from './gatherer/devtools'

const log = logger('@wdio/devtools-service:Auditor')

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
                ...params
            }, auditContext)
        } catch (error) {
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
    updateCommands (browser: WebdriverIO.BrowserObject, customFn?: WebdriverIO.AddCommandFn) {
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && fnName !== 'updateCommands' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(fnName, customFn || (this[fnName as keyof Auditor] as any).bind(this)))
    }

    async getMainThreadWorkBreakdown () {
        const result = await this._audit(MainThreadWorkBreakdown) as MainThreadWorkBreakdownResult
        return result.details.items.map(
            ({ group, duration }) => ({ group, duration })
        )
    }

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

    async _auditPWA (params: any): Promise<AuditResult> {
        const audits: [string, LHAuditResult | ErrorAudit][] = await Promise.all([
            ['isInstallable', await this._audit(InstallableManifest, params)],
            ['serviceWorker', await this._audit(ServiceWorker, params)],
            ['splashScreen', await this._audit(SplashScreen, params)],
            ['themedOmnibox', await this._audit(ThemedOmnibox, params)],
            ['contentWith', await this._audit(ContentWidth, params)],
            ['viewport', await this._audit(Viewport, params)],
            ['appleTouchIcon', await this._audit(AppleTouchIcon, params)],
            ['maskableIcon', await this._audit(MaskableIcon, params)]
        ])
        return {
            passed: !audits.find(([, result]) => result.score < 1),
            details: audits.reduce((details, [name, result]) => {
                details[name] = result
                return details
            }, {} as Record<string, LHAuditResult>)
        }
    }
}
