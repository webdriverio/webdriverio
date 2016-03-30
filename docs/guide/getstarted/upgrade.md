name: upgrade
category: getstarted
tags: guide
index: 5
title: WebdriverIO - How to upgrade from v3 to v4
---

How to upgrade from v3 to v4
============================

If you have already written tons of tests using v3 but you want to upgrade to v4 then you have two opportunities:

1. You can simply update to v4 and continue to run your tests asynchronous. To do so make sure to set the `sync` property in your `wdio.conf.js` to `false`. Note that in v4 wdio splits up the test specs and starts one session per capability per spec file. If you run your tests in the cloud make sure to limit this behavior (using [`maxInstances`](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L52-L60)) before you exceed the concurrency limit.
2. If you want to transform your test specs from asynchronous behavior using promises to synchronous but don't have time to rewrite your whole suite, you can run some specs asynchronous and some synchronous. First of all you need to set all spec function to run asynchronous. You can do that by giving each test block (e.g. `it` in Mochas BDD testing) or step definition the function name `async`:

```js
describe('some feature', function () {
    // ...
    it('I am an old test running asynchronous', function async () {
        return browser
            .url('...')
            .click('button=some button')
            .getText('.myElem').then(function (text) {
                expect(text).to.be.equal('some text');
            })
    });

    it('I am a new test running synchronous', function () {
        browser.url('...');

        var button = browser.element('.myButton');
        button.click();

        expect(browser.getText('label')).to.be.equal('some text');
    });
});
```

This way old and new tests can coexist and you can move your old test time after time to the new synchronous way of writing specs.

Also make sure to add the desired framework adapters to your dependencies. In v4 all frameworks as well as reporters live as own adapter packages on NPM and need to be additionally installed. Besides the spec reporter (will be published later too) we were able to port all frameworks and reporter into own packages.

Nevertheless an upgrade from v3 to v4 can lead to break your build even though you've configured everything properly. We can not guarantee that one of the steps above work for you. The worst case is that you have to stick to v3 or rewrite everything.
