# Changelog

> **Tags:**
> - :boom:       [Breaking Change]
> - :eyeglasses: [Spec Compliancy]
> - :rocket:     [New Feature]
> - :bug:        [Bug Fix]
> - :memo:       [Documentation]
> - :house:      [Internal]
> - :nail_care:  [Polish]

_Note: Gaps between patch versions are faulty, broken or test releases._

See [CHANGELOG - v4](https://github.com/webdriverio-boneyard/v4/blob/master/CHANGELOG.md).

---



## 5.0.3 (2018-12-23)

#### :bug: Bug Fix
* `wdio-cli`, `wdio-config`, `wdio-interface`, `wdio-local-runner`, `wdio-runner`, `wdio-webdriver-mock-service`, `webdriverio`
  * [#3171](https://github.com/webdriverio/webdriverio/pull/3171) Fix middleware regression and add smoke tests ([@christian-bromann](https://github.com/christian-bromann))

#### :house: Internal
* [#3165](https://github.com/webdriverio/webdriverio/pull/3165) Ensure GITHUB_AUTH token is set to generate changelogs ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))
- Dmytro Shpakovskyi ([@Marketionist](https://github.com/Marketionist))

## v5.0.2 (2018-12-22)

#### :memo: Documentation
* [#3163](https://github.com/webdriverio/webdriverio/pull/3163) Name mobile variable "driver" instead of "browser" ([@christian-bromann](https://github.com/christian-bromann))

#### Committers: 2
- Boris Osipov ([@BorisOsipov](https://github.com/BorisOsipov))
- Christian Bromann ([@christian-bromann](https://github.com/christian-bromann))


## v5.0.1 (2018-12-21)

#### :bug: Bug Fix
* `wdio-runner`
  * [#3162](https://github.com/webdriverio/webdriverio/pull/3162) wdio-runner: Fix looking at caps as an array ([@WillBrock](https://github.com/WillBrock))

#### :memo: Documentation
* [#3161](https://github.com/webdriverio/webdriverio/pull/3161) Update API.md ([@wobbleRed](https://github.com/wobbleRed))

#### Committers: 2
- Derek Allred ([@wobbleRed](https://github.com/wobbleRed))
- Will Brock ([@WillBrock](https://github.com/WillBrock))

## v5.0.0 (2018-12-20)

This version comes with a variety of technical changes that might affect the functionality of 3rd party WebdriverIO packages from the community. If such a package causes problems after the update, please raise an issue in the repository of that package and __not__ in this repository. You can find a list of officially maintained packages [here](https://github.com/webdriverio/webdriverio/blob/master/README.md#packages).

#### :boom: Breaking Change
* moved `wdio` cli command from [`webdriverio`](https://www.npmjs.com/package/webdriverio) package to [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli)
* commands are scoped to `browser` and `element` - no selector property on commands anymore
  ```js
  // v4
  browser.click('#myElem')
  ```
  ```js
  // v5 and upwards
  const elem = $('#myElem')
  elem.click()
  ```
* no command chaining anymore (in standalone and wdio mode)
  ```js
  // v4 (standalone/async mode)
  browser
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    // ...
  ```
  ```js
  // v5 (standalone/async mode)
  await browser.url('https://duckduckgo.com/')
  const elem = await browser.$('#search_form_input_homepage')
  await elem.click()
  await elem.setValue('WebdriverIO')
  ```
* every protocol command returns a `value` property instead of raw driver response
  ```js
  // v4
  const result = browser.execute(() => 1 + 1)
  console.log(result)
  // outputs:
  // { sessionId: '02aee149a1a421b81598ff2a3b90e33d',
  //   value: 2,
  //   _status: 0 }
  ```
  ```js
  // v5
  const result = browser.execute(() => 1 + 1)
  console.log(result) // outputs: 2
  ```
* the `remote` and `multiremote` methods to initiate a driver instance now also start the driver session and therefore return a promise (no `init` command anymore)
  ```js
  // v4
  import { remote } from 'webdriverio'
  const driver = remote({ ... })
  driver.init().url('https://webdriver.io').end()
  ```
  ```js
  // v5
  import { remote } from 'webdriverio'
  const driver = await remote({ ... })
  await driver.url('https://webdriver.io')
  await driver.deleteSession()
  ```
* command changes: over the years WebdriverIO added more and more commands for different automation protocols without applying a pattern to it which resulted in having a bunch of duplication and inconsistent naming, even though the list looks exhausting, most of the commands that have changed were used internally
    * renamed commands:
        * `isVisible` → `isDisplayed`
        * `isVisibleWithinViewport` → `isDisplayedInViewport`
        * `waitForVisible` → `waitForDisplayed`
        * `clearElement` → `clearValue`
        * `moveToObject` → `moveTo` (element scope only)
        * `setCookie`, `getCookie`, `deleteCookie` → `setCookies`, `getCookies`, `deleteCookies`
        * `getElementSize` → `getSize`
        * `source`, `getSource` → `getPageSource`
        * `title` → `getTitle`
        * `actions` → `performActions` (WebDriver protocol only)
        * `alertAccept` → `acceptAlert`
        * `alertDismiss` → `dismissAlert`
        * `alertText` → `getAlertText`, `sendAlertText`
        * `applicationCacheStatus` → `getApplicationCacheStatus` (JsonWireProtocol only)
        * `cookie` → `getAllCookies`, `addCookie`, `deleteCookie`
        * `getCssProperty` → `getCSSProperty`
        * `element` → `findElement`
        * `elements` → `findElements`
        * `elementActive` → `getActiveElement`
        * `elementIdAttribute` → `getElementAttribute`
        * `elementIdClear` → `elementClear`
        * `elementIdClick` → `elementClick`
        * `elementIdCssProperty` → `getElementCSSValue`
        * `elementIdDisplayed` → `isElementDisplayed`
        * `elementIdElement` → `findElementFromElement`
        * `elementIdElements` → `findElementsFromElement`
        * `elementIdEnabled` → `getElementEnabled`
        * `elementIdLocation` → `getElementLocation`
        * `elementIdLocationInView` → `getElementLocationInView` (JsonWireProtocol only)
        * `elementIdName` → `getElementTagName`
        * `elementIdProperty` → `getElementProperty`
        * `elementIdRect` → `getElementRect`
        * `elementIdScreenshot` → `takeElementScreenshot`
        * `elementIdSelected` → `isElementSelected`
        * `elementIdSize` → `getElementSize` (JsonWireProtocol only)
        * `elementIdText` → `getElementText`
        * `elementIdValue` → `elementSendKeys`
        * `frame` → `switchToFrame`
        * `frameParent` → `switchToParentFrame`
        * `timeoutsAsyncScript`, `timeoutsImplicitWait` → `setAsyncTimeout`, `setImplicitTimeout` (JsonWireProtocol only)
        * `getLocationInView` → `getElementLocationInView` (JsonWireProtocol only)
        * `imeActivate` → `activateIME` (JsonWireProtocol only)
        * `imeActivated` → `isIMEActivated` (JsonWireProtocol only)
        * `imeActiveEngine` → `getActiveEngine` (JsonWireProtocol only)
        * `imeAvailableEngines` → `getAvailableEngines` (JsonWireProtocol only)
        * `imeDeactivated` → `deactivateIME` (JsonWireProtocol only)
        * `localStorage` → `getLocalStorage`, `setLocalStorage`, `clearLocalStorage`, `getLocalStorageItem`, `deleteLocalStorageItem` (JsonWireProtocol only)
        * `localStorageSize` → `getLocalStorageSize` (JsonWireProtocol only)
        * `sessionStorage` → `getSessionStorage`, `setSessionStorage`, `clearSessionStorage`, `getSessionStorageItem`, `deleteSessionStorageItem` (JsonWireProtocol only)
        * `sessionStorageSize` → `getSessionStorageSize` (JsonWireProtocol only)
        * `location` → `getElementLocation`
        * `log` → `getLogs` (JsonWireProtocol only)
        * `logTypes` → `getLogTypes` (JsonWireProtocol only)
        * `screenshot` → `takeScreenshot`
        * `session` → `getSession`, `deleteSession` (JsonWireProtocol only)
        * `sessions` → `getSessions`
        * `submit` → `elementSubmit`
        * `timeouts` → `getTimeouts`, `setTimeout`
        * `window`, `switchToWindow` → `switchWindow`
        * `windowHandle` → `closeWindow`, `getWindowHandle`
        * `windowHandles` → `getWindowHandles`
        * `windowHandleFullscreen` → `fullscreenWindow`
        * `windowHandleMaximize` → `maximizeWindow`
        * `windowHandlePosition` → `setWindowPosition`, `getWindowPosition` (JsonWireProtocol only), `setWindowRect`, `getWindowRect` (WebDriver protocol only)
        * `windowHandleSize` → `setWindowSize`, `getWindowSize` (JsonWireProtocol only), `setWindowRect`, `getWindowRect` (WebDriver protocol only)
        * `hasFocus` → `isFocused`
        * `end` → `deleteSession`
        * `reload` → `reloadSession`
        * `scroll` → `scrollIntoView`
        * `context` → `getContext`, `switchContext`
        * `contexts` → `getContexts`
        * `currentActivity` → `getCurrentActivity`
        * `deviceKeyEvent` → `sendKeyEvent`
        * `getAppStrings` → `getStrings`
        * `hideDeviceKeyboard` → `hideKeyboard`
        * `hold` → `longPressKeyCode`
        * `launch` → `launchApp`
        * `performMultiAction` → `multiTouchPerform`
        * `pressKeycode` → `pressKeyCode`
        * `rotate` → `rotateDevice`
        * `setImmediateValue` → `setValueImmediate`
        * `settings` → `getSettings`, `updateSettings`
        * `strings` → `getStrings`
        * `toggleTouchIdEnrollment` → `toggleEnrollTouchId`
    * removed commands (_Note: there are chances that removed commands will come back if their use case scenario seem to be reasonable._):
        * `doDoubleClick`, `doubleClick` - replace with double `click` command or `performActions` command
        * `dragAndDrop` - replace with `performActions` command
        * `leftClick`, `middleClick`, `rightClick` - replace with `performActions` command
        * `selectByValue` - replace with `selectByAttribute('value')`
        * `selectorExecute`, `selectorExecuteAsync` - replace with `execute(elem)`
        * `submit` - replace by clicking on submit button
        * `getCurrentDeviceActivity` - replace by `getCurrentActivity`
        * `release` - replace by `touchAction` command
        * `swipe`, `swipeDown`, `swipeLeft`, `swipeRight`, `swipeUp` - replace by `touchAction` command
        * `performTouchAction` - replace by `touchPerform`
        * with no replacements: `init`, `buttonPress`, `file`, `chooseFile`, `uploadFile`, `endAll`, `getCommandHistory`, `waitForSelected`, `waitForText`, `waitForValue`, `getGridNodeDetails`, `gridProxyDetails`, `gridTestSession`, `hold`
    * new commands:
        * WebDriver / JsonWireProtocol: `minimizeWindow`
        * Appium: `startRecordingScreen`, `stopRecordingScreen`, `isKeyboardShown`, `getSystemBars`, `getDisplayDensity`, `endCoverage`, `replaceValue`, `receiveAsyncResponse`, `gsmCall`, `gsmSignal`, `gsmVoice`, `sendSms`, `fingerPrint`
* adding custom commands are scoped to the prototype they are being added to
  ```js
  // v4
  browser.addCommand('myCommand', () => { ... })
  const elem = $('myElem')
  console.log(typeof browser.myCommand) // outputs "function"
  console.log(typeof elem.myCommand) // outputs "function"
  ```
  ```js
  // v5
  browser.addCommand('myCommand', () => { ... })
  const elem = $('myElem')
  console.log(typeof browser.myCommand) // outputs "function"
  console.log(typeof elem.myCommand) // outputs "undefined"
  elem.addCommand('myElemCommand', () => { ... })
  console.log(typeof elem.myElemCommand) // outputs "function"
  const elem2 = $('myOtherElem')
  console.log(typeof elem2.myElemCommand) // outputs "undefined"
  ```
* custom configuration for services or reporters are now directly applied to the config list, e.g.
  ```js
  // ...
  reporters: [
    'spec',
    [
      'junit',
      { outputDir: __dirname + '/junit_logs' }
    ]
  ],
  // ...
  ```

#### :eyeglasses: Spec Compliancy
* implemented parameter assertions for protocol commands
* full W3C WebDriver compliancy
* full Appium and Mobile JSONWire Protocol compliancy
* simplified protocol command maintenance by defining commands, their parameters and response values within simple [json constructs](https://github.com/webdriverio/webdriverio/tree/master/packages/webdriver/protocol)
* instead of switching protocol within a running session, WebdriverIO now determines the supported protocol by the driver based on the create session response

#### :rocket: New Feature
* new package `@wdio/applitools-service` for simple visual regression testing with [Applitools](https://applitools.com/)
* new package `eslint-plugin-wdio` for WebdriverIO specific linting rules for [ESLint](https://eslint.org/)
* `@wdio/devtools-service` now with frontend performance testing capabilities (see [example](https://github.com/christian-bromann/webdriverio-performance-testing))
* new `region` [option](https://github.com/webdriverio/webdriverio/blob/cb-changelog/examples/wdio.conf.js#L29-L33) to simply run tests on SauceLabs in different datacenters
* [`debug`](http://beta.webdriver.io/docs/api/browser/debug.html) command now allows to connect the runner with the [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/) application for more indepth debugging
* decoupling of `@wdio/sync` package from framework adapters so that there is no need to install [`fibers`](https://www.npmjs.com/package/fibers) when you want to run your commands with async/await
* autofetching of all provides log types
* auto retry mechansim for all command requests
* auto refetch mechanism for stale elements
* simplified reattachment to existing sessions with `attach` functionality
* integrated and auto maintained [TypeScript](https://www.typescriptlang.org/) definitions (still [work in progress](https://github.com/webdriverio/webdriverio/pull/2862))
* wdio testrunner fails if no spec files were found

#### :bug: Bug Fix
* fixed loss of scope when chaining elements (e.g. `$$('div')[2].$('span').getHTML()`)
* browser scope with now updated capabilities (`browser.capabilities`)
* improved [watch functionality](https://youtu.be/EUNoPFSomhM?t=17m4s) allows to rerun tests without starting a new session all over again
* fixed problems with `addCommand` in multiremote

#### :memo: Documentation
* brand new documentation page based on the [Docusaurus](https://docusaurus.io/) framework
    * written in a modern web framework called [React](https://reactjs.org/)
    * completely responsive with full support for mobile viewports
* included blog for WebdriverIO related news and article
* fixed links to edit certain documentation pages
* documentation page served via HTTPS per default

#### :house: Internal
* complete rearchitecturing of the whole project into a monorepo
    * new v5 codebase with all "offical" supported packages are at [`webdriverio/webdriverio`](https://github.com/webdriverio/webdriverio)
    * all depcrecated v4 packages can still be found at [github.com/webdriverio-boneyard](https://github.com/webdriverio-boneyard)
* moved all protocol commands into a [`webdriver`](https://www.npmjs.com/package/webdriver) base package
* project sub packages are now released within the `@wdio` NPM [organization](https://www.npmjs.com/org/wdio)
* renamed services, reporters and other internal packages (e.g. `wdio-sauce-service` → `@wdio/sauce-service`)
* removed all e2e tests from project to run as unit tests using [Jest](https://jestjs.io/) with a coverage of [~96%](https://codecov.io/gh/webdriverio/webdriverio)
* update to [Babel](https://babeljs.io/) v7 (latest) as well as various of other dependency updates with security fixes
* CPU and Memory improvements by reducing amount of IPC calls

#### :nail_care: Polish
* laid out better [governance model](https://github.com/webdriverio/webdriverio/blob/master/GOVERNANCE.md) for project
