name: customcommands
category: usage
tags: guide
index: 1
title: WebdriverIO - Custom Commands
---

Custom Commands
===============

If you want to extend the browser instance with your own set of commands there is a method called `addCommand` available from the browser object. You can write your command in a synchronous (default) way the same way as in your specs or asynchronous (like when using WebdriverIO in standalone mode). The following example shows how to add a new command that returns the current url and title as one result only using synchronous commands:

```js
browser.addCommand("getUrlAndTitle", function (customVar) {
    return {
        url: this.getUrl(),
        title: this.getTitle(),
        customVar: customVar
    };
});
```

Custom commands give you the opportunity to bundle a specific sequence of commands that are used frequently in a handy single command call. You can define custom commands at any point in your test suite, just make sure that the command is defined before you first use it (the before hook in your wdio.conf.js might be a good point to create them). Also to note: custom commands, like all WebdriverIO commmands, can only be called inside a test hook or it block. In your spec file you can use them like this:

```js
it('should use my custom command', function () {
    browser.url('http://www.github.com');
    var result = browser.getUrlAndTitle('foobar');

    assert.strictEqual(result.url, 'https://github.com/');
    assert.strictEqual(result.title, 'GitHub · Where software is built');
    assert.strictEqual(result.customVar, 'foobar');
});
```

As mentioned earlier, you can define your command using good old promise syntax. This makes sense if you work with an additional 3rd party library that supports promises or if you want to execute both commands at the same time. Here is the async example, note that the custom command callback has a function name called `async`:

```js
client.addCommand("getUrlAndTitle", async function() {
    return Promise.all([
        this.getUrl(),
        this.getTitle()
    ]);
});
```

## Integrate 3rd party libraries

If you use external libraries (e.g. to do database calls) that support promises, a nice approach to easily integrate them is to wrap certain API methods within a custom command:

```js
browser.addCommand('doExternalJob', async function(params) {
    return externalLib.command(params);
});
```

Then just use it in your wdio test specs synchronously:

```js
it('execute external library in a sync way', function() {
    browser.url('...');
    browser.doExternalJob('someParam');
    console.log(browser.getTitle()); // returns some title
});
```

Note that the result of your custom command will be the result of the promise you return. Also there is no support for synchronous commands in standalone mode therefore you always have to handle asynchronous commands using Promises.

By default WebdriverIO will throw an error if you try to overwrite an existing command. You can bypass this behavior by passing `true` as 3rd parameter to the `addCommand` function.
