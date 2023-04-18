---
id: timeouts
title: Timeouts
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Each command in WebdriverIO is an asynchronous operation. A request is fired to the Selenium server (or a cloud service like [Sauce Labs](https://saucelabs.com)), and its response contains the result once the action has completed or failed.

Therefore, time is a crucial component in the whole testing process. When a certain action depends on the state of a different action, you need to make sure that they get executed in the right order. Timeouts play an important role when dealing with these issues.

## Selenium timeouts

### Session Script Timeout

A session has an associated session script timeout that specifies a time to wait for asynchronous scripts to run. Unless stated otherwise, it is 30 seconds. You can set this timeout like so:

```js
await browser.setTimeout({ 'script': 60000 })
await browser.executeAsync((done) => {
    console.log('this should not fail')
    setTimeout(done, 59000)
})
```

### Session Page Load Timeout

A session has an associated session page load timeout that specifies a time to wait for the page loading to complete. Unless stated otherwise, it is 300,000 milliseconds.

You can set this timeout like so:

```js
await browser.setTimeout({ 'pageLoad': 10000 })
```

> The `pageLoad` keyword is a part of the official WebDriver [specification](https://www.w3.org/TR/webdriver/#set-timeouts), but might not be [supported](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) for your browser (the previous name is `page load`).

### Session Implicit Wait Timeout

A session has an associated session implicit wait timeout. This specifies the time to wait for the implicit element location strategy when locating elements using the [`findElement`](/docs/api/webdriver#findelement) or [`findElements`](/docs/api/webdriver#findelements) commands ([`$`](/docs/api/browser/$) or [`$$`](/docs/api/browser/$$), respectively, when running WebdriverIO with or without the WDIO testrunner). Unless stated otherwise, it is 0 milliseconds.

You can set this timeout via:

```js
await browser.setTimeout({ 'implicit': 5000 })
```

## WebdriverIO related timeouts

### `WaitFor*` timeout

WebdriverIO provides multiple commands to wait on elements to reach a certain state (e.g. enabled, visible, existing). These commands take a selector argument and a timeout number, which determines how long the instance should wait for that element to reach the state. The `waitforTimeout` option allows you to set the global timeout for all `waitFor*` commands, so you don't need to set the same timeout over and over again. _(Note the lowercase `f`!)_

```js
// wdio.conf.js
export const config = {
    // ...
    waitforTimeout: 5000,
    // ...
}
```

In your tests, you now can do this:

```js
const myElem = await $('#myElem')
await myElem.waitForDisplayed()

// you can also overwrite the default timeout if needed
await myElem.waitForDisplayed({ timeout: 10000 })
```

## Framework related timeouts

WebdriverIO के साथ आप जिस परीक्षण ढांचे का उपयोग कर रहे हैं, उसे टाइमआउट से निपटना है, खासकर जब से सब कुछ अतुल्यकालिक है। यह सुनिश्चित करता है कि कुछ गलत होने पर परीक्षण प्रक्रिया अटक न जाए।

डिफ़ॉल्ट रूप से, समय समाप्ति 10 सेकंड है, जिसका अर्थ है कि एक परीक्षण में इससे अधिक समय नहीं लगना चाहिए।

मोचा में एक भी परीक्षण ऐसा दिखता है:

```js
it('should login into the application', () => {
    await browser.url('/login')

    const form = await $('form')
    const username = await $('#username')
    const password = await $('#password')

    await username.setValue('userXY')
    await password.setValue('******')
    await form.submit()

    expect(await browser.getTitle()).to.be.equal('Admin Area')
})
```

ककड़ी में, टाइमआउट एकल चरण परिभाषा पर लागू होता है। हालाँकि, यदि आप टाइमआउट बढ़ाना चाहते हैं क्योंकि आपका परीक्षण डिफ़ॉल्ट मान से अधिक समय लेता है, तो आपको इसे फ्रेमवर्क विकल्पों में सेट करना होगा।

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'}
 ]
}>
<TabItem value="mocha">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="jasmine">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="cucumber">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
</Tabs>
