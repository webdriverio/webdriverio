---
id: automationProtocols
title: Automation Protocols
---

With WebdriverIO, you can choose between multiple automation technologies when running your E2E tests locally or in the cloud. By default WebdriverIO will always check for a browser driver that is compliant to the WebDriver protocol on `localhost:4444`. If it can't find such driver it falls back to use Chrome DevTools using Puppeteer under the hood.

Nearly all modern browsers that support [WebDriver](https://w3c.github.io/webdriver/) also support another native interface called [DevTools](https://chromedevtools.github.io/devtools-protocol/) that can be used for automation purposes.

Both have advantages and disadvantages, depending on your use case and environment.

## WebDriver Protocol

> [WebDriver](https://w3c.github.io/webdriver/) is a remote control interface that enables introspection and control of user agents. It provides a platform- and language-neutral wire protocol as a way for out-of-process programs to remotely instruct the behavior of web browsers.

The WebDriver protocol was designed to automate a browser from the user perspective, meaning that everything a user is able to do, you can do with the browser. It provides a set of commands that abstract away common interactions with an application (e.g., navigating, clicking, or reading the state of an element). Since it is a web standard, it is well supported across all major browser vendors, and also is being used as underlying protocol for mobile automation using [Appium](http://appium.io).

To use this automation protocol, you need a proxy server that translates all commands and executes them in the target environment (i.e. the browser or the mobile app).

For browser automation, the proxy server is usually the browser driver. There are drivers  available for all browsers:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

For any kind of mobile automation, you’ll need to install and setup [Appium](http://appium.io). It will allow you to automate mobile (iOS/Android) or even desktop (macOS/Windows) applications using the same WebdriverIO setup.

There are also plenty of services that allow you to run your automation test in the cloud at high scale. Instead of having to setup all these drivers locally, you can just talk to these services (e.g. [Sauce Labs](https://saucelabs.com)) in the cloud and inspect the results on their platform. The communication between test script and automation environment will look as follows:

![WebDriver Setup](/img/webdriver.png)

### Advantages

- Official W3C web standard, supported by all major browsers
- Simplified protocol that covers common user interactions
- Support for mobile automation (and even native desktop apps)
- Can be used locally as well as in the cloud through services like [Sauce Labs](https://saucelabs.com)

### Disadvantages

- Not designed for in-depth browser analysis (e.g., tracing or intercepting network events)
- Limited set of automation capabilities (e.g., no support to throttle CPU or network)
- Additional effort to set up browser driver with selenium-standalone/chromedriver/etc
