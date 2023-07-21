WebdriverIO DevTools Service
============================

> A WebdriverIO service that allows you to run Chrome DevTools commands in your tests

With Chrome v63 and up the browser [started to support](https://developers.google.com/web/updates/2017/10/devtools-release-notes#multi-client) multi clients allowing arbitrary clients to access the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). This provides interesting opportunities to automate Chrome beyond the [WebDriver protocol](https://www.w3.org/TR/webdriver/). With this service you can enhance the wdio browser object to leverage that access and call Chrome DevTools commands within your tests to e.g. intercept requests, throttle network capabilities or take CSS/JS coverage.

Since Firefox 86, [a subset of Chrome DevTools Protocol](https://firefox-source-docs.mozilla.org/remote/index.html) has been implemented by passing the capability `"moz:debuggerAddress": true`.

**Note:** this service currently only supports Chrome v63 and up, Chromium, and Firefox 86 and up! Given that cloud vendors don't expose access to the Chrome DevTools Protocol this service also usually only works when running tests locally or through a [Selenium Grid](https://www.selenium.dev/documentation/grid/) v4 or higher.

## Installation

The easiest way is to keep `@wdio/devtools-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/devtools-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

In order to use the service you just need to add the service to your service list in your `wdio.conf.js`, like:

```js
// wdio.conf.js
export const config = {
    // ...
    services: ['devtools'],
    // ...
};
```

## Usage

The `@wdio/devtools-service` offers you a variety of features that helps you to automate Chrome beyond the WebDriver protocol. It gives you access to the Chrome DevTools protocol as well as to a [Puppeteer](https://pptr.dev/) instance that you can use to automate Chrome with the Puppeteer automation interface.

### Performance Testing

The DevTools service allows you to capture performance data from every page load or page transition that was caused by a click. To enable it call `browser.enablePerformanceAudits(<options>)`. After you are done capturing all necessary performance data disable it to revert the throttling settings, e.g.:

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

You can emulate a mobile device by using the `emulateDevice` command, throttling CPU and network as well as setting `mobile` as form factor:

```js
await browser.emulateDevice('iPhone X')
await browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cpuThrottling: 4,
    formFactor: 'mobile'
})
```

The following commands with their results are available:

#### getMetrics

Get most common used performance metrics.

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

#### getDiagnostics

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

Returns a list with a breakdown of all main thread task and their total duration.

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

Enables auto performance audits for all page loads that are cause by calling the `url` command or clicking on a link or anything that causes a page load. You can pass in a config object to determine some throttling options. The default throttling profile is `Good 3G` network with a 4x CPU trottling.

```js
await browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cpuThrottling: 4,
    cacheEnabled: true,
    formFactor: 'mobile'
})
```

The following network throttling profiles are available: `offline`, `GPRS`, `Regular 2G`, `Good 2G`, `Regular 3G`, `Good 3G`, `Regular 4G`, `DSL`, `Wifi` and `online` (no throttling).

### Device Emulation

The service allows you to emulate a specific device type. If set, the browser viewport will be modified to fit the device capabilities as well as the user agent will set according to the device user agent. To set a predefined device profile you can run:

```js
await browser.emulateDevice('iPhone X')
// or `browser.emulateDevice('iPhone X', true)` if you want to be in landscape mode
```

Available predefined device profiles are: `Blackberry PlayBook`, `BlackBerry Z30`, `Galaxy Note 3`, `Galaxy Note II`, `Galaxy S III`, `Galaxy S5`, `iPad`, `iPad Mini`, `iPad Pro`, `iPhone 4`, `iPhone 5`, `iPhone 6`, `iPhone 6 Plus`, `iPhone 7`, `iPhone 7 Plus`, `iPhone 8`, `iPhone 8 Plus`, `iPhone SE`, `iPhone X`, `JioPhone 2`,
`Kindle Fire HDX`, `LG Optimus L70`, `Microsoft Lumia 550`, `Microsoft Lumia 950`, `Nexus 10`, `Nexus 4`, `Nexus 5`, `Nexus 5X`, `Nexus 6`, `Nexus 6P`, `Nexus 7`, `Nokia Lumia 520`, `Nokia N9`, `Pixel 2`, `Pixel 2 XL`

You can also define your own device profile by providing an object as parameter like in the following example:

```js
await browser.emulateDevice({
    viewport: {
        width: 550, // <number> page width in pixels.
        height: 300, // <number> page height in pixels.
        deviceScaleFactor: 1, //  <number> Specify device scale factor (can be thought of as dpr). Defaults to 1
        isMobile: true, // <boolean> Whether the meta viewport tag is taken into account. Defaults to false
        hasTouch: true, // <boolean> Specifies if viewport supports touch events. Defaults to false
        isLandscape: true // <boolean> Specifies if viewport is in landscape mode. Defaults to false
    },
    userAgent: 'my custom user agent'
})
```

#### Note

This only works if you don't use `mobileEmulation` within `capabilities['goog:chromeOptions']`.
If `mobileEmulation` is present the call to `browser.emulateDevice()` won't do anything.

### PWA Testing

With the `checkPWA` command you can validate if your webapp is compliant to latest web standards when it comes to progressive web apps. It checks:

- whether your app is installable
- provides a service worker
- has a splash screen
- provides apple touch and maskable icons
- can be served on mobile devices

If you are not interested in one of these checks you can pass in a list of checks you like to run. The `passed` property will return `true` if all checks pass. If they fail you can use the `details` property to enrich your failure message with details of the failure.

```js
// open page first
await browser.url('https://webdriver.io')
// validate PWA
const result = await browser.checkPWA()
expect(result.passed).toBe(true)
```

### Capture Code Coverage

The service offers you to capture the code coverage of your application under test. To do so you need to enable this feature as part of the service settings:

```js
// wdio.conf.js
services: [
    ['devtools', {
        coverageReporter: {
            enable: true,
            type: 'html', // lcov, json, text
            logDir: __dirname + '/coverage',
            exclude: [/resources/]
        }
    }]
]
```

Then you have access to a command that calculates the ratio of covered code lines and branches for you to assert within your test:

```js
const coverage = await browser.getCoverageReport()
expect(coverage.lines.total).toBeAbove(0.9)
expect(coverage.statements.total).toBeAbove(0.9)
expect(coverage.functions.total).toBeAbove(0.9)
expect(coverage.branches.total).toBeAbove(0.9)
```

### Chrome DevTools Access

For now the service allows two different ways to access the Chrome DevTools Protocol:

### `cdp` Command

The `cdp` command is a custom command added to the browser scope that allows you to call directly commands to the protocol.

```js
browser.cdp(<domain>, <command>, <arguments>)
```

For example if you want to get the JavaScript coverage of your page you can do the following:

```js
it('should take JS coverage', async () => {
    /**
     * enable necessary domains
     */
    await browser.cdp('Profiler', 'enable')
    await browser.cdp('Debugger', 'enable')

    /**
     * start test coverage profiler
     */
    await browser.cdp('Profiler', 'startPreciseCoverage', {
        callCount: true,
        detailed: true
    })

    await browser.url('http://google.com')

    /**
     * capture test coverage
     */
    const { result } = await browser.cdp('Profiler', 'takePreciseCoverage')
    const coverage = result.filter((res) => res.url !== '')
    console.log(coverage)
})
```

### `getNodeId(selector)` and `getNodeIds(selector)` Command

Helper method to get the nodeId of an element in the page. NodeIds are similar like WebDriver node ids an identifier for a node. It can be used as a parameter for other Chrome DevTools methods, e.g. `DOM.focus`.

```js
const nodeId = await browser.getNodeId('body')
console.log(nodeId) // outputs: 4
const nodeId = await browser.getNodeIds('img')
console.log(nodeId) // outputs: [ 40, 41, 42, 43, 44, 45 ]
```

### `startTracing(categories, samplingFrequency)` Command

Start tracing the browser. You can optionally pass in custom tracing categories (defaults to [this list](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-devtools-service/src/constants.js#L1-L9)) and the sampling frequency (defaults to `10000`).

```js
await browser.startTracing()
```

### `endTracing` Command

Stop tracing the browser.

```js
await browser.endTracing()
```

### `getTraceLogs` Command

Returns the tracelogs that was captured within the tracing period. You can use this command to store the trace logs on the file system to analyse the trace via Chrome DevTools interface.

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

### Setting Download Paths for the Browser

The `cdp` command can be used to call the [`Page.setDownloadBehavior`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-setDownloadBehavior) command of Devtools Protocol to set the behavior when downloading a file. Make sure the `downloadPath` is an absolute path and the `browser.cdp()` call is made before the file is downloaded.

```js
await browser.cdp('Page', 'setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: '/home/root/webdriverio-project/',
});
```

### Access Puppeteer Instance

The service uses Puppeteer for its automation under the hood. You can get access to the used instance by calling the [`getPuppeteer`](https://webdriver.io/docs/api/browser/getPuppeteer) command. __Note:__ Puppeteer commands are async and either needs to be called within the `call` command or handled via `async/await`:

```js
describe('use Puppeteer', () => {
    it('by wrapping commands with call', () => {
        await browser.url('http://json.org')

        const puppeteer = await browser.getPuppeteer()
        const page = await browser.call(() => puppeteer.pages())[0]
        console.log(await browser.call(() => page.title()))
    })
})
```

### Event Listener

In order to capture network events in the browser you can register an event listener to the Chrome DevTools.
A full list of available [CDP Network Events](https://chromedevtools.github.io/devtools-protocol/tot/Network/).

```js
it('should listen on network events', () => {
    await browser.cdp('Network', 'enable')

    await browser.on('Network.requestWillBeSent', (event) => {
        console.log(`Request: ${event.request.method} ${event.request.url}`);
    });
    await browser.on('Network.responseReceived', (event) => {
        console.log(`Response: ${event.response.status} ${event.response.url}`);
    });
    await browser.on('Network.loadingFailed', (event) => {
        console.log(`Request failed: ${event.errorText}`);
    });

    await browser.url('https://www.google.com')
})
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
