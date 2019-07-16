DevTools
========

> A Chrome DevTools protocol binding that maps WebDriver commands into Chrome DevTools commands using [Puppeteer](https://www.npmjs.com/package/puppeteer)

This package provides a low level interface to run browser automation scripts based on the WebDriver protocol. If you are looking for a tool to automate Chrome or Firefox you should look up [Puppeteer](https://www.npmjs.com/package/puppeteer). This is suppose to be used by the [WebdriverIO](https://webdriver.io/) package in order to run its automation on the Chrome DevTools protocol.

This package is work in progress. The following commands are already supported:

- [ ] newSession
- [x] deleteSession
- [x] status
- [ ] getTimeouts
- [ ] setTimeouts
- [x] getUrl
- [x] navigateTo
- [x] back
- [x] forward
- [x] refresh
- [x] getTitle
- [x] getWindowHandle
- [x] closeWindow
- [x] switchToWindow
- [x] createWindow
- [x] getWindowHandles
- [ ] switchToFrame
- [ ] switchToParentFrame
- [ ] getWindowRect
- [ ] setWindowRect
- [ ] maximizeWindow
- [ ] minimizeWindow
- [ ] fullscreenWindow
- [x] findElement
- [x] findElements
- [x] findElementFromElement
- [x] findElementsFromElement
- [ ] getActiveElement
- [ ] isElementSelected
- [x] isElementDisplayed
- [x] getElementAttribute
- [x] getElementProperty
- [ ] getElementCSSValue
- [x] getElementText
- [x] getElementTagName
- [x] getElementRect
- [ ] isElementEnabled
- [x] elementClick
- [x] elementClear
- [x] elementSendKeys
- [x] getPageSource
- [ ] executeScript
- [ ] executeAsyncScript
- [x] getAllCookies
- [x] addCookie
- [ ] deleteAllCookies
- [ ] getNamedCookie
- [ ] deleteCookie
- [ ] performActions
- [ ] releaseActions
- [ ] dismissAlert
- [ ] acceptAlert
- [ ] getAlertText
- [ ] sendAlertText
- [ ] takeScreenshot
- [ ] takeElementScreenshot
