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

const log = logger('@wdio/devtools-service:Auditor')

const SHARED_AUDIT_CONTEXT = {
    settings: { throttlingMethod: 'devtools' },
    LighthouseRunWarnings: false,
    computedCache: new Map()
}

export default class Auditor {
    constructor(traceLogs, devtoolsLogs) {
        this.devtoolsLogs = devtoolsLogs
        this.traceLogs = traceLogs
        this.url = traceLogs.pageUrl
        this.loaderId = traceLogs.loaderId
    }

    _audit(AUDIT, params = {}) {
        const auditContext = {
            options: { ...AUDIT.defaultOptions },
            ...SHARED_AUDIT_CONTEXT
        }

        try {
            return AUDIT.audit({
                traces: { defaultPass: this.traceLogs },
                devtoolsLogs: { defaultPass: this.devtoolsLogs },
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
    updateCommands(browser, customFn) {
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && fnName !== 'updateCommands' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(fnName, customFn || this[fnName].bind(this)))
    }

    async getMainThreadWorkBreakdown() {
        const result = await this._audit(MainThreadWorkBreakdown)
        return result.details.items.map(
            ({ group, duration }) => ({ group, duration })
        )
    }

    async getDiagnostics() {
        const result = await this._audit(Diagnostics)

        /**
         * return null if Audit fails
         */
        if (!Object.prototype.hasOwnProperty.call(result, 'details')) {
            return null
        }

        return result.details.items[0]
    }

    async getMetrics () {
        const serverResponseTime = await this._audit(ServerResponseTime, { URL: this.url })
        const cumulativeLayoutShift = await this._audit(CumulativeLayoutShift)
        const result = await this._audit(Metrics)
        const metrics = result.details.items[0] || {}
        return {
            estimatedInputLatency: metrics.estimatedInputLatency,
            /**
             * keeping TTFB for backwards compatibility
             */
            timeToFirstByte: Math.round(serverResponseTime.numericValue, 10),
            serverResponseTime: Math.round(serverResponseTime.numericValue, 10),
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
        const auditResults = {}
        auditResults['speed-index'] =  await this._audit(SpeedIndex)
        auditResults['first-contentful-paint'] =  await this._audit(FirstContentfulPaint)
        auditResults['largest-contentful-paint'] =  await this._audit(LargestContentfulPaint)
        auditResults['cumulative-layout-shift'] =  await this._audit(CumulativeLayoutShift)
        auditResults['total-blocking-time'] =  await this._audit(TotalBlockingTime)
        auditResults.interactive = await this._audit(InteractiveMetric)

        if (!auditResults.interactive || !auditResults['cumulative-layout-shift'] || !auditResults['first-contentful-paint'] ||
            !auditResults['largest-contentful-paint'] || !auditResults['speed-index'] || !auditResults['total-blocking-time']) {
            log.info('One or multiple required metrics couldn\'t be found, setting performance score to: null')
            return null
        }

        const scores = defaultConfig.categories.performance.auditRefs.filter((auditRef) => auditRef.weight).map((auditRef) => ({
            score: auditResults[auditRef.id].score,
            weight: auditRef.weight,
        }))
        return ReportScoring.arithmeticMean(scores)
    }
}
