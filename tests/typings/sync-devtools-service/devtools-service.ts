const config: WebdriverIO.Config = {
  services: [
    ['devtools', {
      debuggerAddress: 'localhost:24563'
    }]
  ]
}

browser.enablePerformanceAudits()
browser.enablePerformanceAudits({
  networkThrottling: 'online',
  cpuThrottling: 0,
  cacheEnabled: false
})
browser.disablePerformanceAudits()

const metrics: object = browser.getMetrics()
const diagnostics: object = browser.getDiagnostics()
const mainThreadWorkBreakdown: object[] = browser.getMainThreadWorkBreakdown()
const performanceScore: number = browser.getPerformanceScore()

browser.emulateDevice('iPad')
browser.emulateDevice({ viewport: { height: 10, width: 10 }, userAgent: 'test' })

const cdpResponse = browser.cdp('test', 'test')
const { host, port } = browser.cdpConnection()

const nodeId: number = browser.getNodeId('selector')
const nodeIds: number[] = browser.getNodeIds('selector')

browser.startTracing()
browser.startTracing('test', 1)
browser.endTracing()

const traceLogs: object = browser.getTraceLogs()
const pageWeight: object = browser.getPageWeight()

const puppeteer = browser.getPuppeteer()