WebdriverIO DevTools Service
============================

> A WebdriverIO service that allows you to run Chrome DevTools commands in your tests

With Chrome v63 and up the browser [started to support](https://developers.google.com/web/updates/2017/10/devtools-release-notes#multi-client) multi clients allowing arbitrary clients to access the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). This provides interesting opportunities to automate Chrome beyond the [WebDriver protocol](https://www.w3.org/TR/webdriver/). With this service you can enhance the wdio browser object to leverage that access and call Chrome DevTools commands within your tests to e.g. intercept requests, throttle network capabilities or take CSS/JS coverage.

__Note:__ this service currently only supports Chrome v63 and up!

## Installation

The easiest way is to keep `@wdio/devtools-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/devtools-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/devtools-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you just need to add the service to your service list in your `wdio.conf.js` like:

```js
// wdio.conf.js
export.config = {
  // ...
  services: [['devtools', {
      debuggerAddress: '10.0.0.3:9222'
  }]],
  // ...
};
```
- `debuggerAddress` - optional parameter, you could set host and port.

## Usage

The `@wdio/devtools-service` offers you a variety of features that helps you to automate Chrome beyond the WebDriver protocol. It gives you access to the Chrome DevTools protocol as well as to a [Puppeteer](https://pptr.dev/) instance that you can use to automate Chrome with the Puppeteer automation interface.

### Performance Testing

The DevTools service allows you to capture performance data from every page load or page transition that was caused by a click. To enable it call `browser.enablePerformanceAudits(<options>)`. After you are done capturing all necessary performance data disable it to revert the throttling settings, e.g.:

```js
const assert = require('assert')

describe('JSON.org page', () => {
    before(() => {
        browser.enablePerformanceAudits()
    })

    it('should load within performance budget', () => {

        browser.url('http://json.org')

        let metrics = browser.getMetrics()
        assert.ok(metrics.speedIndex < 1500) // check that speedIndex is below 1.5ms

        let score = browser.getPerformanceScore() // get Lighthouse Performance score
        assert.ok(score >= .99) // Lighthouse Performance score is at 99% or higher

        $('=Esperanto').click()

        metrics = browser.getMetrics()
        assert.ok(metrics.speedIndex < 1500)
        score = browser.getPerformanceScore()
        assert.ok(score >= .99)
    })

    after(() => {
        browser.disablePerformanceAudits()
    })
})
```

The following commands with their results are available:

#### getMetrics

Get most common used performance metrics.

```js
console.log(browser.getMetrics())
/**
 * { load: 355,
 *   speedIndex: 281,
 *   firstInteractive: 366,
 *   firstVisualChange: 264,
 *   lastVisualChange: 389,
 *   firstMeaningfulPaint: 263,
 *   firstCPUIdle: 366,
 *   timeToFirstByte: 16,
 *   firstPaint: 263,
 *   estimatedInputLatency: 16,
 *   firstContentfulPaint: 263,
 *   score: 0.9999913442537731,
 *   domContentLoaded: 346 }
 */
```

#### getDiagnostics

Get some useful diagnostics about the page load.

```js
console.log(browser.getDiagnostics())
/**
 * { numRequests: 8,
 *   numScripts: 0,
 *   numStylesheets: 0,
 *   numFonts: 0,
 *   numTasks: 237,
 *   numTasksOver10ms: 5,
 *   numTasksOver25ms: 2,
 *   numTasksOver50ms: 2,
 *   numTasksOver100ms: 0,
 *   numTasksOver500ms: 0,
 *   rtt: 147.20600000000002,
 *   throughput: 47729.68474448835,
 *   maxRtt: 176.085,
 *   maxServerLatency: 1016.813,
 *   totalByteWeight: 62929,
 *   totalTaskTime: 254.07899999999978,
 *   mainDocumentTransferSize: 8023 }
 */
```

#### getMainThreadWorkBreakdown

Returns a list with a breakdown of all main thread task and their total duration.

```js
console.log(browser.getMainThreadWorkBreakdown())
/**
 * [ { group: 'styleLayout', duration: 130.59099999999998 },
 *   { group: 'other', duration: 44.819 },
 *   { group: 'paintCompositeRender', duration: 13.732000000000005 },
 *   { group: 'parseHTML', duration: 3.9080000000000004 },
 *   { group: 'scriptEvaluation', duration: 2.437999999999999 },
 *   { group: 'scriptParseCompile', duration: 0.20800000000000002 } ]
 */
```

#### getPerformanceScore

Returns the [Lighthouse Performance Score](https://developers.google.com/web/tools/lighthouse/scoring) which is a weighted mean of the following metrics: `firstMeaningfulPaint`, `firstCPUIdle`, `firstInteractive`, `speedIndex`, `estimatedInputLatency`.

```js
console.log(browser.getPerformanceScore())
/**
 * 0.897826278457836
 */
```

#### enablePerformanceAudits

Enables auto performance audits for all page loads that are cause by calling the `url` command or clicking on a link or anything that causes a page load. You can pass in a config object to determine some throttling options. The default throttling profile is `Good 3G` network with a 4x CPU trottling.

```js
browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cpuThrottling: 4,
    cacheEnabled: true
})
```

The following network throttling profiles are available: `offline`, `GPRS`, `Regular 2G`, `Good 2G`, `Regular 3G`, `Good 3G`, `Regular 4G`, `DSL`, `Wifi` and `online` (no throttling).

### Chrome DevTools Access

For now the service allows two different ways to access the Chrome DevTools Protocol:

### `cdp` Command

The `cdp` command is a custom command added to the browser scope that allows you to call directly commands to the protocol.

```js
browser.cdp(<domain>, <command>, <arguments>)
```

For example if you want to get the JavaScript coverage of your page you can do the following:

```js
it('should take JS coverage', () => {
    /**
     * enable necessary domains
     */
    browser.cdp('Profiler', 'enable')
    browser.cdp('Debugger', 'enable')

    /**
     * start test coverage profiler
     */
    browser.cdp('Profiler', 'startPreciseCoverage', {
        callCount: true,
        detailed: true
    })

    browser.url('http://google.com')

    /**
     * capture test coverage
     */
    const { result } = browser.cdp('Profiler', 'takePreciseCoverage')
    const coverage = result.filter((res) => res.url !== '')
    console.log(coverage)
})
```

### `cdpConnection` Command

Returns the host and port the Chrome DevTools interface is connected to.

```js
const connection = browser.cdpConnection()
console.log(connection);  // outputs: { host: 'localhost', port: 50700 }
```

### `getNodeId(selector)` and `getNodeIds(selector)` Command

Helper method to get the nodeId of an element in the page. NodeIds are similar like WebDriver node ids an identifier for a node. It can be used as a parameter for other Chrome DevTools methods, e.g. `DOM.focus`.

```js
const nodeId = browser.getNodeId('body')
console.log(nodeId) // outputs: 4
const nodeId = browser.getNodeIds('img')
console.log(nodeId) // outputs: [ 40, 41, 42, 43, 44, 45 ]
```

### `startTracing(categories, samplingFrequency)` Command

Start tracing the browser. You can optionally pass in custom tracing categories (defaults to [this list](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-devtools-service/src/constants.js#L1-L9)) and the sampling frequency (defaults to `10000`).

```js
browser.startTracing()
```

### `endTracing` Command

Stop tracing the browser.

```js
browser.endTracing()
```

### `getTraceLogs` Command

Returns the tracelogs that was captured within the tracing period. You can use this command to store the trace logs on the file system to analyse the trace via Chrome DevTools interface.

```js
browser.startTracing()
browser.url('http://json.org')
browser.endTracing()

fs.writeFileSync('/path/to/tracelog.json', JSON.stringify(browser.getTraceLogs()))
```

### `getPageWeight` Command

Returns page weight information of the last page load.

```js
browser.startTracing()
browser.url('https://webdriver.io')
browser.endTracing()

console.log(browser.getPageWeight())
// outputs:
// { pageWeight: 2438485,
//   transferred: 1139136,
//   requestCount: 72,
//   details: {
//       Document: { size: 221705, encoded: 85386, count: 11 },
//       Stylesheet: { size: 52712, encoded: 50130, count: 2 },
//       Image: { size: 495023, encoded: 482433, count: 36 },
//       Script: { size: 1073597, encoded: 322854, count: 15 },
//       Font: { size: 84412, encoded: 84412, count: 5 },
//       Other: { size: 1790, encoded: 1790, count: 2 },
//       XHR: { size: 509246, encoded: 112131, count: 1 } }
// }
```

### Access Puppeteer Instance

The service uses Puppeteer for its automation under the hood. You can get access to the used instance by calling the `getPuppeteer` command. __Note:__ Puppeteer commands are async and either needs to be called within the `call` command or handled via `async/await`:

```js
describe('use Puppeteer', () => {
    it('by wrapping commands with call', () => {
        browser.url('http://json.org')

        const puppeteer = browser.getPuppeteer()
        const page = browser.call(() => puppeteer.browser.pages())[0]
        console.log(browser.call(() => page.title()))
    })

    it('by using async/await', async () => {
        const puppeteer = browser.getPuppeteer()
        const page = (await puppeteer.browser.pages())[0]
        console.log(await page.title())
    })
})
```

### Event Listener

In order to capture events in the browser you can register an event listener to a Chrome DevTools event like:

```js
it('should listen on network events', () => {
    browser.cdp('Network', 'enable')
    browser.on('Network.responseReceived', (params) => {
        console.log(`Loaded ${params.response.url}`)
    })
    browser.url('https://www.google.com')
})
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
