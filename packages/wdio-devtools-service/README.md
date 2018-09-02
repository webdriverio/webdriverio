WebdriverIO DevTools Service
============================

> A WebdriverIO service that allows you to run Chrome DevTools commands in your tests

With Chrome v63 and up the browser [started to support](https://developers.google.com/web/updates/2017/10/devtools-release-notes#multi-client) multi clients allowing arbitrary clients to access the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). This provides interesting opportunities to automate Chrome beyond the [WebDriver protocol](https://www.w3.org/TR/webdriver/). With this service you can enhance the wdio browser object to leverage that access and call Chrome DevTools commands within your tests to e.g. intercept requests, throttle network capabilities or take CSS/JS coverage.

__Note:__ this service currently only supports Chrome v63 and up!

## Installation

The easiest way is to keep `wdio-devtools-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-devtools-service": "^0.1.2"
  }
}
```

You can simple do it by:

```bash
npm install wdio-devtools-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you just need to add the service to your service list in your `wdio.conf.js` like:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['devtools'],
  // ...
};
```

## Usage

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

### `getSpeedIndex` Command

Returns the [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index) and [Perceptual Speed Index](https://developers.google.com/web/tools/lighthouse/audits/speed-index) from the page load that happened between the tracing period.

```js
browser.startTracing()
browser.url('http://json.org')
browser.endTracing()

console.log(browser.getSpeedIndex())
// outputs
// { speedIndex: 689.6634800064564,
//   perceptualSpeedIndex: 785.0901860232523 }
```

### `getPerformanceMetrics` Command

Returns an object with a variety of performance metrics.

```js
browser.startTracing()
browser.url('http://json.org')
browser.endTracing()

console.log(browser.getPerformanceMetrics())
// outputs:
// { firstPaint: 621.432,
//   firstContentfulPaint: 621.44,
//   firstMeaningfulPaint: 621.442,
//   domContentLoaded: 474.96,
//   timeToFirstInteractive: 621.442,
//   load: 1148.313 }
```

### `getPageWeight` Command

Returns page weight information of the last page load.

```js
browser.startTracing()
browser.url('http://webdriver.io')
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

For more information on WebdriverIO see the [homepage](http://webdriver.io).
