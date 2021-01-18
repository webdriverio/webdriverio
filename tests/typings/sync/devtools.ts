// async function bar() {
//     browser.enablePerformanceAudits()
//     browser.enablePerformanceAudits({
//         networkThrottling: 'online',
//         cpuThrottling: 0,
//         cacheEnabled: false,
//         formFactor: 'desktop'
//     })
//     browser.disablePerformanceAudits()

//     const metrics = await browser.getMetrics()
//     metrics.estimatedInputLatency.toFixed()

//     const diagnostics = await browser.getDiagnostics()
//     const mainThreadWorkBreakdown = await browser.getMainThreadWorkBreakdown()
//     mainThreadWorkBreakdown[0].duration.toFixed()

//     const performanceScore: number = await browser.getPerformanceScore()
//     performanceScore.toFixed()

//     const pwaCheck = await browser.checkPWA()
//     pwaCheck.passed
//     pwaCheck.details['foo'].score.toFixed()

//     const pwaFilterdCheck = await browser.checkPWA(['maskableIcon', 'isInstallable'])

//     browser.emulateDevice('iPad')
//     browser.emulateDevice({ viewport: { height: 10, width: 10 }, userAgent: 'test' })

//     const cdpResponse = await browser.cdp('test', 'test')
//     const nodeId: number = await browser.getNodeId('selector')
//     const nodeIds: number[] = await browser.getNodeIds('selector')

//     browser.startTracing()
//     browser.startTracing({ path: '/foo' })
//     browser.endTracing()

//     const traceLogs = await browser.getTraceLogs()
//     traceLogs[0].cat.indexOf('foo')

//     const pageWeight = await browser.getPageWeight()
//     pageWeight.requestCount.toFixed()

//     const coverage = await browser.getCoverageReport()
//     coverage.lines.total.toFixed(2)
// }
