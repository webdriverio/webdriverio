---
id: protocols
title: Protocol Commands
---

WebdriverIO is an automation framework that relies on various of automation protocols to control a remote agent, e.g. for a browser, mobile device or television. Based on the remote device different protocols come into play. These commands are assigned to the [Browser](/docs/api/browser) or [Element](/docs/api/element) Object depending on the session information by the remote server (e.g. browser driver).

Internally WebdriverIO uses protocol commands for almost all interactions with the remote agent. However additional commands assigned to the [Browser](/docs/api/browser) or [Element](/docs/api/element) Object simplify the usage of WebdriverIO, e.g. getting the text of an element using protocol commands would look like this:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

Using the convenient commands of the [Browser](/docs/api/browser) or [Element](/docs/api/element) Object this can be reduced to:

```js
$('#lst-ib').getText()
```

The following section explain each individual protocol.

## WebDriver Protocol

The [WebDriver](https://w3c.github.io/webdriver/#elements) protocol is a web standard for automating browser. As oppose to some other E2E tools it guarantees that automation can be done on actual browser that are used by your users, e.g. Firefox, Safari and Chrome and Chromium based browser like Edge, and not only on browser engines, e.g. WebKit, which are very different.

The advantage of using the WebDriver protocol as oppose to debugging protocols like [Chrome DevTools](https://w3c.github.io/webdriver/#elements) is that you have a specific set of commands that allow to interact with the browser the same way across all browser which reduces the likelihood for flakiness. Furthermore offers this protocol abilities for massive scalibility by using cloud vendors such as [Sauce Labs](https://saucelabs.com/), [BrowserStack](https://www.browserstack.com/) and [others](https://github.com/christian-bromann/awesome-selenium#cloud-services).

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol is the second generation of the protocol and is currently being worked on by most browser vendors. Compared to its pre-predecessor the protocol supports a bi-directional communication (hence "Bidi") between the framework and the remote device. It furthermore introduces additional primitives for better browser introspection to better automate modern web applications in browser.

Given this protocol is currently work in progress more features will be added over time and supported by browser. If you use WebdriverIOs convenient commands nothing will change for you. WebdriverIO will make use of these new protocol capabilities as soon as they are available and supported in the browser.

## Appium

The [Appium](https://appium.io/) project provides capabilities to automate mobile, desktop and all other kinds of IoT devices. While WebDriver focuses on browser and the web, the vision of Appium is to use the same approach but for any arbitrary device. In addition to the commands that WebDriver defines, it has special commands that often are specific to the remote device that is being automated. For mobile testing scenarios this is ideal when you want to write and run the same tests for both Android and iOS applications.

According to Appium [documentation](https://appium.github.io/appium.io/docs/en/about-appium/intro/?lang=en) it was designed to meet mobile automation needs according to a philosophy outlined by the following four tenets:

- You shouldn't have to recompile your app or modify it in any way in order to automate it.
- You shouldn't be locked into a specific language or framework to write and run your tests.
- A mobile automation framework shouldn't reinvent the wheel when it comes to automation APIs.
- A mobile automation framework should be open source, in spirit and practice as well as in name!

## Chromium

The Chromium protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary) or [Edgedriver](https://developer.microsoft.com/fr-fr/microsoft-edge/tools/webdriver).

## Firefox

The Firefox protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

The [Sauce Labs](https://saucelabs.com/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Sauce Labs cloud.

## Selenium Standalone

The [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Selenium Grid.

## JSON Wire Protocol

The [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) is the pre-predecessor of the WebDriver protocol and __deprecated__ today. While some commands might still be supported in certain environments, it is not recommended to use any of its commands.

## Mobile JSON Wire Protocol

The [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) is a super set of mobile commands on top of the JSON Wire Protocol. Given this one is deprecated the Mobile JSON Wire Protocol also got __deprecated__. Appium might still support some of its commands but it is not recommended to use them.
