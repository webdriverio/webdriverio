name: transferpromises
category: usage
tags: guide
index: 5
title: WebdriverIO - Transfer Promises
---

Transfer Promises
=================

Since `v3` of WebdriverIO every command represents a promise. This allows us to introduce some neat
testing features when adding promised based assertion libraries like [chai-as-promised](https://github.com/domenic/chai-as-promised/).

```js
it('should contain a certain text after clicking', function() {
    return client
        .click('button=Send')
        .isVisible('#status_message').then(function(isVisible) {
            assert.ok(isVisible, 'status message is not visible');
        })
        .getText('#status_message').then(function(message) {
            assert.ok(message === 'Message sent!', 'wrong status message');
        });
});
```

The example above shows a simple integration test where a user clicks on a "Send" button and a message
gets send. The test checks if a status message gets displayed with a certain text. This already looks
pretty straightforward but by adding an assertion library like [chai-as-promised](https://github.com/domenic/chai-as-promised/)
we can shorten everything even more.

```js
before(function() {
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
&nbsp;
    chai.Should();
    chai.use(chaiAsPromised);
    chaiAsPromised.transferPromiseness = client.transferPromiseness;
});
```

Put this somewhere in your test setup (e.g. the before or onPrepare hook). It initialises [Chai](http://chaijs.com/)
as assertion library and hooks up WebdriverIO with [chai-as-promised](https://github.com/domenic/chai-as-promised/)
by setting the `transferPromiseness` function to the internal one of WebdriverIO. This allows us to write
super simple assertions like:

```js
it('should contain a certain text after clicking', function() {
    return client
        .click('button=Send')
        .isVisible('#status_message').should.eventually.be.true
        .getText('#status_message').should.eventually.be.equal('Message sent!');
});
```
