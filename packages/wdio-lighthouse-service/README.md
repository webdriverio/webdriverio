WebdriverIO Lighthouse Service
==============================

> A WebdriverIO service that allows you to run accessibility and performance tests with [Google Lighthouse](https://developer.chrome.com/docs/lighthouse/overview).

**Note:** this service currently only supports tests running on Google Chrome or Chromium! Given that most cloud vendors don't expose access to the Chrome DevTools Protocol this service also usually only works when running tests locally or through a [Selenium Grid](https://www.selenium.dev/documentation/grid/) v4 or higher.

## Installation

The easiest way is to keep `@wdio/lighthouse-service` as a dev dependency in your `package.json`, via:

```sh
npm install @wdio/lighthouse-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted).

## Configuration

In order to use the service you just need to add the service to your service list in your `wdio.conf.js`, like:

```js
// wdio.conf.js
export const config = {
    // ...
    services: ['lighthouse'],
    // ...
};
```

## Usage

The `@wdio/lighthouse-service` allows you to run Google Lighthouse accessibility and performance tests through WebdriverIO.

### Performance Testing

The Lighthouse service allows you to capture performance data from every page load or page transition that was caused by a click. To enable it call `browser.enablePerformanceAudits(<options>)`. After you are done capturing all necessary performance data disable it to revert the throttling settings, e.g.:

```js
import assert from 'node:assert'

describe('JSON.org page', () => {
    before(async () => {
        await browser.enablePerformanceAudits()
    })

    it('should load within performance budget', async () => {
        /**
         * this page load will take a bit longer as the DevTools service will
         * capture all metrics in the background
         */
        await browser.url('http://json.org')

        let metrics = await browser.getMetrics()
        assert.ok(metrics.speedIndex < 1500) // check that speedIndex is below 1.5ms

        let score = await browser.getPerformanceScore() // get Lighthouse Performance score
        assert.ok(score >= .99) // Lighthouse Performance score is at 99% or higher

        $('=Esperanto').click()

        metrics = await browser.getMetrics()
        assert.ok(metrics.speedIndex < 1500)
        score = await browser.getPerformanceScore()
        assert.ok(score >= .99)
    })

    after(async () => {
        await browser.disablePerformanceAudits()
    })
})
```

The following commands with their results are available:

#### `getMetrics`

Gets the most commonly used performance metrics, e.g.:

```js
console.log(await browser.getMetrics())
/**
 * { timeToFirstByte: 566,
 *   serverResponseTime: 566,
 *   domContentLoaded: 3397,
 *   firstVisualChange: 2610,
 *   firstPaint: 2822,
 *   firstContentfulPaint: 2822,
 *   firstMeaningfulPaint: 2822,
 *   largestContentfulPaint: 2822,
 *   lastVisualChange: 15572,
 *   interactive: 6135,
 *   load: 8429,
 *   speedIndex: 3259,
 *   totalBlockingTime: 31,
 *   maxPotentialFID: 161,
 *   cumulativeLayoutShift: 2822 }
 */
```

#### `getDiagnostics`

Get some useful diagnostics about the page load.

```js
console.log(await browser.getDiagnostics())
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

Returns a list with a breakdown of all main thread tasks and their total duration.

```js
console.log(await browser.getMainThreadWorkBreakdown())
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

Returns the [Lighthouse Performance Score](https://developers.google.com/web/tools/lighthouse/scoring) which is a weighted mean of the following metrics: `firstContentfulPaint`, `speedIndex`, `largestContentfulPaint`, `cumulativeLayoutShift`, `totalBlockingTime`, `interactive`, `maxPotentialFID` or `cumulativeLayoutShift`.

```js
console.log(await browser.getPerformanceScore())
/**
 * 0.897826278457836
 */
```

#### enablePerformanceAudits

Enables auto performance audits for all page loads that are caused by calling the `url` command or clicking on a link or anything that causes a page load. You can pass in a config object to determine some throttling options. The default throttling profile is `Good 3G` network with a 4x CPU throttling.

```js
await browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cpuThrottling: 4,
    cacheEnabled: true,
    formFactor: 'mobile'
})
```

The following network throttling profiles are available: `offline`, `GPRS`, `Regular 2G`, `Good 2G`, `Regular 3G`, `Good 3G`, `Regular 4G`, `DSL`, `Wifi` and `online` (no throttling).

### PWA Testing

With the `checkPWA` command, you can validate if your web app is compliant to the latest web standards when it comes to progressive web apps. It checks:

- whether your app is installable
- provides a service worker
- has a splash screen
- provides Apple Touch and Maskable Icons
- can be served on mobile devices

If you are not interested in one of these checks you can pass in a list of checks you like to run. The `passed` property will return `true` if all checks pass. If they fail you can use the `details` property to enrich your failure message with details of the failure.

```js
// open page first
await browser.url('https://webdriver.io')
// validate PWA
const result = await browser.checkPWA()
expect(result.passed).toBe(true)
```

### `startTracing(categories, samplingFrequency)` Command

Start tracing the browser. You can optionally pass in custom tracing categories (defaults to [this list](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-lighthouse-service/src/constants.ts#L12-L56)) and the sampling frequency (defaults to `10000`).

```js
await browser.startTracing()
```

### `endTracing` Command

Stop tracing the browser.

```js
await browser.endTracing()
```

### `getTraceLogs` Command

Returns the trace-logs that were captured within the tracing period. You can use this command to store the trace logs on the file system to analyse the trace via Chrome DevTools interface.

```js
import fs from 'node:fs/promises'

await browser.startTracing()
await browser.url('http://json.org')
await browser.endTracing()

await fs.writeFile('/path/to/tracelog.json', JSON.stringify(browser.getTraceLogs()))
```

### `getPageWeight` Command

Returns page weight information of the last page load.

```js
await browser.startTracing()
await browser.url('https://webdriver.io')
await browser.endTracing()

console.log(await browser.getPageWeight())
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

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
