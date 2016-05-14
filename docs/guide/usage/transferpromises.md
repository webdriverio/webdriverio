name: transferpromises
category: usage
tags: guide
index: 5
title: WebdriverIO - Transfer Promises
---

Transfer Promises
=================

Per default the wdio testrunner transforms all commands to act like real synchronous commands. This way you don't need to deal with promises in any way. However if you don't use the wdio test runner or you have this behavior disabled you can use neat features of promises to write expressive tests with promised based assertion libraries like [chai-as-promised](https://github.com/domenic/chai-as-promised/).

```js
var client = require('webdriverio').remote({
    desiredCapabilities: {
        browserName: 'chrome'
    }
});
 
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.Should();
chai.use(chaiAsPromised);
chaiAsPromised.transferPromiseness = client.transferPromiseness;
 
describe('my app', function() {
    before(function () {
        return client.init();
    });
 
    it('should contain a certain text after clicking', function() {
        return client
            .click('button=Send')
            .isVisible('#status_message').should.eventually.be.true
            .getText('#status_message').should.eventually.be.equal('Message sent!');
    });
});
```

The example above shows a simple integration test where a user clicks on a "Send" button and a message gets sent. The test checks if a status message gets displayed with a certain text. By setting the `transferPromiseness` function to the internal correspondent of WebdriverIO you can start chaining assertions together with commands.
