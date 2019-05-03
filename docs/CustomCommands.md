---
id: customcommands
title: Custom Commands
---

If you want to extend the browser instance with your own set of commands there is a method called `addCommand` available from the browser object. You can write your command in a synchronous (default) way the same way as in your specs or asynchronous (like when using WebdriverIO in standalone mode). The following example shows how to add a new command that returns the current url and title as one result only using synchronous commands:

```js
browser.addCommand("getUrlAndTitle", function (customVar) {
    // `this` refers to the `browser` scope
    return {
        url: this.getUrl(),
        title: this.getTitle(),
        customVar: customVar
    };
});
```

Additionally, you can extend the element instance with your own set of commands, by passing 'true' as the final argument. By default element is expected to be existing in `waitforTimeout` milliseconds otherwise exception will be thrown.

```js
browser.addCommand("waitAndClick", function () {
    // `this` is return value of $(selector)
    this.waitForDisplayed();
    this.click();
}, true);
```

Custom commands give you the opportunity to bundle a specific sequence of commands that are used frequently in a handy single command call. You can define custom commands at any point in your test suite, just make sure that the command is defined before you first use it (the before hook in your wdio.conf.js might be a good point to create them). Once defined you can use them as follows:

```js
it('should use my custom command', () => {
    browser.url('http://www.github.com');
    const result = browser.getUrlAndTitle('foobar');

    assert.strictEqual(result.url, 'https://github.com/');
    assert.strictEqual(result.title, 'GitHub · Where software is built');
    assert.strictEqual(result.customVar, 'foobar');
});
```

If there is a need to control element existance in custom commands it is possible either to add command to browser and pass selector or add command to element with name that starts with one of: waitUntil, waitFor, isExisting, isDisplayed.

```js
browser.addCommand("isDisplayedWithin", function (timeout) {
    try {
        this.waitForDisplayed(timeout)
        return true
    } catch (err) {
        return false
    }
}, true);
```

__Note:__ if you register a custom command to the browser scope the command won't be accessible for elements. Likewise, if you register a command to the element scope, it won't be accessible at the browser scope:

```js
browser.addCommand("myCustomBrowserCommand", function () { return 1 });
const elem = $('body')
console.log(typeof browser.myCustomBrowserCommand); // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()); // outputs "undefined"

browser.addCommand("myCustomElementCommand", function () { return 1 }, true);
const elem2 = $('body')
console.log(typeof browser.myCustomElementCommand); // outputs "undefined"
console.log(elem2.myCustomElementCommand('foobar')); // outputs "function"

const elem3 = $('body')
elem3.addCommand("myCustomElementCommand2", function () { return 1 })
console.log(typeof browser.myCustomElementCommand2); // outputs "undefined"
console.log(elem3.myCustomElementCommand2('foobar')); // outputs "function"
```

Be careful to not overload the `browser` scope with custom commands. It is advised to rather define custom logic into page objects so they are bound to a specific page.

## Integrate 3rd party libraries

If you use external libraries (e.g. to do database calls) that support promises, a nice approach to easily integrate them is to wrap certain API methods within a custom command. When returning the promise, WebdriverIO ensures that it doesn't continue with the next command until the promise is resolved. If the promise gets rejected the command will throw an error.

```js
import request from 'request';

browser.addCommand('makeRequest', function (url) {
    return request.get(url).then((response) => response.body)
});
```

Then just use it in your wdio test specs synchronously:

```js
it('execute external library in a sync way', () => {
    browser.url('...');
    const body = browser.makeRequest('http://...');
    console.log(body); // returns response body
});
```

Note that the result of your custom command will be the result of the promise you return. Also there is no support for synchronous commands in standalone mode therefore you always have to handle asynchronous commands using promises.
