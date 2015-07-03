name: customcommands
category: usage
tags: guide
index: 1
title: WebdriverIO - Custom Commands
---

Custom Commands
===============

If you want to extend the client with your own set of commands there is a method
called `addCommand` available from the client object. The following example shows
how to add a new command that returns the current url and title as one result.

```js
client.addCommand("getUrlAndTitle", function(customVar) {
    return this.url().then(function(urlResult) {
        return this.getTitle().then(function(titleResult) {
            console.log(customVar); // "a custom variable"
            return { url: urlResult.value, title: titleResult };
        });
    });
});
```

After you added a command it is available for your instance.

```js
client
    .init()
    .url('http://www.github.com')
    .getUrlAndTitle('a custom variable',function(err,result){
        assert.equal(null, err)
        assert.strictEqual(result.url,'https://github.com/');
        assert.strictEqual(result.title,'GitHub · Build software better, together.');
    })
    .end();
```

By default WebdriverIO will throw an error if you try to overwrite an existing command.
You can bypass that behavior by passing `true` as 3rd parameter to the `addCommand`
function.

**Note:** the result of your custom command will be the result of the promise you return.
