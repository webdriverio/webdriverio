WebdriverIO Protocol Helper
===========================

This package stores the definition for various automation protocols such as [WebDriver](https://w3c.github.io/webdriver/) or vendor specific protocol extensions like for [SauceLabs](https://saucelabs.com/). Unless you are interested in generating a WebDriver client there should be no reason why you should need this package. This package holds the definition of the following protocols:

- [WebDriver](https://w3c.github.io/webdriver/)
- [JSON Wire Protocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol)
- [Appium](http://appium.io/)
- [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md)
- [Sauce Labs](https://saucelabs.com/)
- Chrome (WebDriver extension when running Chromedriver)
- Selenium (when running Selenium Standalone Server)

## Install

To install the package, run:

```sh
$ npm install @wdio/protocols
```

## Usage

You can get data by importing the package as follows:

```js
import { WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol, ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol } from '@wdio/protocols'

/**
 * get description of session command
 */
console.log(WebDriverProtocol['/session'].POST.description)
```

## TypeScript Interfaces

The package exposes TypeScript interfaces for all protocols. You can use them for your own project as follows:

```ts
import type { WebDriverCommands } from '@wdio/protocol'

import { WebDriverCommands, WebDriverCommandsAsync } from './src'

const browser = {} as WebDriverCommands
browser.sendAlertText(true)
// fails with "Argument of type 'boolean' is not assignable to parameter of type 'string'.ts(2345)"

const asyncBrowser = {} as WebDriverCommandsAsync
const a = await asyncBrowser.getTitle()
type foo = typeof a // string
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
