---
title: Take a seat, WebdriverIO is driving for you!
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

Since its inception, WebdriverIO has been a powerful tool for automating browsers through the [WebDriver](https://w3c.github.io/webdriver/) protocol. As many of you know, WebDriver is the web standard for automating real browsers, not just browser engines, allowing you to closely simulate the environment used by your users and customers.

## Simplified Browser Automation Setup

To automate a browser, you need to set up a browser driver that translates WebDriver-based commands and executes them within the browser. While WebdriverIO has provided useful services like [`wdio-chromedriver-service`](https://github.com/webdriverio-community/wdio-chromedriver-service) to simplify test environment setup, there have been challenges, particularly when new Chrome versions are released 🙈.

<div style={{ width: '100%' }}>
    <div style={{ height: 0, paddingBottom: '56.25%', position: 'relative', width: '100%' }}>
        <iframe allowfullscreen="" frameBorder="0" height="100%" src="https://giphy.com/embed/xuaqgqXadAyg6ZUXHF/video" style={{ left: 0, position: 'absolute', top: 0 }} width="100%"></iframe>
    </div>
</div>

__But fear not!__ With the release of WebdriverIO version v8.14.0, and onwards, all driver management hassles are now a thing of the past 🙌. The WebdriverIO team has been hard at work, taking over the maintenance of [`geckodriver`](https://www.npmjs.com/package/geckodriver), [`edgedriver`](https://www.npmjs.com/package/edgedriver) and [`safaridriver`](https://www.npmjs.com/package/safaridriver) packages. This means smoother and more seamless browser automation experiences for you.

## Say Goodbye to Driver Services

One of the significant advantages of this update is that you can now get rid of any driver services you previously had to manage, such as `wdio-chromedriver-service`, `wdio-geckodriver-service`, `wdio-edgedriver-service`, `wdio-safaridriver-service`, and even `@wdio/selenium-standalone-service`.

## Specifying Browser Versions Made Easy

Testing Chrome locally is now more convenient than ever. You can define a browser channel, and WebdriverIO will take care of downloading the specified browser version for you. For example:

```js
{
    browserName: 'chrome',
    browserVersion: '116.0.5793.0' // or 'stable', 'dev' or 'canary'
}
```

## Effortless Testing on Microsoft Edge and Safari

WebdriverIO will now automatically detect the installed version of Microsoft Edge and download the appropriate Edgedriver for you. Similarly, testing on [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) is a breeze; just install it on your Mac machine and use `Safari Technology Preview` as the browser name.

## Customization and Flexibility

For those who require custom driver options, fear not; WebdriverIO allows you to pass in driver options through custom WebdriverIO [capabilities](/docs/capabilities/#webdriverio-capabilities-to-manage-browser-driver-options). If you have a custom grid, use a cloud service, or prefer to run your own driver, there's no need to worry since WebdriverIO will only start a driver when there are no other connection information settings like  [`hostname`](/docs/configuration#hostname) or [`port`](/docs/configuration#port) specified.

In conclusion, WebdriverIO version `v8.14.0` and beyond provides an incredibly smooth and seamless browser automation experience. With automated driver management, simplified browser version setup, and improved compatibility, your testing workflows are now more efficient and straightforward than ever before. Say goodbye to the bumpy automation rides and embrace the future of effortless browser testing with WebdriverIO! 🚀
