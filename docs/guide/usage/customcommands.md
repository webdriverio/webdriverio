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

**Note:** the last parameter has to be a callback function that needs to be called
when the command has finished (otherwise the queue stops).

```js
client.addCommand("getUrlAndTitle", function(customVar, cb) {
    this.url(function(err,urlResult) {
        this.getTitle(function(err,titleResult) {
            var specialResult = {url: urlResult.value, title: titleResult};
            cb(err,specialResult);
            console.log(customVar); // "a custom variable"
        })
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
