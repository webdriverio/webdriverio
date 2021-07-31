import { expectType } from 'tsd'

async function bar() {
    browser.enablePerformanceAudits()
    browser.enablePerformanceAudits({
        networkThrottling: 'online',
        cpuThrottling: 0,
        cacheEnabled: false,
        formFactor: 'desktop'
    })
    browser.disablePerformanceAudits()

    const metrics = await browser.getMetrics()
    expectType<number>(metrics.estimatedInputLatency)

    const diagnostics = await browser.getDiagnostics()
    const mainThreadWorkBreakdown = await browser.getMainThreadWorkBreakdown()
    expectType<number>(mainThreadWorkBreakdown[0].duration)

    const performanceScore: number = await browser.getPerformanceScore()
    expectType<number>(performanceScore)

    const pwaCheck = await browser.checkPWA()
    pwaCheck.passed
    expectType<number>(pwaCheck.details['foo'].score)

    const pwaFilterdCheck = await browser.checkPWA(['maskableIcon', 'isInstallable'])
    expectType<boolean>(pwaFilterdCheck.passed)

    browser.emulateDevice('iPad')
    browser.emulateDevice({ viewport: { height: 10, width: 10 }, userAgent: 'test' })

    const cdpResponse = await browser.cdp('test', 'test')
    expectType<number>(await browser.getNodeId('selector'))
    expectType<number[]>(await browser.getNodeIds('selector'))

    browser.startTracing()
    browser.startTracing({ path: '/foo' })
    browser.endTracing()

    const traceLogs = await browser.getTraceLogs()
    expectType<string>(traceLogs[0].cat)

    const pageWeight = await browser.getPageWeight()
    expectType<number>(pageWeight.requestCount)

    const coverage = await browser.getCoverageReport()
    expectType<number>(coverage.lines.total)
}
