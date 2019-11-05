---
id: faq-capabilities
title: Capabilities Questions
---

#### Running in headless mode

Firefox
capabilities: {
    'moz:firefoxOptions': {
        args: ['-headless']
    }
}

Chrome
```js
capabilities: {
    'goog:chromeOptions': {
        args: ['--headless', '--no-sandbox'] // '--window-size=1920,1080'
    }
}
```

#### TypeError ... is not a function

TODO

- unsupported protocol command, example: you can't use Appium protocol commands in browsers
- avoid chaining a Promise in async functions `await $('foo').click()`
- using recently added command, update `webdriverio`, `webdriver` and all `@wdio` to the latest versions
