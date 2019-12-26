---
id: automationProtocols
title: Automation Protocols
---

With WebdriverIO, you can choose between multiple automation technologies when running your E2E tests locally or in the cloud. 

Nearly all modern browsers that support [WebDriver](https://w3c.github.io/webdriver/) also support another native interface called [DevTools](https://chromedevtools.github.io/devtools-protocol/) that can be used for automation purposes. 

Both have advantages and disadvantages, depending on your use case and environment.

## WebDriver Protocol

> [WebDriver](https://w3c.github.io/webdriver/) is a remote control interface that enables introspection and control of user agents. It provides a platform- and language-neutral wire protocol as a way for out-of-process programs to remotely instruct the behavior of web browsers.

The WebDriver protocol was designed to automate a browser from the user perspective, meaning that everything a user is able to do, you can do with the browser. It provides a set of commands that abstract away common interactions with an application (e.g., navigating, clicking, or reading the state of an element). Since it is a web standard, it is well supported across all major browser vendors, and also is being used as underlying protocol for mobile automation using [Appium](http://appium.io).

To use this automation protocol, you need a proxy server that translates all commands and executes them in the target environment (i.e. the browser or the mobile app). 

For browser automation, the proxy server is usually the browser driver. There are drivers  available for all browsers:

- Chrome ▶︎ [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox ▶︎ [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge ▶︎ [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorter ▶︎ [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari ▶︎ [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

For any kind of mobile automation, you’ll need to install and setup [Appium](http://appium.io). It will allow you to automate mobile (iOS/Android) or even desktop (macOS/Windows) applications using the same WebdriverIO setup. 

There are also plenty of services that allow you to run your automation test in the cloud at high scale. Instead of having to setup all these drivers locally, you can just talk to these services (e.g. [SauceLabs](https://saucelabs.com)) in the cloud and inspect the results on their platform. The communication between test script and automation environment will look as follows:

![WebDriver Setup](/img/webdriver.png)

### Advantages

- Official W3C web standard, supported by all major browsers
- Simplified protocol that covers common user interactions
- Support for mobile automation (and even native desktop apps)
- Can be used locally as well as in the cloud through services like [SauceLabs](https://saucelabs.com)

### Disadvantages

- Not designed for in-depth browser analysis (e.g., tracing or intercepting network events)
- Limited set of automation capabilities (e.g., no support to throttle CPU or network)

## DevTools Protocol

The DevTools interface is a native browser interface that is usually being used to debug the browser from a remote application (e.g., [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Next to its capabilities to inspect the browser in nearly all possible forms, it can also be used to control it. 

While every browser used to have its own internal DevTools interface that was not really exposed to the user, more and more browsers are now adopting the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). It is used to either debug a web application using Chrome DevTools or control Chrome using tools like [Puppeteer](https://pptr.dev). 

The communication happens without any proxy, directly to the browser using WebSockets:

![DevTools Setup](/img/devtools.png)

WebdriverIO allows you to use the DevTools capabilities as an alternative automation technology for WebDriver if you have special requirements to automate the browser. With the [`devtools`](https://www.npmjs.com/package/devtools) NPM package, you can use the same commands that WebDriver provides, which then can be used by WebdriverIO and the WDIO testrunner to run its useful commands on top of that protocol. It uses Puppeteer to under the hood and allows you to run a sequence of commands with Puppeteer if needed. 

To use DevTools as your automation protocol, you have to install the NPM package as follows:

```sh
$ npm i --save-dev devtools
```

In your WebdriverIO options you then just need to switch the `automationProtocol` flag to `devtools` in your `wdio.conf.js`:

```js
// wdio.conf.js
exports.config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```

Now you can run a test (as shown below). 

(An example how to run this using WebdriverIO in [standalone mode](https://webdriver.io/docs/setuptypes.html#standalone-mode) can also be found [here](https://github.com/webdriverio/webdriverio/blob/master/examples/devtools/intercept.js).)

```js
// example using WDIO testrunner
describe('my test', () => {
    it('can use Puppeteer as automation fallback', () => {
        // WebDriver command
        browser.url('https://webdriver.io')

        // switch to Puppeteer to intercept requests
        browser.call(async () => {
            const puppeteerBrowser = browser.getPuppeteer()
            const page = (await puppeteerBrowser.pages())[0]
            await page.setRequestInterception(true)
            page.on('request', interceptedRequest => {
                if (interceptedRequest.url().endsWith('webdriverio.png')) {
                    return interceptedRequest.continue({
                        url: 'https://webdriver.io/img/puppeteer.png'
                    })
                }

                interceptedRequest.continue()
            })
        })

        // continue with WebDriver commands
        browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

If you are using the WDIO testrunner in sync mode, we recommend wrapping your Puppeteer calls within the `call` command, so that all calls are executed before WebdriverIO continues with the next WebDriver command. 

By accessing the Puppeteer interface, you have access to a variety of new capabilities to automate or inspect the browser and your application, e.g. intercepting network requests (see above), tracing the browser, throttle CPU or network capabilities, and much more.
