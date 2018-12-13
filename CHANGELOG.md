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

## v5.0.0 (2018-tbd)

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
  // v5
  await browser.url('https://duckduckgo.com/')
  const elem = await browser.$('#search_form_input_homepage')
  await elem.click()
  ```
* every protocol command returns `value` property instead of raw driver response
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
* the `remote` and `multiremote` methods to initiate a driver instance now also start the driver session and therefor return a promise (no `init` command anymore)
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
        * `title`, `getTitle` → `getCurrentTitle`
        * `getUrl` → `getCurrentUrl`
        * `actions` → `performActions` (WebDriver protocol only)
        * `alertAccept` → `acceptAlert`
        * `alertDismiss` → `dismissAlert`
        * `alertText` → `getAlertText`, `sendAlertText`
        * `applicationCacheStatus` → `getApplicationCacheStatus` (JsonWireProtocol only)
        * `cookie` → `getAllCookies`, `addCookie`, `deleteCookie`
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
  const elem2 = $('myOtherElem')
  console.log(typeof elem.myCommand) // outputs "function"
  console.log(typeof elem2.myCommand) // outputs "undefined"
  ```

#### :eyeglasses: Spec Compliancy
*

#### :rocket: New Feature
*

#### :bug: Bug Fix
*

#### :memo: Documentation
*

#### :house: Internal
*

#### :nail_care: Polish
*
