import { expectType } from 'tsd'

browser.enablePerformanceAudits()
browser.enablePerformanceAudits({
    networkThrottling: 'online',
    cpuThrottling: 0,
    cacheEnabled: false,
    formFactor: 'desktop'
})
browser.disablePerformanceAudits()

const metrics = browser.getMetrics()
expectType<number>(metrics.estimatedInputLatency)
expectType<number>(metrics.maxPotentialFID)

const diagnostics = browser.getDiagnostics()
const mainThreadWorkBreakdown = browser.getMainThreadWorkBreakdown()
expectType<number>(mainThreadWorkBreakdown[0].duration)

const performanceScore: number = browser.getPerformanceScore()
expectType<number>(performanceScore)

const pwaCheck = browser.checkPWA()
pwaCheck.passed
expectType<number>(pwaCheck.details['foo'].score)

const pwaFilterdCheck = browser.checkPWA(['maskableIcon', 'isInstallable'])
expectType<boolean>(pwaFilterdCheck.passed)

browser.emulateDevice('iPad')
browser.emulateDevice({ viewport: { height: 10, width: 10 }, userAgent: 'test' })

const cdpResponse = browser.cdp('test', 'test')
expectType<number>(browser.getNodeId('selector'))
expectType<number[]>(browser.getNodeIds('selector'))

browser.startTracing()
browser.startTracing({ path: '/foo' })
browser.endTracing()

const traceLogs = browser.getTraceLogs()
expectType<string>(traceLogs[0].cat)

const pageWeight = browser.getPageWeight()
expectType<number>(pageWeight.requestCount)

const coverage = browser.getCoverageReport()
expectType<number>(coverage.lines.total)
