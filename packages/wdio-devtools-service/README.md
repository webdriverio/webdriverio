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

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

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

### Via `cdp` Command

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

### Via Event Listener

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
