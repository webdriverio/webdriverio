DevTools
========

> A Chrome DevTools protocol binding that maps WebDriver commands into Chrome DevTools commands using [Puppeteer](https://www.npmjs.com/package/puppeteer)

This package provides a low level interface to run browser automation scripts based on the WebDriver protocol. If you are looking for a tool to automate Chrome or Firefox you should look up [Puppeteer](https://www.npmjs.com/package/puppeteer). This is suppose to be used by the [WebdriverIO](https://webdriver.io/) package in order to run its automation on the Chrome DevTools protocol.

## Install

```sh
$ npm i webdriverio
```

## Example

The following example demonstrates how WebdriverIO can be used with the `devtools` package as automation binding using the [`automationProtocol`](https://webdriver.io/docs/options.html#automationProtocol) option:

```js
const { remote } = require('webdriverio')

let browser;

(async () => {
    browser = await remote({
        automationProtocol: 'devtools',
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('https://webdriver.io')

    /**
     * run Puppeteer code
     */
    await browser.call(async () => {
        const page = (await browser.puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
                })
            }

            interceptedRequest.continue()
        })
    })

    // continue with WebDriver commands
    await browser.refresh()
    await browser.pause(2000)

    /**
     * now on the https://webdriver.io page you see the Puppeteer logo
     * instead of the WebdriverIO one
     */

    await browser.deleteSession()
})().catch(async (e) => {
    console.error(e)
    await browser.deleteSession()
})
```

### Commands

The following commands are already supported:

- [x] [newSession](https://w3c.github.io/webdriver/#new-session)
- [x] [deleteSession](https://w3c.github.io/webdriver/#delete-session)
- [x] [status](https://w3c.github.io/webdriver/#status)
- [x] [getTimeouts](https://w3c.github.io/webdriver/#get-timeouts)
- [x] [setTimeouts](https://w3c.github.io/webdriver/#set-timeouts)
- [x] [getUrl](https://w3c.github.io/webdriver/#get-current-url)
- [x] [navigateTo](https://w3c.github.io/webdriver/#navigate-to)
- [x] [back](https://w3c.github.io/webdriver/#back)
- [x] [forward](https://w3c.github.io/webdriver/#forward)
- [x] [refresh](https://w3c.github.io/webdriver/#refresh)
- [x] [getTitle](https://w3c.github.io/webdriver/#get-title)
- [x] [getWindowHandle](https://w3c.github.io/webdriver/#get-window-handle)
- [x] [closeWindow](https://w3c.github.io/webdriver/#close-window)
- [x] [switchToWindow](https://w3c.github.io/webdriver/#switch-to-window)
- [x] [createWindow](https://w3c.github.io/webdriver/#new-window)
- [x] [getWindowHandles](https://w3c.github.io/webdriver/#get-window-handles)
- [x] [switchToFrame](https://w3c.github.io/webdriver/#switch-to-frame)
- [x] [switchToParentFrame](https://w3c.github.io/webdriver/#switch-to-parent-frame)
- [x] [getWindowRect](https://w3c.github.io/webdriver/#get-window-rect)
- [x] [setWindowRect](https://w3c.github.io/webdriver/#set-window-rect)
- [ ] [maximizeWindow](https://w3c.github.io/webdriver/#maximize-window) (not possible with Puppeteer)
- [ ] [minimizeWindow](https://w3c.github.io/webdriver/#minimize-window) (not possible with Puppeteer)
- [ ] [fullscreenWindow](https://w3c.github.io/webdriver/#fullscreen-window) (not possible with Puppeteer)
- [x] [findElement](https://w3c.github.io/webdriver/#find-element)
- [x] [findElements](https://w3c.github.io/webdriver/#find-elements)
- [x] [findElementFromElement](https://w3c.github.io/webdriver/#find-element-from-element)
- [x] [findElementsFromElement](https://w3c.github.io/webdriver/#find-elements-from-element)
- [x] [getActiveElement](https://w3c.github.io/webdriver/#get-active-element)
- [x] [isElementSelected](https://w3c.github.io/webdriver/#is-element-selected)
- [x] [isElementDisplayed](https://w3c.github.io/webdriver/#element-displayedness)
- [x] [getElementAttribute](https://w3c.github.io/webdriver/#get-element-attribute)
- [x] [getElementProperty](https://w3c.github.io/webdriver/#get-element-property)
- [x] [getElementCSSValue](https://w3c.github.io/webdriver/#get-element-css-value)
- [x] [getElementText](https://w3c.github.io/webdriver/#get-element-text)
- [x] [getElementTagName](https://w3c.github.io/webdriver/#get-element-tag-name)
- [x] [getElementRect](https://w3c.github.io/webdriver/#get-element-rect)
- [x] [isElementEnabled](https://w3c.github.io/webdriver/#is-element-enabled)
- [x] [elementClick](https://w3c.github.io/webdriver/#element-click)
- [x] [elementClear](https://w3c.github.io/webdriver/#element-clear)
- [x] [elementSendKeys](https://w3c.github.io/webdriver/#element-send-keys)
- [x] [getPageSource](https://w3c.github.io/webdriver/#get-page-source)
- [x] [executeScript](https://w3c.github.io/webdriver/#execute-script)
- [x] [executeAsyncScript](https://w3c.github.io/webdriver/#execute-async-script)
- [x] [getAllCookies](https://w3c.github.io/webdriver/#get-all-cookies)
- [x] [getNamedCookie](https://w3c.github.io/webdriver/#get-named-cookie)
- [x] [addCookie](https://w3c.github.io/webdriver/#add-cookie)
- [x] [deleteAllCookies](https://w3c.github.io/webdriver/#delete-all-cookies)
- [x] [deleteCookie](https://w3c.github.io/webdriver/#delete-cookie)
- [x] [performActions](https://w3c.github.io/webdriver/#perform-actions)
- [x] [releaseActions](https://w3c.github.io/webdriver/#release-actions)
- [x] [dismissAlert](https://w3c.github.io/webdriver/#dismiss-alert)
- [x] [acceptAlert](https://w3c.github.io/webdriver/#accept-alert)
- [x] [getAlertText](https://w3c.github.io/webdriver/#get-alert-text)
- [x] [sendAlertText](https://w3c.github.io/webdriver/#send-alert-text)
- [x] [takeScreenshot](https://w3c.github.io/webdriver/#take-screenshot)
- [x] [takeElementScreenshot](https://w3c.github.io/webdriver/#take-element-screenshot)

### Selector Strategies

- [x] [CSS Selector](https://w3c.github.io/webdriver/#css-selectors)
- [x] [Link Text](https://w3c.github.io/webdriver/#partial-link-text)
- [x] [Partial Link Text](https://w3c.github.io/webdriver/#partial-link-text)
- [x] [Tag Name](https://w3c.github.io/webdriver/#tag-name)
- [x] [XPath](https://w3c.github.io/webdriver/#xpath)

### Browser

- [x] Chrome
- [x] Firefox (nightly only)
- [x] Edge
- [ ] Safari
